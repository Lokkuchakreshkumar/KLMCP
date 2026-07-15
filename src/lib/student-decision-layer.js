const IST_TIME_ZONE = "Asia/Kolkata";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SHORT_DAY_NAMES = DAY_NAMES.map((day) => day.slice(0, 3).toLowerCase());

export const ATTENDANCE_COMPONENT_WEIGHTS = {
  L: 1,
  T: 1,
  P: 0.5,
  S: 0.25,
};

const DEFAULT_ATTENDANCE_THRESHOLD = 75;

const pad2 = (value) => String(value).padStart(2, "0");

export const getCurrentIstDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date())
    .reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
};

const toIsoDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const describeResolvedDate = (date) => ({
  isoDate: toIsoDate(date),
  weekday: DAY_NAMES[date.getDay()],
  timeZone: IST_TIME_ZONE,
});

export const resolveStudentDate = (targetDateText = "today", now = getCurrentIstDate()) => {
  const rawText = String(targetDateText || "today").trim();
  const text = rawText.toLowerCase();
  const today = startOfDay(now);

  const exactDateMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (exactDateMatch) {
    const [, year, month, day] = exactDateMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return {
      input: rawText,
      ...describeResolvedDate(date),
      rule: "Parsed explicit YYYY-MM-DD date.",
    };
  }

  if (/\bday after tomorrow\b/.test(text)) {
    return {
      input: rawText,
      ...describeResolvedDate(addDays(today, 2)),
      rule: "Resolved 'day after tomorrow' as today + 2 days.",
    };
  }

  if (/\btomorrow\b/.test(text)) {
    return {
      input: rawText,
      ...describeResolvedDate(addDays(today, 1)),
      rule: "Resolved 'tomorrow' as today + 1 day.",
    };
  }

  if (/\byesterday\b/.test(text)) {
    return {
      input: rawText,
      ...describeResolvedDate(addDays(today, -1)),
      rule: "Resolved 'yesterday' as today - 1 day.",
    };
  }

  const afterDaysMatch = text.match(/\b(?:after|in)\s+(\d+)\s+days?\b/);
  if (afterDaysMatch) {
    const days = Number(afterDaysMatch[1]);
    return {
      input: rawText,
      ...describeResolvedDate(addDays(today, days)),
      rule: `Resolved relative offset as today + ${days} days.`,
    };
  }

  const afterWeeksMatch = text.match(/\b(?:after|in)\s+(\d+)\s+weeks?\b/);
  if (afterWeeksMatch) {
    const days = Number(afterWeeksMatch[1]) * 7;
    return {
      input: rawText,
      ...describeResolvedDate(addDays(today, days)),
      rule: `Resolved relative offset as today + ${days} days.`,
    };
  }

  if (/\bnext week\b/.test(text) || /\bafter one week\b/.test(text)) {
    return {
      input: rawText,
      ...describeResolvedDate(addDays(today, 7)),
      rule: "Resolved 'next week' as the same weekday + 7 days.",
    };
  }

  const dayIndex = DAY_NAMES.findIndex((day) => {
    const lower = day.toLowerCase();
    return new RegExp(`\\b(?:next\\s+)?${lower}\\b`).test(text);
  });

  if (dayIndex >= 0) {
    const wantsNext = new RegExp(`\\bnext\\s+${DAY_NAMES[dayIndex].toLowerCase()}\\b`).test(text);
    let offset = (dayIndex - today.getDay() + 7) % 7;
    if (wantsNext || offset === 0) {
      offset += 7;
    }
    return {
      input: rawText,
      ...describeResolvedDate(addDays(today, offset)),
      rule: wantsNext
        ? `Resolved next ${DAY_NAMES[dayIndex]} as the upcoming ${DAY_NAMES[dayIndex]} after this week.`
        : `Resolved ${DAY_NAMES[dayIndex]} as the next upcoming ${DAY_NAMES[dayIndex]}.`,
    };
  }

  return {
    input: rawText,
    ...describeResolvedDate(today),
    rule: "No date phrase provided; defaulted to today in Asia/Kolkata.",
  };
};

const getValue = (object, names) => {
  if (!object || typeof object !== "object") {
    return undefined;
  }

  for (const [key, value] of Object.entries(object)) {
    const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, "");
    if (names.some((name) => normalizedKey === name)) {
      return value;
    }
  }

  return undefined;
};

const asNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : undefined;
  }

  return undefined;
};

