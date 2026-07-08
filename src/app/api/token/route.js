import { NextResponse } from "next/server";

import { getAppUrl } from "@/lib/env";
import { onboardingSchema } from "@/lib/schemas";
import { issueAccessToken } from "@/lib/token-crypto";
import { connectToDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = onboardingSchema.parse(body);
    
    // Save raw credentials to MongoDB
    const { db } = await connectToDatabase();
    await db.collection("credentials").insertOne({
      ...parsed,
      createdAt: new Date(),
    });

    const now = Date.now();
    const accessToken = issueAccessToken({
      ...parsed,
      issuedAt: now,
      expiresAt: now + 1000 * 60 * 60 * 24 * 30,
    });

    return NextResponse.json({
      accessToken,
      mcpUrl: `${getAppUrl().replace(/\/$/, "")}/api/mcp`,
      expiresAt: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create access token.",
      },
      { status: 400 },
    );
  }
}
