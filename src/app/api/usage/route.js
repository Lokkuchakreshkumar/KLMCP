import { NextResponse } from "next/server";

import { getUsageSummary } from "@/lib/usage-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unauthorized = () =>
  NextResponse.json(
    { error: "Unauthorized." },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Bearer realm="usage"',
      },
    },
  );

export async function GET(request) {
  const secret = process.env.KLMCP_ANALYTICS_SECRET?.trim();

  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Analytics endpoint is not configured. Set KLMCP_ANALYTICS_SECRET to enable it.",
      },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (token !== secret) {
    return unauthorized();
  }

  const summary = await getUsageSummary();
  return NextResponse.json(summary);
}