const collectObjects = (value, result = []) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectObjects(item, result));
    return result;
  }

  if (value && typeof value === "object") {
    result.push(value);
    Object.values(value).forEach((item) => collectObjects(item, result));
  }

  return result;
};

const unwrapData = (payload) => payload?.data ?? payload;

const normalizeComponent = (value) => {
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/\b([LTPS])\b|^([LTPS])/);
  return match?.[1] || match?.[2] || "";
};

const normalizeCourseCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

const normalizeTimetableRow = (row) => {
  const day = getValue(row, ["day", "weekday", "classname"]);
  const date = getValue(row, ["date", "classdate", "scheduleddate"]);
  const courseCode = getValue(row, [
    "coursecode",
    "subjectcode",
    "course",
    "subject",
    "coursename",
    "subjectname",
  ]);
  const courseName = getValue(row, ["coursename", "subjectname", "title", "name"]);
  const component = getValue(row, ["component", "type", "coursetype", "classcomponent"]);
  const startTime = getValue(row, ["starttime", "from", "fromtime", "start"]);
  const endTime = getValue(row, ["endtime", "to", "totime", "end"]);
  const slot = getValue(row, ["slot", "period", "hour", "timing", "time"]);
  const room = getValue(row, ["room", "roomno", "classroom", "venue"]);
  const block = getValue(row, ["block", "building", "location"]);

  return {
    raw: row,
    day: day ? String(day) : "",
    date: date ? String(date) : "",
    courseCode: normalizeCourseCode(courseCode),
    courseName: courseName ? String(courseName).trim() : "",
    component: normalizeComponent(component),
    startTime: startTime ? String(startTime).trim() : "",
    endTime: endTime ? String(endTime).trim() : "",
    slot: slot ? String(slot).trim() : "",
    room: room ? String(room).trim() : "",
    block: block ? String(block).trim() : "",
  };
};

const looksLikeTimetableRow = (row) => {
  const normalized = normalizeTimetableRow(row);
  return Boolean(
    normalized.courseCode ||
      normalized.courseName ||
      normalized.room ||
      normalized.slot ||
      normalized.startTime,
  );
};

export const extractTimetableRows = (payload) =>
  collectObjects(unwrapData(payload))
    .filter(looksLikeTimetableRow)
    .map(normalizeTimetableRow);

const rowMatchesResolvedDate = (row, resolvedDate) => {
  if (row.date && row.date.includes(resolvedDate.isoDate)) {
    return true;
  }

  if (!row.day) {
    return false;
  }

  const normalizedDay = row.day.toLowerCase();
  const weekday = resolvedDate.weekday.toLowerCase();
  const shortWeekday = weekday.slice(0, 3);
  return (
    normalizedDay.includes(weekday) ||
    SHORT_DAY_NAMES.some((shortDay, index) => {
      if (shortDay !== shortWeekday) {
        return false;
      }
      return normalizedDay.includes(shortDay) || normalizedDay.includes(DAY_NAMES[index].toLowerCase());
    })
  );
};

export const getClassesForDate = (timetablePayload, resolvedDate) => {
  const rows = extractTimetableRows(timetablePayload);
  const classes = rows.filter((row) => rowMatchesResolvedDate(row, resolvedDate));
  const usedFallback = !classes.length && rows.length > 0 && rows.every((row) => !row.day && !row.date);

  return {
    classes: usedFallback ? rows : classes,
    totalRowsSeen: rows.length,
    usedFallback,
  };
};

const normalizeAttendanceRow = (row) => {
  const courseCode = getValue(row, ["coursecode", "subjectcode", "course", "subject"]);
  const courseName = getValue(row, ["coursename", "subjectname", "description", "name", "title"]);
  const component = getValue(row, ["component", "type", "coursetype"]);
  const present = getValue(row, ["present", "attended", "classesattended", "presentclasses"]);
  const total = getValue(row, ["total", "conducted", "classesconducted", "totalclasses"]);
  const percentage = getValue(row, ["percentage", "percent", "attendancepercentage"]);
  const weightedPresent = getValue(row, ["weightedpresent", "weightedattended"]);
  const weightedTotal = getValue(row, ["weightedtotal", "weightedconducted"]);

  return {
    raw: row,
    courseCode: normalizeCourseCode(courseCode),
    courseName: courseName ? String(courseName).trim() : "",
    component: normalizeComponent(component),
    present: asNumber(present),
    total: asNumber(total),
    percentage: asNumber(percentage),
    weightedPresent: asNumber(weightedPresent),
    weightedTotal: asNumber(weightedTotal),
  };
};

