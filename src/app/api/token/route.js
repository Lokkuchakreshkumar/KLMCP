import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";

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
    const credentialUpdate = {
      ...parsed,
      erpUsername: parsed.erpUsername.trim(),
      lmsUsername: parsed.lmsUsername.trim(),
    };
    
    const { db } = await connectToDatabase();
    const credentialsCollection = db.collection("credentials");
    await credentialsCollection.createIndex({ erpUsername: 1 });
    
    // Check if an existing token was provided to update credentials for that specific credentialId.
    // Then sync every existing browser/token record for the same ERP account so one browser
    // update is reflected for the same student elsewhere too.
    const authHeader = request.headers.get("authorization") || "";
    let credentialId = null;
    let reusedAccount = false;

    if (authHeader.startsWith("Bearer ")) {
      const existingToken = authHeader.slice("Bearer ".length).trim();
      try {
        const decrypted = readAccessToken(existingToken);
        credentialId = decrypted.credentialId;

        const existingCredential = await credentialsCollection.findOne({
          _id: new ObjectId(credentialId),
        });

        if (!existingCredential) {
          credentialId = null;
        } else {
          await credentialsCollection.updateMany(
            {
              erpUsername:
                existingCredential.erpUsername || credentialUpdate.erpUsername,
            },
            {
              $set: {
                ...credentialUpdate,
                updatedAt: new Date(),
              },
            },
          );

          await credentialsCollection.updateOne(
            { _id: new ObjectId(credentialId) },
            {
              $set: {
                ...credentialUpdate,
                updatedAt: new Date(),
              },
            },
          );
          reusedAccount = true;
        }
      } catch (err) {
        // If token is invalid or expired, ignore it and fall back to ERP username matching.
        credentialId = null;
      }
    }

    if (!credentialId) {
      const existingCredential = await credentialsCollection.findOne({
        erpUsername: credentialUpdate.erpUsername,
      });

      if (existingCredential) {
        await credentialsCollection.updateMany(
          { erpUsername: credentialUpdate.erpUsername },
          {
            $set: {
              ...credentialUpdate,
              updatedAt: new Date(),
            },
          },
        );
        credentialId = existingCredential._id.toString();
        reusedAccount = true;
      }
    }

    if (!credentialId) {
      const insertResult = await credentialsCollection.insertOne({
        ...credentialUpdate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      credentialId = insertResult.insertedId.toString();
    }

    if (credentialId && reusedAccount) {
      await credentialsCollection.updateOne(
        { _id: new ObjectId(credentialId) },
        {
          $set: {
            ...credentialUpdate,
            updatedAt: new Date(),
          },
        },
      );
    }

    // If same ERP account already had duplicate browser-local records, make sure future reads
    // from older tokens also see the latest semester/passwords.
    await credentialsCollection.updateMany(
      { erpUsername: credentialUpdate.erpUsername },
      {
        $set: {
          ...credentialUpdate,
          updatedAt: new Date(),
        },
      },
    );

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
      accountSync: reusedAccount ? "updated_existing_erp_account" : "created_new_erp_account",
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
