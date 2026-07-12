import { TokenForm } from "@/components/token-form";
import { getAppUrl } from "@/lib/env";
import { McpGuide } from "@/components/mcp-guide";
import { CopyButton } from "@/components/copy-button";

export const dynamic = "force-dynamic";

export default async function ConnectPage({ searchParams }) {
  const params = await searchParams;
  const clientId = params.client_id || "";
  const redirectUri = params.redirect_uri || "";
  const responseType = params.response_type || "";
  const scope = params.scope || "";
  const state = params.state || "";
  const codeChallenge = params.code_challenge || "";
  const codeChallengeMethod = params.code_challenge_method || "";

  const mcpUrl = `${getAppUrl().replace(/\/$/, "")}/api/mcp`;

  return (
    <main className="page-shell">
      <div className="site-nav">
        <a className="brand" href="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo/image.png" alt="KLMCP" style={{ height: "48px", width: "auto" }} />
          <div className="brand-copy">
            <span>KLMCP</span>
            <span className="small">Onboarding and authorization</span>
          </div>
        </a>
        <div style={{ display: "flex", alignItems: "center" }}>
          <McpGuide />
        </div>
      </div>

      <div className="connect-layout">
        <section className="panel">
          <span className="eyebrow">
            {clientId ? "Authorize application" : "Generate access token"}
          </span>
          <h1 className="headline" style={{ margin: "0 0 16px 0" }}>Connect your ERP and LMS credentials.</h1>
          <p style={{ marginBottom: 24 }}>
            {clientId
              ? "Provide your credentials to authorize the AI client to access your student data securely."
              : "This token is what the user will paste into ChatGPT or Claude when adding the remote MCP server."}
          </p>
          <TokenForm
            clientId={clientId}
            redirectUri={redirectUri}
            responseType={responseType}
            scope={scope}
            state={state}
            codeChallenge={codeChallenge}
            codeChallengeMethod={codeChallengeMethod}
          />
        </section>

        {!clientId && (
          <aside className="panel">
            <span className="eyebrow">Connector setup</span>
            <h3>How to set up the MCP Server</h3>
            <div className="info-list" style={{ marginTop: 20 }}>
              <div className="info-item">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <strong>1. Copy MCP Endpoint URL</strong>
                  <CopyButton text={mcpUrl} />
                </div>
                <p className="mono" style={{ wordBreak: "break-all", fontSize: "13px", padding: "8px", background: "var(--colors-canvas-soft)", border: "1px solid var(--colors-hairline)", borderRadius: "6px", margin: 0 }}>
                  {mcpUrl}
                </p>
                <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--colors-body)" }}>
                  Paste this URL as the MCP Server URL/Endpoint in your AI client (e.g. Cursor, Claude, ChatGPT).
                </p>
              </div>

              <div className="info-item">
                <strong>2. Generate Authorization Token</strong>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--colors-body)" }}>
                  Fill out the form on the left with your credentials and click generate to obtain your bearer token.
                </p>
              </div>

              <div className="info-item">
                <strong>3. Configure Authentication</strong>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--colors-body)" }}>
                  In your AI client's MCP settings, select <strong>SSE (Server-Sent Events)</strong> transport type and add the authorization header:
                </p>
                <pre style={{ margin: "8px 0 0", padding: "8px", background: "var(--colors-canvas-soft)", border: "1px solid var(--colors-hairline)", borderRadius: "6px", fontSize: "12px", color: "var(--colors-timeline-edit)", fontFamily: "var(--font-mono)", overflowX: "auto" }}>
                  Authorization: Bearer &lt;token&gt;
                </pre>
              </div>

              <div className="info-item">
                <strong>Next Steps / Semester Updates</strong>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--colors-body)" }}>
                  Whenever semesters change, simply submit the form again. The MCP server will automatically update in place without requiring you to copy a new URL or token!
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
