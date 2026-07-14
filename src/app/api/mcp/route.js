import { NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ObjectId } from "mongodb";

import { createMcpServer } from "@/lib/mcp-server";
import { readAccessToken } from "@/lib/token-crypto";
import { getAppUrl } from "@/lib/env";
import { connectToDatabase } from "@/lib/db";
import { trackMcpRequest } from "@/lib/usage-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Last-Event-ID, mcp-protocol-version, mcp-session-id",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

const unauthorized = (message) => {
  const appUrl = getAppUrl().replace(/\/$/, "");
  return NextResponse.json(
    {
      error: message,
    },
    {
      status: 401,
      headers: {
        ...corsHeaders,
        "WWW-Authenticate": `Bearer realm="mcp", resource_metadata="${appUrl}/.well-known/oauth-protected-resource"`,
      },
    },
  );
};

const getUserContextFromRequest = async (request) => {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Missing Bearer token.");
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    throw new Error("Bearer token is empty.");
  }

  const payload = readAccessToken(token);

  // Retrieve credentials from MongoDB dynamically using the credentialId
  const { db } = await connectToDatabase();
  const credentials = await db.collection("credentials").findOne({
    _id: new ObjectId(payload.credentialId),
  });

  if (!credentials) {
    throw new Error("Credentials not found or deleted.");
  }

  return {
    token,
    userContext: {
      ...credentials,
      expiresAt: payload.expiresAt,
    },
  };
};

const handleMcpRequest = async (request) => {
  const startedAt = Date.now();
  let userContext;

  try {
    const authContext = await getUserContextFromRequest(request);
    const token = authContext.token;
    userContext = authContext.userContext;
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    const server = createMcpServer();

    await server.connect(transport);

    const response = await transport.handleRequest(request, {
      authInfo: {
        token,
        clientId: userContext.erpUsername,
        scopes: ["student.read"],
        extra: {
          userContext,
        },
      },
    });

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    await trackMcpRequest({
      request,
      userContext,
      ok: response.status < 400,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });

    return response;
  } catch (error) {
    await trackMcpRequest({
      request,
      userContext,
      ok: false,
      status: 401,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unauthorized.",
    });

    return unauthorized(error instanceof Error ? error.message : "Unauthorized.");
  }
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request) {
  return handleMcpRequest(request);
}

export async function POST(request) {
  return handleMcpRequest(request);
}

export async function DELETE(request) {
  return handleMcpRequest(request);
}
