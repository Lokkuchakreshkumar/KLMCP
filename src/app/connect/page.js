import { TokenForm } from "@/components/token-form";
import { getAppUrl } from "@/lib/env";

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
        <a className="brand" href="/">
          <div className="brand-mark">KL</div>
          <div className="brand-copy">
            <span>KLMCP</span>
            <span className="small">Onboarding and token minting</span>
          </div>
        </a>
      </div>

      <div className="connect-layout">
        <section className="panel">
          <div className="section-kicker">Generate access token</div>
          <h1 style={{ marginTop: 0 }}>Connect your ERP and LMS credentials once.</h1>
          <p>
            This token is what the user will paste into ChatGPT or Claude when
            adding the remote MCP server. Credentials are encrypted into the
            token and are never shown back in plain text.
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

        <aside className="panel">
          <div className="section-kicker">Connector setup</div>
          <h2>What the user will paste</h2>
          <div className="info-list">
            <div className="info-item">
              <strong>MCP URL</strong>
              <p className="mono">{mcpUrl}</p>
            </div>
            <div className="info-item">
              <strong>Authorization</strong>
              <p>Use the generated bearer token in the connector auth field.</p>
            </div>
            <div className="info-item">
              <strong>Supported tools</strong>
              <p>
                Timetable, attendance, internal marks, LMS dues, and a
                diagnostic check.
              </p>
            </div>
          </div>
          <p className="footer-note">
            This is a hosted token flow, not full OAuth yet. It already matches
            the product experience you asked for: website first, then paste into
            the AI client.
          </p>
        </aside>
      </div>
    </main>
  );
}