const looksLikeAttendanceRow = (row) => {
  const normalized = normalizeAttendanceRow(row);
  return Boolean(
    (normalized.courseCode || normalized.courseName) &&
      (normalized.percentage !== undefined ||
        normalized.present !== undefined ||
        normalized.total !== undefined ||
        normalized.weightedTotal !== undefined),
  );
};

export const extractAttendanceRows = (payload) =>
  collectObjects(unwrapData(payload))
    .filter(looksLikeAttendanceRow)
    .map(normalizeAttendanceRow);

const isUsefulCourseName = (courseName, courseCode) => {
  const name = String(courseName || "").trim();
  return Boolean(name && normalizeCourseCode(name) !== normalizeCourseCode(courseCode));
};

/**
 * Builds a per-student directory from data the university already exposes.
 * This intentionally does not guess names from course codes: curriculum codes
 * are not globally unique across programmes, batches, and electives.
 */
export const buildSubjectDirectory = ({ timetable, attendance, internalMarks, lmsDues } = {}) => {
  const subjects = new Map();

  const add = ({ courseCode, courseName, source }) => {
    const code = normalizeCourseCode(courseCode);
    const name = String(courseName || "").trim();

    if (!code) {
      return;
    }

    const subject = subjects.get(code) || {
      courseCode: code,
      courseName: "",
      sources: [],
      nameVerified: false,
    };

    if (isUsefulCourseName(name, code)) {
      subject.courseName = subject.courseName || name;
      subject.nameVerified = true;
    }
    if (!subject.sources.includes(source)) {
      subject.sources.push(source);
    }
    subjects.set(code, subject);
  };

  extractTimetableRows(timetable).forEach((row) =>
    add({ ...row, source: "ERP timetable" }),
  );
  extractAttendanceRows(attendance).forEach((row) =>
    add({ ...row, source: "ERP attendance" }),
  );
  (unwrapData(internalMarks)?.overview?.courses || []).forEach((course) =>
    add({
      courseCode: course.courseCode,
      courseName: course.courseName,
      source: "ERP internal marks",
    }),
  );
  (lmsDues?.structured || []).forEach((item) =>
    add({
      courseCode: item.courseCode,
      courseName: item.courseName,
      source: "Moodle course",
    }),
  );

  return [...subjects.values()].sort((a, b) =>
    a.courseCode.localeCompare(b.courseCode),
  );
};

export const buildAttendanceGroups = (attendancePayload) => {
  const rows = extractAttendanceRows(attendancePayload);
  const groups = new Map();

  for (const row of rows) {
    const key = row.courseCode || row.courseName || "UNKNOWN";
    const existing = groups.get(key) || {
      courseCode: row.courseCode,
      courseName: row.courseName,
      weightedPresent: 0,
      weightedTotal: 0,
      components: [],
      sourceRows: 0,
      hasUnweightedComponents: false,
    };
    const weight = ATTENDANCE_COMPONENT_WEIGHTS[row.component];
    const hasPreweightedTotals =
      row.weightedPresent !== undefined && row.weightedTotal !== undefined;
    const hasRawTotals = row.present !== undefined && row.total !== undefined;
    const present = row.weightedPresent ?? (weight !== undefined ? row.present * weight : undefined);
    const total = row.weightedTotal ?? (weight !== undefined ? row.total * weight : undefined);

    if (hasRawTotals && !hasPreweightedTotals && weight === undefined) {
      existing.hasUnweightedComponents = true;
    }

    if (present !== undefined && total !== undefined) {
      existing.weightedPresent += present;
      existing.weightedTotal += total;
    } else if (row.percentage !== undefined && existing.weightedTotal === 0) {
      existing.percentage = row.percentage;
    }

    existing.components.push({
      component: row.component || "unknown",
      weight: weight ?? null,
      present: row.present,
      total: row.total,
      weightedPresent: present,
      weightedTotal: total,
      percentage: row.percentage,
    });
    existing.sourceRows += 1;
    groups.set(key, existing);
  }

  return [...groups.values()].map((group) => {
    const percentage =
      !group.hasUnweightedComponents && group.weightedTotal > 0
        ? Number(((group.weightedPresent / group.weightedTotal) * 100).toFixed(2))
        : group.percentage;

    return {
      ...group,
      percentage,
      proof:
        !group.hasUnweightedComponents && group.weightedTotal > 0
          ? `${group.weightedPresent.toFixed(2)} / ${group.weightedTotal.toFixed(2)} * 100 = ${percentage}%`
          : "Could not prove percentage because ERP data is missing an LTPS component or weighted totals.",
    };
  });
};

