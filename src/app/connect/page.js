import { TokenForm } from "@/components/token-form";

export const dynamic = "force-dynamic";

export default function ConnectPage() {
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
          <TokenForm />
        </section>

        <aside className="panel">
          <div className="section-kicker">Connector setup</div>
          <h2>What the user will paste</h2>
          <div className="info-list">
            <div className="info-item">
              <strong>MCP URL</strong>
              <p className="mono">https://your-domain/api/mcp</p>
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
