import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

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
    
    // Save raw credentials to MongoDB (upsert by erpUsername to preserve existing credentialId)
    const { db } = await connectToDatabase();
    const existing = await db.collection("credentials").findOne({ erpUsername: parsed.erpUsername });
    let credentialId;
    if (existing) {
      await db.collection("credentials").updateOne(
        { _id: existing._id },
        {
          $set: {
            ...parsed,
            updatedAt: new Date(),
          }
        }
      );
      credentialId = existing._id.toString();
    } else {
      const insertResult = await db.collection("credentials").insertOne({
        ...parsed,
        createdAt: new Date(),
      });
      credentialId = insertResult.insertedId.toString();
    }

    const now = Date.now();
    const accessToken = issueAccessToken({
      credentialId,
      issuedAt: now,
      expiresAt: now + 1000 * 60 * 60 * 24 * 30,
    });

    // Check if this was initiated by an OAuth flow
    const { redirectUri, state, codeChallenge, codeChallengeMethod } = body;

    if (redirectUri) {
      const code = randomBytes(16).toString("hex");
      await db.collection("oauth_codes").insertOne({
        code,
        accessToken,
        codeChallenge,
        codeChallengeMethod,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      });

      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set("code", code);
      if (state) {
        redirectUrl.searchParams.set("state", state);
      }

      return NextResponse.json({
        redirectUrl: redirectUrl.toString(),
      });
    }

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
