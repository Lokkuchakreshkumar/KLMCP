import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  fetchAttendanceFromGosynk,
  fetchInternalMarksFromGosynk,
  fetchTimetableFromGosynk,
} from "@/lib/gosynk-api-client";
import { getLmsDues } from "@/lib/lms-client";

const AI_INSTRUCTIONS = `
[CRITICAL FORMATTING & CALCULATION INSTRUCTIONS FOR AI]:
- **Attendance Grouping**: When the tool returns multiple components (L, T, P, S) for a single course, GROUP them under ONE course code header.
- **Attendance Weightage**: L (Lecture) & T (Tutorial) have 100% weightage. P (Practical) has 50% weightage. S (Skill) has 25% weightage.
- **Total Course Percentage**: If a user asks for a course's overall attendance, use the course-level grouped data from \`groupedCourses\`. That grouped data already represents the whole subject across only the components that actually exist for that course, with the proper weightages. Do NOT calculate the cumulative average across all subjects yourself.
- **Timetable**: Present the timetable as a beautifully formatted markdown table, grouped by day.
- **Internal marks**: Treat -2 or 0 as zero marks. Format as a clean table.
- **General Rule**: Use premium, minimalist markdown. Never output raw JSON.
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

export const createMcpServer = () => {
  const server = new McpServer({
    name: "klmcp-remote",
    version: "0.2.0",
  });

  const overrideSchema = {
    academicYear: z.string().optional(),
    semester: z.enum(["odd", "even"]).optional(),
  };

  server.tool(
    "get_timetable",
    "Fetches the student's KL University timetable.",
    overrideSchema,
    async (args, extra) => {
      const userContext = readUserContext(extra);
      const response = await fetchTimetableFromGosynk({
        ...userContext,
        academicYear: args.academicYear || userContext.academicYear,
        semester: args.semester || userContext.semester,
      });

      return asToolResult(response);
    },
  );

  server.tool(
    "get_attendance",
    "Fetches weighted course attendance from KL University ERP.",
    overrideSchema,
    async (args, extra) => {
      const userContext = readUserContext(extra);
      const response = await fetchAttendanceFromGosynk({
        ...userContext,
        academicYear: args.academicYear || userContext.academicYear,
        semester: args.semester || userContext.semester,
      });

      return asToolResult(response);
    },
  );

  server.tool(
    "get_internal_marks",
    "Fetches internal marks from KL University ERP.",
    {
      ...overrideSchema,
      courseQuery: z.string().optional(),
      componentQuery: z.string().optional(),
    },
    async (args, extra) => {
      const userContext = readUserContext(extra);
      const response = await fetchInternalMarksFromGosynk(
        {
          ...userContext,
          academicYear: args.academicYear || userContext.academicYear,
          semester: args.semester || userContext.semester,
        },
        {
          courseQuery: args.courseQuery,
          componentQuery: args.componentQuery,
        },
      );

      return asToolResult(response);
    },
  );

  server.tool(
    "get_lms_dues",
    "Fetches upcoming LMS dues and assignment timeline.",
    {},
    async (_args, extra) => {
      const userContext = readUserContext(extra);
      const response = await getLmsDues(userContext);
      return asToolResult(response);
    },
  );

  server.tool(
    "diagnose_student_access",
    "Checks whether ERP and LMS access currently work for the linked student credentials.",
    overrideSchema,
    async (args, extra) => {
      const userContext = readUserContext(extra);
      const academicYear = args.academicYear || userContext.academicYear;
      const semester = args.semester || userContext.semester;

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
    },
  );

  return server;
};
