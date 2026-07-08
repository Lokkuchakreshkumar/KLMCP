import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  const appUrl = getAppUrl().replace(/\/$/, "");
  return NextResponse.json(
    {
      issuer: appUrl,
      authorization_endpoint: `${appUrl}/oauth/authorize`,
      token_endpoint: `${appUrl}/oauth/token`,
      token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
      grant_types_supported: ["authorization_code"],
      response_types_supported: ["code"],
      code_challenge_methods_supported: ["S256"],
    },
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}
