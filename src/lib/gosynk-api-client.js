import { getGosynkApiBaseUrl } from "@/lib/env";

const buildEndpoint = (path) => `${getGosynkApiBaseUrl().replace(/\/$/, "")}${path}`;

const parseSsePayload = (rawText) => {
  const lines = rawText
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6).trim())
    .filter(Boolean);

  let data = null;
  const statuses = [];
  let error = null;

  for (const line of lines) {
    if (line === "[DONE]") {
      continue;
    }

    try {
      const parsed = JSON.parse(line);

      if (parsed.status) {
        statuses.push(parsed.status);
      }

      if (parsed.data) {
        data = parsed.data;
      }

      if (parsed.error) {
        error = parsed.error;
      }
    } catch {
      error = "Received invalid SSE payload from GoSynk.";
    }
  }

  if (error) {
    throw new Error(error);
  }

  if (!data) {
    throw new Error("GoSynk API returned no final data payload.");
  }

  return {
    data,
    statuses,
  };
};

const callErpEndpoint = async (path, body) => {
  const response = await fetch(buildEndpoint(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `GoSynk API request failed with status ${response.status}`);
  }

  return parseSsePayload(text);
};

export const fetchTimetableFromGosynk = async (userContext) =>
  callErpEndpoint("/erp/timetable", {
    erpCredentials: {
      username: userContext.erpUsername,
      password: userContext.erpPassword,
    },
    academicContext: {
      academicYear: userContext.academicYear,
      semester: userContext.semester,
    },
  });

export const fetchAttendanceFromGosynk = async (userContext) =>
  callErpEndpoint("/erp/attendance", {
    erpCredentials: {
      username: userContext.erpUsername,
      password: userContext.erpPassword,
    },
    academicContext: {
      academicYear: userContext.academicYear,
      semester: userContext.semester,
    },
  });

export const fetchInternalMarksFromGosynk = async (userContext, filters = {}) =>
  callErpEndpoint("/erp/internal-marks", {
    erpCredentials: {
      username: userContext.erpUsername,
      password: userContext.erpPassword,
    },
    academicContext: {
      academicYear: userContext.academicYear,
      semester: userContext.semester,
    },
    courseQuery: filters.courseQuery,
    componentQuery: filters.componentQuery,
  });
