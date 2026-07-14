import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  fetchAttendanceFromGosynk,
  fetchInternalMarksFromGosynk,
  fetchTimetableFromGosynk,
} from "@/lib/gosynk-api-client";
import { getLmsDues } from "@/lib/lms-client";
import {
  buildAttendanceRisk,
  calculateAttendance,
  getClassesForDate,
  getCurrentIstDate,
  normalizeLmsDues,
  pickNextClass,
  resolveStudentDate,
} from "@/lib/student-decision-layer";
import { trackToolCall } from "@/lib/usage-analytics";

const AI_INSTRUCTIONS = `
[CRITICAL FORMATTING & CALCULATION INSTRUCTIONS FOR AI]:
- **Attendance Grouping**: When the tool returns multiple components (L, T, P, S) for a single course, GROUP them under ONE course code header.
- **Attendance Weightage**: L (Lecture) & T (Tutorial) have 100% weightage. P (Practical) has 50% weightage. S (Skill) has 25% weightage.
- **Total Course Percentage & Proofs**: Use the course-level grouped data from \`groupedCourses\`. Do NOT just output text—you MUST show the mathematical proofs and calculations (e.g., how the weighted present and total counts result in the final percentage) so the user can verify the math. Do NOT calculate the cumulative average across all subjects yourself.
- **Attendance Calculator**: For every attendance, bunk, or absence projection question, use \`calculate_attendance\` or \`can_i_bunk_on\`. These tools are the source of truth. Never do LTPS arithmetic yourself or assume a missing component is L.
- **Timetable**: Present the timetable as a beautifully formatted markdown table, grouped by day.
- **Internal marks**: Treat -2 or 0 as zero marks. Format as a clean table.
- **General Rule (Rich Formatting)**: The output MUST use very rich, premium, and beautiful markdown formatting (use emojis, bold text, lists, and tables appropriately). Never output raw JSON.
- **Relative dates**: Never guess dates or weekdays yourself. For requests like "tomorrow", "after 1 week", "next Monday", or "should I bunk tomorrow", call a decision/date-aware tool and use its \`resolvedDate\` exactly.
- **Decision-first workflow**: Prefer the student decision tools (\`what_should_i_do_now\`, \`can_i_bunk_on\`, \`where_should_i_be_next\`, \`what_is_urgent_today\`, \`how_bad_is_my_attendance_risk\`) over raw ERP fetch tools when the user asks what to do, where to go, what changed, what is urgent, or whether skipping is safe.
`.trim();

const asToolResult = (payload) => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(payload, null, 2) + `\n\n${AI_INSTRUCTIONS}`,
    },
  ],
});

const readUserContext = (extra) => {
  const userContext = extra?.authInfo?.extra?.userContext;

  if (!userContext) {
    throw new Error("User context missing from access token.");
  }

  return userContext;
};

const readAcademicContext = (extra) => {
  const userContext = readUserContext(extra);
  return {
    ...userContext,
    academicYear: userContext.academicYear || "2026-2027",
    semester: userContext.semester,
  };
};

const fetchStudentSnapshot = async (extra, options = {}) => {
  const userContext = readAcademicContext(extra);
  const [timetable, attendance, lmsDues] = await Promise.all([
    options.timetable === false
      ? Promise.resolve(null)
      : fetchTimetableFromGosynk(userContext),
    options.attendance === false
      ? Promise.resolve(null)
      : fetchAttendanceFromGosynk(userContext),
    options.lmsDues === false ? Promise.resolve(null) : getLmsDues(userContext),
  ]);

  return {
    userContext,
    timetable,
    attendance,
    lmsDues,
  };
};