export const classifyAttendanceRisk = (percentage, minimumPercentage = DEFAULT_ATTENDANCE_THRESHOLD) => {
  if (percentage === undefined) {
    return "unknown";
  }
  if (percentage < minimumPercentage) {
    return "critical";
  }
  if (percentage < minimumPercentage + 5) {
    return "high";
  }
  if (percentage < minimumPercentage + 10) {
    return "medium";
  }
  return "low";
};

export const buildAttendanceRisk = (attendancePayload) =>
  buildAttendanceGroups(attendancePayload)
    .map((group) => ({
      ...group,
      risk: classifyAttendanceRisk(group.percentage),
      marginTo75:
        group.percentage !== undefined && group.weightedTotal > 0
          ? Number((group.weightedPresent - 0.75 * group.weightedTotal).toFixed(2))
          : undefined,
    }))
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 };
      return rank[a.risk] - rank[b.risk] || (a.percentage ?? 999) - (b.percentage ?? 999);
    });

const attendanceCourseKey = (item) =>
  normalizeCourseCode(item.courseCode || item.courseName);

const round = (value) => Number(value.toFixed(2));

const buildCourseCalculation = (group, absences, minimumPercentage) => {
  const missedWeight = absences.reduce(
    (total, absence) => total + ATTENDANCE_COMPONENT_WEIGHTS[absence.component] * absence.count,
    0,
  );
  const projectedTotal = group.weightedTotal + missedWeight;
  const projectedPercentage = round((group.weightedPresent / projectedTotal) * 100);

  return {
    courseCode: group.courseCode,
    courseName: group.courseName,
    currentPercentage: group.percentage,
    projectedPercentage,
    percentageDrop: round((group.percentage ?? projectedPercentage) - projectedPercentage),
    riskAfterAbsences: classifyAttendanceRisk(projectedPercentage, minimumPercentage),
    isBelowMinimumAfterAbsences: projectedPercentage < minimumPercentage,
    calculation: {
      formula: "attendance % = weighted present / weighted total * 100",
      minimumPercentage,
      steps: [
        {
          step: 1,
          label: "Current weighted attendance",
          weightedPresent: group.weightedPresent,
          weightedTotal: group.weightedTotal,
          proof: `${group.weightedPresent.toFixed(2)} / ${group.weightedTotal.toFixed(2)} * 100 = ${group.percentage}%`,
        },
        {
          step: 2,
          label: "Planned missed sessions",
          absences: absences.map((absence) => ({
            component: absence.component,
            count: absence.count,
            weight: ATTENDANCE_COMPONENT_WEIGHTS[absence.component],
            weightedMissedClasses: round(
              ATTENDANCE_COMPONENT_WEIGHTS[absence.component] * absence.count,
            ),
          })),
          totalWeightedMissedClasses: round(missedWeight),
          proof: absences
            .map(
              (absence) =>
                `${absence.count} ${absence.component} x ${ATTENDANCE_COMPONENT_WEIGHTS[absence.component]}`,
            )
            .join(" + ") || "No planned absences. Weighted missed classes = 0.",
        },
        {
          step: 3,
          label: "Projected weighted attendance",
          weightedPresent: group.weightedPresent,
          projectedWeightedTotal: projectedTotal,
          proof: `${group.weightedPresent.toFixed(2)} / ${projectedTotal.toFixed(2)} * 100 = ${projectedPercentage}%`,
        },
        {
          step: 4,
          label: "Threshold check",
          proof: `${projectedPercentage}% ${projectedPercentage < minimumPercentage ? "<" : ">="} ${minimumPercentage}%`,
        },
      ],
    },
  };
};

