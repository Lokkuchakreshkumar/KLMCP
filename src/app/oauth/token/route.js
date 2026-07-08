import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { connectToDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function verifyPkce(codeVerifier, codeChallenge) {
  const hash = createHash("sha256").update(codeVerifier).digest();
  const calculatedChallenge = hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return calculatedChallenge === codeChallenge;
}

export async function POST(request) {
  try {
    let body = {};
    const contentType = request.headers.get("content-type") || "";

    try {
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      } else {
        body = await request.json();
      }
    } catch (parseError) {
      // If parsing fails, fall back to empty body
    }

    const { grant_type, code, client_id, code_verifier } = body;

    if (grant_type !== "authorization_code") {
      return NextResponse.json(
        { error: "unsupported_grant_type", error_description: "Only authorization_code grant type is supported." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing authorization code." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { db } = await connectToDatabase();
    const doc = await db.collection("oauth_codes").findOne({ code });

    if (!doc) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Invalid or expired authorization code." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check expiration
    if (new Date(doc.expiresAt) < new Date()) {
      await db.collection("oauth_codes").deleteOne({ code });
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Authorization code has expired." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify PKCE
    if (doc.codeChallenge) {
      if (!code_verifier) {
        return NextResponse.json(
          { error: "invalid_grant", error_description: "Missing code_verifier for PKCE challenge." },
          { status: 400, headers: corsHeaders }
        );
      }

      const isPkceValid = verifyPkce(code_verifier, doc.codeChallenge);
      if (!isPkceValid) {
        return NextResponse.json(
          { error: "invalid_grant", error_description: "PKCE verification failed: code_verifier does not match code_challenge." },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Delete the code so it cannot be reused
    await db.collection("oauth_codes").deleteOne({ code });

    // Return the bearer token response
    return NextResponse.json(
      {
        access_token: doc.accessToken,
        token_type: "Bearer",
        expires_in: 2592000, // 30 days (matches issueAccessToken token-crypto expiry)
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "server_error", error_description: error instanceof Error ? error.message : "Internal server error." },
      { status: 500, headers: corsHeaders }
    );
  }
}
