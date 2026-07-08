import { NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { createMcpServer } from "@/lib/mcp-server";
import { readAccessToken } from "@/lib/token-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Last-Event-ID, mcp-protocol-version, mcp-session-id",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

const unauthorized = (message) =>
  NextResponse.json(
    {
      error: message,
    },
    {
      status: 401,
      headers: corsHeaders,
    },
  );

const getUserContextFromRequest = (request) => {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Missing Bearer token.");
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    throw new Error("Bearer token is empty.");
  }

  return {
    token,
    userContext: readAccessToken(token),
  };
};

const handleMcpRequest = async (request) => {
  try {
    const { token, userContext } = getUserContextFromRequest(request);
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

    return response;
  } catch (error) {
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
