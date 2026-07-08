import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  fetchAttendanceFromGosynk,
  fetchInternalMarksFromGosynk,
  fetchTimetableFromGosynk,
} from "@/lib/gosynk-api-client";
import { getLmsDues } from "@/lib/lms-client";

const asToolResult = (payload) => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(payload, null, 2),
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
