import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <nav className="site-nav">
        <div className="brand">
          <div className="brand-mark">KL</div>
          <div className="brand-copy">
            <span>KLMCP</span>
            <span className="small">Hosted MCP for campus data</span>
          </div>
        </div>
        <Link className="secondary-button" href="/connect">
          Generate token
        </Link>
      </nav>

      <section className="hero-card">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-kicker">Remote MCP for ChatGPT and Claude</div>
            <h1 className="hero-title">Your KL timetable should be chat-native.</h1>
            <p className="hero-subtitle">
              KLMCP turns ERP and LMS data into a hosted MCP endpoint so users do
              not need to run local code. They connect once on the website,
              generate a secure token, and then add the server inside their AI
              product.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" href="/connect">
                Open onboarding
              </Link>
              <a className="secondary-button" href="/api/health">
                Health endpoint
              </a>
            </div>
          </div>

          <aside className="hero-side">
            <div className="metric-stack">
              <div className="metric">
                <p className="metric-label">Remote MCP endpoint</p>
                <p className="metric-value mono">/api/mcp</p>
              </div>
              <div className="metric">
                <p className="metric-label">Primary student tools</p>
                <p className="metric-value">Timetable, attendance, internals, LMS dues</p>
              </div>
              <div className="metric">
                <p className="metric-label">Auth model</p>
                <p className="metric-value">Encrypted bearer token from onboarding site</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div className="section-kicker">How it works</div>
        <div className="section-grid">
          <article className="panel">
            <h3>1. Connect on the website</h3>
            <p>
              The user enters ERP and LMS credentials, plus academic year and
              semester, on your hosted page instead of inside a chat window.
            </p>
          </article>
          <article className="panel">
            <h3>2. Generate a KLMCP token</h3>
            <p>
              The app returns an encrypted access token. It is opaque to the
              user and can be pasted into the connector setup flow.
            </p>
          </article>
          <article className="panel">
            <h3>3. Use it from ChatGPT or Claude</h3>
            <p>
              The remote MCP server reads that token, resolves the user’s campus
              credentials server-side, and serves tools over HTTPS.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
