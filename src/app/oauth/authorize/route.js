import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id") || "";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const responseType = searchParams.get("response_type") || "";
  const scope = searchParams.get("scope") || "";
  const state = searchParams.get("state") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "";

  // Construct redirect URL to the onboarding page
  const connectUrl = new URL("/connect", request.url);
  connectUrl.searchParams.set("client_id", clientId);
  connectUrl.searchParams.set("redirect_uri", redirectUri);
  connectUrl.searchParams.set("response_type", responseType);
  connectUrl.searchParams.set("scope", scope);
  connectUrl.searchParams.set("state", state);
  connectUrl.searchParams.set("code_challenge", codeChallenge);
  connectUrl.searchParams.set("code_challenge_method", codeChallengeMethod);

  return NextResponse.redirect(connectUrl);
}