const withToolTracking = (toolName, handler) => async (args, extra) => {
  const startedAt = Date.now();

  try {
    const result = await handler(args, extra);
    await trackToolCall({
      toolName,
      extra,
      ok: true,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    await trackToolCall({
      toolName,
      extra,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

const plannedAbsenceSchema = z
  .object({
    courseCode: z.string().min(1).optional(),
    courseName: z.string().min(1).optional(),
    component: z.enum(["L", "T", "P", "S"]),
    count: z.number().int().positive().default(1),
  })
  .refine((value) => value.courseCode || value.courseName, {
    message: "Provide courseCode or courseName for each planned absence.",
  });

export const createMcpServer = () => {
  const server = new McpServer({
    name: "klmcp-remote",
    version: "0.2.0",
  });

  server.tool(
    "get_timetable",
    "Fetches the student's KL University timetable.",
    {},
    withToolTracking("get_timetable", async (args, extra) => {
      const userContext = readUserContext(extra);
      const response = await fetchTimetableFromGosynk({
        ...userContext,
        academicYear: userContext.academicYear || "2026-2027",
        semester: userContext.semester,
      });

      return asToolResult(response);
    }),
  );

  server.tool(
    "resolve_student_date",
    "Deterministically resolves student date phrases like today, tomorrow, after 1 week, next Monday, or YYYY-MM-DD in Asia/Kolkata. Use this before answering any date-sensitive question.",
    {
      targetDateText: z
        .string()
        .optional()
        .describe("The exact date phrase from the user, for example 'tomorrow', 'after 1 week', 'next Wednesday', or '2026-07-15'."),
    },
    withToolTracking("resolve_student_date", async (args) => {
      const now = getCurrentIstDate();
      return asToolResult({
        resolvedDate: resolveStudentDate(args.targetDateText || "today", now),
        today: resolveStudentDate("today", now),
        instruction:
          "Use resolvedDate.isoDate and resolvedDate.weekday exactly. Do not reinterpret the user's relative date phrase.",
      });
    }),
  );

  server.tool(
    "where_should_i_be_next",
    "Answers where the student should go next using timetable room/block/slot details, not a generic timetable dump.",
    {
      targetDateText: z
        .string()
        .optional()
        .describe("Optional date phrase. Defaults to today. Use the user's exact words when they ask about tomorrow, next week, etc."),
    },
    withToolTracking("where_should_i_be_next", async (args, extra) => {
      const { timetable } = await fetchStudentSnapshot(extra, {
        attendance: false,
        lmsDues: false,
      });
      const resolvedDate = resolveStudentDate(args.targetDateText || "today");
      const dayPlan = getClassesForDate(timetable, resolvedDate);
      const nextClass =
        resolvedDate.isoDate === resolveStudentDate("today").isoDate
          ? pickNextClass(timetable)
          : dayPlan.classes[0] || null;

      return asToolResult({
        resolvedDate,
        nextClass,
        classesForDay: dayPlan.classes,
        proof: {
          timetableRowsSeen: dayPlan.totalRowsSeen,
          matchedRows: dayPlan.classes.length,
          usedFallback: dayPlan.usedFallback,
        },
        instruction:
          "Answer with the next room/block/slot if present. If room or block is missing, say it is missing from ERP data instead of guessing.",
      });
    }),
  );

  server.tool(
    "get_attendance",
    "Fetches weighted course attendance from KL University ERP.",
    {},
    withToolTracking("get_attendance", async (args, extra) => {
      const userContext = readUserContext(extra);
      const response = await fetchAttendanceFromGosynk({
        ...userContext,
        academicYear: userContext.academicYear || "2026-2027",
        semester: userContext.semester,
      });

      return asToolResult(response);
    }),
  );

  server.tool(
    "calculate_attendance",
    "Deterministically calculates current or projected attendance from live ERP data using LTPS weights: L=1, T=1, P=0.5, S=0.25. Returns every formula step and never estimates unknown inputs.",
    {
      plannedAbsences: z
        .array(plannedAbsenceSchema)
        .optional()
        .describe("Optional planned missed sessions. Each item needs courseCode or courseName, component L/T/P/S, and count. Omit to calculate current attendance only."),
      minimumPercentage: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Attendance threshold to check. Defaults to 75."),
    },
    withToolTracking("calculate_attendance", async (args, extra) => {
      const { attendance } = await fetchStudentSnapshot(extra, {
        timetable: false,
        lmsDues: false,
      });
      const calculation = calculateAttendance(attendance, {
        plannedAbsences: args.plannedAbsences,
        minimumPercentage: args.minimumPercentage,
      });

      return asToolResult({
        ...calculation,
        instruction:
          "Present each course independently. Use calculation.steps in order: current weighted attendance, planned missed sessions, projected weighted attendance, then threshold check. Do not calculate an overall average. If invalidAbsences or unmatchedAbsences is non-empty, say the result cannot be verified for those entries.",
      });
    }),
  );

  server.tool(
    "how_bad_is_my_attendance_risk",
    "Ranks attendance by pain: what will hurt the student later, which courses are below or near 75%, and the math proof behind each risk.",
    {},
    withToolTracking("how_bad_is_my_attendance_risk", async (_args, extra) => {
      const { attendance } = await fetchStudentSnapshot(extra, {
        timetable: false,
        lmsDues: false,
      });
      const risks = buildAttendanceRisk(attendance);

      return asToolResult({
        risks,
        riskMeaning: {
          critical: "Below 75%. This can hurt immediately.",
          high: "75-79.99%. One or two misses may become painful.",
          medium: "80-84.99%. Watch it, but not panic territory.",
          low: "85% or above.",
          unknown: "ERP did not return enough totals to prove risk.",
        },
        instruction:
          "Lead with the riskiest courses and show proof strings. Do not calculate a cumulative average across unrelated subjects.",
      });
    }),
  );

  server.tool(
    "can_i_bunk_on",
    "Answers whether the student can skip classes on a specific date by combining that date's timetable with current weighted attendance and projected post-absence percentages.",
    {
      targetDateText: z
        .string()
        .optional()
        .describe("The user's date phrase, for example 'today', 'tomorrow', 'after 1 week', or 'next Friday'. Defaults to today."),
    },
    withToolTracking("can_i_bunk_on", async (args, extra) => {
      const { timetable, attendance } = await fetchStudentSnapshot(extra, {
        lmsDues: false,
      });
      const resolvedDate = resolveStudentDate(args.targetDateText || "today");
      const dayPlan = getClassesForDate(timetable, resolvedDate);
      const attendanceCalculation = calculateAttendance(attendance, {
        plannedAbsences: dayPlan.classes.map((classItem) => ({
          courseCode: classItem.courseCode,
          courseName: classItem.courseName,
          component: classItem.component,
          count: 1,
        })),
      });
      const riskyAfterBunk = attendanceCalculation.calculations.filter((item) =>
        ["critical", "high"].includes(item.riskAfterAbsences),
      );
      const cannotVerify =
        attendanceCalculation.invalidAbsences.length > 0 ||
        attendanceCalculation.unmatchedAbsences.length > 0;

      return asToolResult({
        resolvedDate,
        classesConsidered: dayPlan.classes,
        attendanceCalculation,
        answer:
          dayPlan.classes.length === 0
            ? "No classes were found for this date in the timetable payload."
            : cannotVerify
              ? "Cannot safely verify every scheduled class because ERP data is missing a course match, totals, or a valid LTPS component."
            : riskyAfterBunk.length
              ? "Skipping is risky for at least one scheduled class."
              : "Skipping does not appear to push any scheduled course into high or critical risk, based on verified ERP data.",
        proof: {
          timetableRowsSeen: dayPlan.totalRowsSeen,
          matchedRows: dayPlan.classes.length,
          usedFallback: dayPlan.usedFallback,
        },
        instruction:
          "Give a direct yes/no/maybe answer, then show each affected course using attendanceCalculation.calculations and its four calculation steps. Never calculate attendance yourself. If invalidAbsences or unmatchedAbsences is non-empty, lead with what could not be verified.",
      });
    }),
  );

  server.tool(
    "get_internal_marks",
    "Fetches internal marks from KL University ERP.",
    {
      courseQuery: z.string().optional(),
      componentQuery: z.string().optional(),
    },
    withToolTracking("get_internal_marks", async (args, extra) => {
      const userContext = readUserContext(extra);
      const response = await fetchInternalMarksFromGosynk(
        {
          ...userContext,
          academicYear: userContext.academicYear || "2026-2027",
          semester: userContext.semester,
        },
        {
          courseQuery: args.courseQuery,
          componentQuery: args.componentQuery,
        },
      );

      return asToolResult(response);
    }),
  );

  server.tool(
    "get_lms_dues",
    "Fetches upcoming LMS dues and assignment timeline.",
    {},
    withToolTracking("get_lms_dues", async (_args, extra) => {
      const userContext = readUserContext(extra);
      const response = await getLmsDues(userContext);
      return asToolResult(response);
    }),
  );

  server.tool(
    "what_is_urgent_today",
    "Separates urgent student work from noise: today's classes, attendance danger, and LMS dues due soon.",
    {},
    withToolTracking("what_is_urgent_today", async (_args, extra) => {
      const now = getCurrentIstDate();
      const { timetable, attendance, lmsDues } = await fetchStudentSnapshot(extra);
      const resolvedDate = resolveStudentDate("today", now);
      const todayClasses = getClassesForDate(timetable, resolvedDate);
      const risks = buildAttendanceRisk(attendance).filter((item) =>
        ["critical", "high"].includes(item.risk),
      );
      const dues = normalizeLmsDues(lmsDues, now).filter((item) =>
        ["overdue", "today", "soon"].includes(item.urgency),
      );

      return asToolResult({
        resolvedDate,
        classesToday: todayClasses.classes,
        attendanceRisks: risks,
        urgentDues: dues,
        instruction:
          "Prioritize: overdue/today dues, next class location, critical attendance. Keep low-risk or later items out of the main answer.",
      });
    }),
  );

  server.tool(
    "what_should_i_do_now",
    "Gives one decision-focused answer for the student right now: next place to go, urgent deadlines, and attendance risks.",
    {},
    withToolTracking("what_should_i_do_now", async (_args, extra) => {
      const now = getCurrentIstDate();
      const { timetable, attendance, lmsDues } = await fetchStudentSnapshot(extra);
      const resolvedDate = resolveStudentDate("today", now);
      const todayClasses = getClassesForDate(timetable, resolvedDate);
      const nextClass = pickNextClass(timetable, now);
      const urgentDues = normalizeLmsDues(lmsDues, now).filter((item) =>
        ["overdue", "today"].includes(item.urgency),
      );
      const attendanceRisks = buildAttendanceRisk(attendance).filter((item) =>
        ["critical", "high"].includes(item.risk),
      );

      return asToolResult({
        now: {
          isoDate: resolvedDate.isoDate,
          weekday: resolvedDate.weekday,
          timeZone: resolvedDate.timeZone,
        },
        nextClass,
        classesToday: todayClasses.classes,
        urgentDues,
        attendanceRisks,
        recommendedOrder: [
          "Handle overdue/today LMS dues first if any exist.",
          "Go to the next scheduled class location if a class is upcoming.",
          "Avoid skipping high/critical attendance courses.",
        ],
        instruction:
          "Answer as a short decision list. Do not dump all timetable or attendance data unless the user asks.",
      });
    }),
  );

  server.tool(
    "how_should_i_plan_my_day",
    "Builds a fast student day plan from timetable, urgent LMS dues, and attendance risk.",
    {
      targetDateText: z
        .string()
        .optional()
        .describe("Optional date phrase. Defaults to today; pass user's exact phrase for tomorrow/next week questions."),
    },
    withToolTracking("how_should_i_plan_my_day", async (args, extra) => {
      const { timetable, attendance, lmsDues } = await fetchStudentSnapshot(extra);
      const resolvedDate = resolveStudentDate(args.targetDateText || "today");
      const classesForDay = getClassesForDate(timetable, resolvedDate);
      const riskyCourses = buildAttendanceRisk(attendance).filter((item) =>
        ["critical", "high"].includes(item.risk),
      );
      const dues = normalizeLmsDues(lmsDues).slice(0, 5);

      return asToolResult({
        resolvedDate,
        classesForDay: classesForDay.classes,
        riskyCourses,
        upcomingDues: dues,
        planningRules: [
          "Attend high/critical attendance courses.",
          "Put overdue/today LMS dues before low-risk study tasks.",
          "Use room/block/slot from ERP; do not infer missing locations.",
        ],
      });
    }),
  );

  server.tool(
    "what_changed_since_yesterday",
    "Explains what changed since yesterday. Currently returns a fresh check summary and explicitly reports that persistent delta history is not enabled yet.",
    {},
    withToolTracking("what_changed_since_yesterday", async (_args, extra) => {
      const now = getCurrentIstDate();
      const { timetable, attendance, lmsDues } = await fetchStudentSnapshot(extra);
      const today = resolveStudentDate("today", now);
      const yesterday = resolveStudentDate("yesterday", now);

      return asToolResult({
        deltaAvailable: false,
        reason:
          "KLMCP does not yet persist per-student timetable/attendance/LMS snapshots for historical comparison.",
        comparedRange: {
          from: yesterday,
          to: today,
        },
        freshStatus: {
          todayClasses: getClassesForDate(timetable, today).classes,
          attendanceRisks: buildAttendanceRisk(attendance).filter((item) =>
            ["critical", "high"].includes(item.risk),
          ),
          urgentDues: normalizeLmsDues(lmsDues, now).filter((item) =>
            ["overdue", "today", "soon"].includes(item.urgency),
          ),
        },
        instruction:
          "Be honest that true deltas need stored snapshots. Then summarize what is currently worth the student's attention.",
      });
    }),
  );

  server.tool(
    "what_will_affect_my_grade",
    "Finds grade-affecting items from internal marks and LMS dues without mixing them with low-value noise.",
    {
      courseQuery: z.string().optional(),
    },
    withToolTracking("what_will_affect_my_grade", async (args, extra) => {
      const userContext = readAcademicContext(extra);
      const [internalMarks, lmsDues] = await Promise.all([
        fetchInternalMarksFromGosynk(userContext, {
          courseQuery: args.courseQuery,
        }),
        getLmsDues(userContext),
      ]);

      return asToolResult({
        internalMarks,
        upcomingDues: normalizeLmsDues(lmsDues).filter((item) =>
          ["overdue", "today", "soon"].includes(item.urgency),
        ),
        instruction:
          "Focus on missing/zero/-2 marks, low components, and due submissions. Treat -2 or 0 as zero marks.",
      });
    }),
  );

  server.tool(
    "diagnose_student_access",
    "Checks whether ERP and LMS access currently work for the linked student credentials.",
    {},
    withToolTracking("diagnose_student_access", async (args, extra) => {
      const userContext = readUserContext(extra);
      const academicYear = userContext.academicYear || "2026-2027";
      const semester = userContext.semester;

      const diagnostics = {
        erpTimetable: { ok: false, message: "" },
        erpAttendance: { ok: false, message: "" },
        lmsDues: { ok: false, message: "" },
      };

      try {
        await fetchTimetableFromGosynk({
          ...userContext,
          academicYear,
          semester,
        });
        diagnostics.erpTimetable = { ok: true, message: "Timetable access works." };
      } catch (error) {
        diagnostics.erpTimetable = {
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        };
      }

      try {
        await fetchAttendanceFromGosynk({
          ...userContext,
          academicYear,
          semester,
        });
        diagnostics.erpAttendance = { ok: true, message: "Attendance access works." };
      } catch (error) {
        diagnostics.erpAttendance = {
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        };
      }

      try {
        await getLmsDues(userContext);
        diagnostics.lmsDues = { ok: true, message: "LMS dues access works." };
      } catch (error) {
        diagnostics.lmsDues = {
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        };
      }

      return asToolResult({ diagnostics });
    }),
  );

  return server;
};
