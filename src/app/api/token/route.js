import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { getAppUrl } from "@/lib/env";
import { onboardingSchema } from "@/lib/schemas";
import { issueAccessToken, readAccessToken } from "@/lib/token-crypto";
import { connectToDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = onboardingSchema.parse(body);
    
    const { db } = await connectToDatabase();
    
    // Check if an existing token was provided to update credentials for that specific credentialId
    const authHeader = request.headers.get("authorization") || "";
    let credentialId = null;

    if (authHeader.startsWith("Bearer ")) {
      const existingToken = authHeader.slice("Bearer ".length).trim();
      try {
        const decrypted = readAccessToken(existingToken);
        credentialId = decrypted.credentialId;
        
        const { ObjectId } = await import("mongodb");
        await db.collection("credentials").updateOne(
          { _id: new ObjectId(credentialId) },
          {
            $set: {
              ...parsed,
              updatedAt: new Date(),
            }
          }
        );
      } catch (err) {
        // If token is invalid or expired, ignore it and create a new record
        credentialId = null;
      }
    }

    if (!credentialId) {
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
