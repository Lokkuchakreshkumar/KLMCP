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

const COMPONENT_WEIGHTS = {
  L: 1,
  T: 1,
  P: 0.5,
  S: 0.25,
};

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
  const courseName = getValue(row, ["coursename", "subjectname", "name", "title"]);
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
    };
    const weight = COMPONENT_WEIGHTS[row.component] ?? 1;
    const present = row.weightedPresent ?? (row.present !== undefined ? row.present * weight : undefined);
    const total = row.weightedTotal ?? (row.total !== undefined ? row.total * weight : undefined);

    if (present !== undefined && total !== undefined) {
      existing.weightedPresent += present;
      existing.weightedTotal += total;
    } else if (row.percentage !== undefined && existing.weightedTotal === 0) {
      existing.percentage = row.percentage;
    }

    existing.components.push({
      component: row.component || "unknown",
      weight,
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
      group.weightedTotal > 0
        ? Number(((group.weightedPresent / group.weightedTotal) * 100).toFixed(2))
        : group.percentage;

    return {
      ...group,
      percentage,
      proof:
        group.weightedTotal > 0
          ? `${group.weightedPresent.toFixed(2)} / ${group.weightedTotal.toFixed(2)} * 100 = ${percentage}%`
          : "Could not prove percentage because weighted totals were not present in ERP data.",
    };
  });
};

const classifyAttendanceRisk = (percentage) => {
  if (percentage === undefined) {
    return "unknown";
  }
  if (percentage < 75) {
    return "critical";
  }
  if (percentage < 80) {
    return "high";
  }
  if (percentage < 85) {
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

export const projectAttendanceAfterMissingClasses = (attendancePayload, classes) => {
  const groups = buildAttendanceGroups(attendancePayload);
  const byCourse = new Map(
    groups.map((group) => [normalizeCourseCode(group.courseCode || group.courseName), group]),
  );

  return classes
    .map((classItem) => {
      const key = normalizeCourseCode(classItem.courseCode || classItem.courseName);
      const group = byCourse.get(key);
      const component = classItem.component || "L";
      const missedWeight = COMPONENT_WEIGHTS[component] ?? 1;

      if (!group || group.weightedTotal <= 0) {
        return {
          class: classItem,
          matchedAttendance: false,
          message: "Could not project this class because matching attendance totals were not found.",
        };
      }

      const projectedTotal = group.weightedTotal + missedWeight;
      const projectedPresent = group.weightedPresent;
      const projectedPercentage = Number(((projectedPresent / projectedTotal) * 100).toFixed(2));

      return {
        class: classItem,
        matchedAttendance: true,
        currentPercentage: group.percentage,
        projectedPercentage,
        drop: Number(((group.percentage ?? projectedPercentage) - projectedPercentage).toFixed(2)),
        missedWeight,
        riskAfterBunk: classifyAttendanceRisk(projectedPercentage),
        proof: `${projectedPresent.toFixed(2)} / ${projectedTotal.toFixed(2)} * 100 = ${projectedPercentage}%`,
      };
    })
    .sort((a, b) => (a.projectedPercentage ?? 999) - (b.projectedPercentage ?? 999));
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

