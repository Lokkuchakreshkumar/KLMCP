import { createHash } from "node:crypto";

import { getTokenSecret } from "@/lib/env";
import { connectToDatabase } from "@/lib/db";

const COLLECTION = "usage_events";

const hashUserId = (value) => {
  if (!value) return null;

  return createHash("sha256")
    .update(`${getTokenSecret()}:${value}`)
    .digest("hex")
    .slice(0, 24);
};

const getRequestMetadata = (request) => ({
  userAgent: request.headers.get("user-agent") || null,
  forwardedFor: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
});

export const trackUsageEvent = async (event) => {
  try {
    const { db } = await connectToDatabase();
    await db.collection(COLLECTION).insertOne({
      ...event,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Usage analytics write failed", error);
  }
};

export const trackMcpRequest = async ({ request, userContext, ok, status, durationMs, error }) => {
  await trackUsageEvent({
    type: "mcp_request",
    method: request.method,
    ok,
    status,
    durationMs,
    error: error ? String(error).slice(0, 300) : null,
    userHash: hashUserId(userContext?.erpUsername),
    credentialId: userContext?._id?.toString?.() || null,
    ...getRequestMetadata(request),
  });
};

export const trackToolCall = async ({ toolName, extra, ok, durationMs, error }) => {
  const userContext = extra?.authInfo?.extra?.userContext;

  await trackUsageEvent({
    type: "tool_call",
    toolName,
    ok,
    durationMs,
    error: error ? String(error).slice(0, 300) : null,
    userHash: hashUserId(userContext?.erpUsername),
    credentialId: userContext?._id?.toString?.() || null,
  });
};

export const getUsageSummary = async () => {
  const { db } = await connectToDatabase();
  const collection = db.collection(COLLECTION);
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totals,
    last24h,
    last7d,
    toolBreakdownAllTime,
    toolBreakdownLast7d,
    dailyRequestsAllTime,
    dailyRequestsLast7d,
  ] = await Promise.all([
    summarizeWindow(collection, new Date(0)),
    summarizeWindow(collection, since24h),
    summarizeWindow(collection, since7d),
    getToolBreakdown(collection, new Date(0)),
    getToolBreakdown(collection, since7d),
    getDailyRequests(collection, new Date(0)),
    getDailyRequests(collection, since7d),
  ]);

  return {
    generatedAt: now.toISOString(),
    totals,
    last24h,
    last7d,
    toolBreakdownAllTime,
    toolBreakdownLast7d,
    dailyRequestsAllTime,
    dailyRequestsLast7d,
  };
};

const getToolBreakdown = async (collection, since) => {
  const tools = await collection
    .aggregate([
      { $match: { type: "tool_call", createdAt: { $gte: since } } },
      {
        $group: {
          _id: "$toolName",
          calls: { $sum: 1 },
          failures: { $sum: { $cond: ["$ok", 0, 1] } },
          avgDurationMs: { $avg: "$durationMs" },
        },
      },
      { $sort: { calls: -1 } },
    ])
    .toArray();

  return tools.map((tool) => ({
    toolName: tool._id,
    calls: tool.calls,
    failures: tool.failures,
    avgDurationMs: Math.round(tool.avgDurationMs || 0),
  }));
};

const getDailyRequests = async (collection, since) =>
  collection
    .aggregate([
      { $match: { type: "mcp_request", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          requests: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userHash" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          requests: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
      { $sort: { date: 1 } },
    ])
    .toArray();

const summarizeWindow = async (collection, since) => {
  const [summary] = await collection
    .aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          mcpRequests: {
            $sum: { $cond: [{ $eq: ["$type", "mcp_request"] }, 1, 0] },
          },
          toolCalls: {
            $sum: { $cond: [{ $eq: ["$type", "tool_call"] }, 1, 0] },
          },
          failures: {
            $sum: { $cond: ["$ok", 0, 1] },
          },
          uniqueUsers: { $addToSet: "$userHash" },
        },
      },
      {
        $project: {
          _id: 0,
          mcpRequests: 1,
          toolCalls: 1,
          failures: 1,
          uniqueUsers: {
            $size: {
              $filter: {
                input: "$uniqueUsers",
                as: "user",
                cond: { $ne: ["$$user", null] },
              },
            },
          },
        },
      },
    ])
    .toArray();

  return summary || {
    mcpRequests: 0,
    toolCalls: 0,
    failures: 0,
    uniqueUsers: 0,
  };
};
