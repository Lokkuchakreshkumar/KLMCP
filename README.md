# KLMCP

KLMCP is a Vercel-friendly Next.js app that gives users a hosted onboarding page plus a remote MCP endpoint for KL University data.

## What users do

1. Open the website.
2. Enter ERP and LMS credentials, academic year, and semester.
3. Generate a KLMCP access token.
4. Paste that token into ChatGPT or Claude when adding the remote MCP server.

## What the app does

- Issues encrypted bearer tokens without a database.
- Exposes a remote MCP endpoint at `/api/mcp`.
- Calls GoSynk ERP APIs over HTTP.
- Fetches LMS dues directly with server-side login flow.

## Required environment variables

- `NEXT_PUBLIC_APP_URL`
- `KLMCP_TOKEN_SECRET`
- `GOSYNK_API_BASE_URL`
- `ERP_BASE_URL`
- `LMS_BASE_URL`

## Local development

```bash
cd /home/chakresh/projects/KLMCP
npm install
cp .env.example .env.local
npm run build
npm run dev
```

## Vercel notes

- Set the same env vars in Vercel project settings.
- Keep the app on the Node.js runtime for the route handlers.
- Point your ChatGPT or Claude connector to `https://your-domain/api/mcp`.

## Current tools

- `get_timetable`
- `get_attendance`
- `get_internal_marks`
- `get_lms_dues`
- `diagnose_student_access`

## Authentication model

This app currently issues a KLMCP bearer token. It is not a full OAuth authorization server yet, but it gives the user-facing flow you asked for: website first, then paste token into the AI product.