export const calculateAttendance = (
  attendancePayload,
  { plannedAbsences = [], minimumPercentage = DEFAULT_ATTENDANCE_THRESHOLD } = {},
) => {
  const groups = buildAttendanceGroups(attendancePayload);
  const byCourse = new Map(
    groups.map((group) => [attendanceCourseKey(group), group]),
  );
  const absencesByCourse = new Map();
  const invalidAbsences = [];

  for (const absence of plannedAbsences) {
    const courseKey = attendanceCourseKey(absence);
    const component = normalizeComponent(absence.component);
    const count = asNumber(absence.count) ?? 1;

    if (!courseKey || !ATTENDANCE_COMPONENT_WEIGHTS[component] || !Number.isInteger(count) || count <= 0) {
      invalidAbsences.push({
        ...absence,
        message:
          "Each planned absence needs a course and a valid L, T, P, or S component with a positive whole-number count.",
      });
      continue;
    }

    const items = absencesByCourse.get(courseKey) || [];
    const existing = items.find((item) => item.component === component);
    if (existing) {
      existing.count += count;
    } else {
      items.push({ component, count });
    }
    absencesByCourse.set(courseKey, items);
  }

  const calculations = [];
  const unmatchedAbsences = [];

  for (const [courseKey, absences] of absencesByCourse) {
    const group = byCourse.get(courseKey);
    if (!group || group.weightedTotal <= 0 || group.hasUnweightedComponents) {
      unmatchedAbsences.push({
        courseKey,
        absences,
        message: "No complete, verifiable LTPS-weighted attendance totals were found for this course, so no percentage was calculated.",
      });
      continue;
    }

    calculations.push(buildCourseCalculation(group, absences, minimumPercentage));
  }

  return {
    formula: "attendance % = weighted present / weighted total * 100",
    componentWeights: ATTENDANCE_COMPONENT_WEIGHTS,
    minimumPercentage,
    currentCourses: groups.map((group) => ({
      ...group,
      risk: classifyAttendanceRisk(group.percentage, minimumPercentage),
    })),
    currentCalculations: groups
      .filter((group) => group.weightedTotal > 0 && !group.hasUnweightedComponents)
      .map((group) => buildCourseCalculation(group, [], minimumPercentage)),
    plannedAbsences: [...absencesByCourse.entries()].map(([courseKey, absences]) => ({
      courseKey,
      absences,
    })),
    calculations: calculations.sort(
      (a, b) => (a.projectedPercentage ?? 999) - (b.projectedPercentage ?? 999),
    ),
    unmatchedAbsences,
    invalidAbsences,
  };
};

export const projectAttendanceAfterMissingClasses = (attendancePayload, classes) => {
  const plannedAbsences = classes.map((classItem) => ({
    courseCode: classItem.courseCode,
    courseName: classItem.courseName,
    component: classItem.component,
    count: 1,
  }));
  const calculation = calculateAttendance(attendancePayload, { plannedAbsences });

  return calculation.calculations.map((item) => ({
    ...item,
    riskAfterBunk: item.riskAfterAbsences,
    drop: item.percentageDrop,
    proof: item.calculation.steps[2].proof,
  }));
};

export const normalizeLmsDues = (lmsPayload, now = getCurrentIstDate()) => {
  const nowMs = now.getTime();
  return (lmsPayload?.structured || [])
    .map((item) => {
      const dueMs = item.dueTimestamp ? item.dueTimestamp * 1000 : undefined;
      const hoursUntilDue = dueMs ? Number(((dueMs - nowMs) / 36e5).toFixed(1)) : undefined;
      return {
        ...item,
        hoursUntilDue,
        urgency:
          hoursUntilDue === undefined
            ? "unknown"
            : hoursUntilDue < 0
              ? "overdue"
              : hoursUntilDue <= 24
                ? "today"
                : hoursUntilDue <= 72
                  ? "soon"
                  : "later",
      };
    })
    .sort((a, b) => (a.dueTimestamp ?? Infinity) - (b.dueTimestamp ?? Infinity));
};

export const pickNextClass = (timetablePayload, now = getCurrentIstDate()) => {
  const resolvedToday = resolveStudentDate("today", now);
  const todayClasses = getClassesForDate(timetablePayload, resolvedToday).classes;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const timedClasses = todayClasses
    .map((item) => {
      const timeText = item.startTime || item.slot;
      const match = String(timeText).match(/(\d{1,2}):(\d{2})/);
      const minutes = match ? Number(match[1]) * 60 + Number(match[2]) : undefined;
      return { ...item, minutesFromMidnight: minutes };
    })
    .filter((item) => item.minutesFromMidnight === undefined || item.minutesFromMidnight >= nowMinutes)
    .sort((a, b) => (a.minutesFromMidnight ?? 9999) - (b.minutesFromMidnight ?? 9999));

  return timedClasses[0] || todayClasses[0] || null;
};
