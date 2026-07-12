"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { McpGuide } from "@/components/mcp-guide";

export default function HomePage() {
  const [activeStep, setActiveStep] = useState(0); // Cycle: 0, 1, 2
  const [copied, setCopied] = useState(false);

  const steps = [
    {
      id: 0,
      pillLabel: "Thinking",
      pillClass: "timeline-pill-thinking",
      image: "/screenshot-step1.png",
      alt: "Step 1: Typing prompt in ChatGPT"
    },
    {
      id: 1,
      pillLabel: "Reading",
      pillClass: "timeline-pill-read",
      image: "/screenshot-step2.png",
      alt: "Step 2: Assistant calling KLU timetable tool"
    },
    {
      id: 2,
      pillLabel: "Done",
      pillClass: "timeline-pill-done",
      image: "/screenshot-step3.png",
      alt: "Step 3: Timetable results displayed"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeStep, steps.length]);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://klmcp.vercel.app/api/mcp");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="page-shell" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}>
      {/* Top Navbar */}
      <nav className="top-nav" style={{ padding: "0", marginBottom: "48px", borderBottom: "1px solid var(--colors-hairline)" }}>
        <div className="brand-mark" style={{ fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/logo/image.png" alt="KLMCP" style={{ height: "48px", width: "auto" }} />
          <span>KLMCP</span>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <McpGuide />
          <Link className="button-tertiary-text" href="/api/health" style={{ fontSize: "13px", color: "var(--colors-body)" }}>
            Health check
          </Link>
          <Link className="button-primary" href="/connect" style={{ height: "36px", padding: "0 16px", fontSize: "13px", borderRadius: "8px", background: "var(--colors-primary)", color: "var(--colors-on-primary)" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-band" style={{ padding: "40px 0 64px" }}>
        <h1 className="display-mega" style={{ textAlign: "center", maxWidth: "800px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
          <img src="/logo/image.png" alt="KLMCP Logo" style={{ height: "148px", width: "auto" }} />
          <span>MCP for KLU</span>
        </h1>
        <p className="hero-subhead" style={{ textAlign: "center", fontSize: "16px", lineHeight: "1.6", color: "var(--colors-body)" }}>
          KLMCP is a quietly-confident bridge turning your ERP and LMS data into a hosted endpoint.
          Query your schedule, attendance, and internals directly from your favorite AI chat client.
        </p>
        <div className="hero-actions" style={{ marginTop: "24px" }}>
          <Link className="button-primary" href="/connect" style={{ height: "42px", padding: "0 20px", background: "var(--colors-primary)" }}>
            Get started for free
          </Link>
          <a className="button-secondary" href="#demo" style={{ height: "42px", padding: "0 20px" }}>
            View live workflow
          </a>
        </div>
      </section>

      {/* IDE Mockup Showcase */}
      <section id="demo" style={{ padding: "0 0 80px" }}>
        {/* Timeline Pills representing Agent Action */}
        <div className="timeline-container" style={{ justifyContent: "center", marginBottom: "24px" }}>
          {steps.map((step) => (
            <button
              key={step.id}
              className={`timeline-pill ${step.pillClass} ${activeStep === step.id ? "active" : "inactive"}`}
              onClick={() => setActiveStep(step.id)}
              style={{ cursor: "pointer", border: "none" }}
            >
              {step.pillLabel}
              {activeStep === step.id && <span className="pill-progress-bar"></span>}
            </button>
          ))}
        </div>

        {/* Clean browser container without explorer panel */}
        <div className="ide-mockup-card" style={{ border: "1px solid var(--colors-hairline)" }}>
          <div className="ide-header">
            <div className="ide-dot" style={{ backgroundColor: "#ff5f56" }}></div>
            <div className="ide-dot" style={{ backgroundColor: "#ffbd2e" }}></div>
            <div className="ide-dot" style={{ backgroundColor: "#27c93f" }}></div>
            <span className="code" style={{ color: "var(--colors-muted)", marginLeft: "8px" }}>
              ChatGPT Preview — KLMCP Endpoint Active
            </span>
          </div>

          <div className="ide-pane-container">
            <div className="ide-main-pane">
              <div className="slideshow-viewport" style={{ position: "relative", width: "100%", aspectRatio: "16/10", overflow: "hidden", backgroundColor: "var(--colors-canvas-soft)" }}>
                {steps.map((step, idx) => (
                  <img
                    key={step.id}
                    src={step.image}
                    alt={step.alt}
                    className="slideshow-image"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      opacity: activeStep === idx ? 1 : 0,
                      transition: "opacity 800ms ease-in-out",
                      zIndex: activeStep === idx ? 2 : 1
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Column Grid Mockup Section (Replicating Screenshot 2) */}
      <section id="features" style={{ padding: "80px 0", borderTop: "1px solid var(--colors-hairline)" }}>
        <div className="feature-grid">

          {/* Card 1: Tool Dropdown Mockup */}
          <div className="feature-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 className="title-md" style={{ fontSize: "16px", fontWeight: "600", color: "var(--colors-ink)" }}>
                Always access the latest tools
              </h3>
              <p className="body-md" style={{ marginTop: "8px", fontSize: "13px", color: "var(--colors-body)", lineHeight: "1.5", marginBottom: "24px" }}>
                Hosted models query your student endpoints securely on-demand, without manually syncing.
              </p>
            </div>
            <div className="mock-dropdown">
              <div className="mock-dropdown-item active">
                <span className="mock-dropdown-item-arrow">→</span>
                <span>/timetable</span>
              </div>
              <div className="mock-dropdown-item">
                <span>/attendance</span>
              </div>
              <div className="mock-dropdown-item">
                <span>/internals</span>
              </div>
              <div className="mock-dropdown-item">
                <span>/lms_dues</span>
              </div>
            </div>
          </div>

          {/* Card 2: Environment Logo Matrix (Focus on chat applications with real PNG logos) */}
          <div className="feature-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 className="title-md" style={{ fontSize: "16px", fontWeight: "600", color: "var(--colors-ink)" }}>
                Use in your preferred chat app
              </h3>
              <p className="body-md" style={{ marginTop: "8px", fontSize: "13px", color: "var(--colors-body)", lineHeight: "1.5", marginBottom: "24px" }}>
                Connect KLMCP instantly to ChatGPT, Claude, Gemini, DeepSeek, Grok, or any compatible AI chat interface.
              </p>
            </div>
            <div className="client-matrix" style={{ gridTemplateColumns: "repeat(3, 1fr)", padding: "16px 8px", gap: "12px" }}>
              <div className="client-logo" style={{ padding: "8px 0" }}>
                <img src="/chatgpt_logo.png" alt="ChatGPT" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: "4px" }} />
                <span style={{ marginTop: "6px" }}>ChatGPT</span>
              </div>
              <div className="client-logo" style={{ padding: "8px 0" }}>
                <img src="/claude_logo.png" alt="Claude" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: "4px" }} />
                <span style={{ marginTop: "6px" }}>Claude</span>
              </div>
              <div className="client-logo" style={{ padding: "8px 0" }}>
                <img src="/gemini_logo.png" alt="Gemini" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: "4px" }} />
                <span style={{ marginTop: "6px" }}>Gemini</span>
              </div>
              <div className="client-logo" style={{ padding: "8px 0" }}>
                <img src="/deepseek_logo.png" alt="DeepSeek" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: "4px" }} />
                <span style={{ marginTop: "6px" }}>DeepSeek</span>
              </div>
              <div className="client-logo" style={{ padding: "8px 0" }}>
                <img src="/grok_logo.png" alt="Grok" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: "4px" }} />
                <span style={{ marginTop: "6px" }}>Grok</span>
              </div>
              <div className="client-logo" style={{ padding: "8px 0" }}>
                <img src="/Mistral_logo.png" alt="Mistral" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: "4px" }} />
                <span style={{ marginTop: "6px" }}>Mistral</span>
              </div>
              <div className="client-logo" style={{ padding: "8px 0" }}>
                <img src="/meta_logo.png" alt="Meta" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: "4px" }} />
                <span style={{ marginTop: "6px" }}>Meta</span>
              </div>
              <div className="client-logo" style={{ padding: "8px 0" }}>
                <img src="/Qwen_logo.png" alt="Qwen" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: "4px" }} />
                <span style={{ marginTop: "6px" }}>Qwen</span>
              </div>
              <div className="client-logo" style={{ padding: "8px 0" }}>
                <img src="/kimi_logo.png" alt="Kimi" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: "4px" }} />
                <span style={{ marginTop: "6px" }}>Kimi</span>
              </div>
            </div>
          </div>

          {/* Card 3: Automated logs */}
          <div className="feature-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 className="title-md" style={{ fontSize: "16px", fontWeight: "600", color: "var(--colors-ink)" }}>
                Real-time automated sync
              </h3>
              <p className="body-md" style={{ marginTop: "8px", fontSize: "13px", color: "var(--colors-body)", lineHeight: "1.5", marginBottom: "24px" }}>
                Our background synchronization polls and validates timetables so you never miss a schedule update.
              </p>
            </div>
            <div className="log-panel">
              <div className="log-row">
                <span>Update monday timetable</span>
                <span className="log-status">
                  <span className="log-status-dot"></span>
                  <span>success</span>
                </span>
              </div>
              <div className="log-row">
                <span>Verify attendance marks</span>
                <span className="log-status">
                  <span className="log-status-dot"></span>
                  <span>success</span>
                </span>
              </div>
              <div className="log-row">
                <span>Check LMS dues</span>
                <span className="log-status">
                  <span className="log-status-dot"></span>
                  <span>success</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Copy Endpoint & Redirect CTA Section (Replicating Screenshot 3 simplified, no CLI) */}
      <section id="integration" style={{ borderTop: "1px solid var(--colors-hairline)", padding: "80px 0" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <span className="caption-uppercase" style={{ color: "var(--colors-primary)", fontWeight: "600" }}>ENDPOINT INTEGRATION</span>
          <h2 className="display-lg" style={{ marginTop: "12px", marginBottom: "16px", color: "var(--colors-ink)" }}>
            Connect KLMCP tools
          </h2>
          <p className="body-md" style={{ color: "var(--colors-body)", fontSize: "14px", lineHeight: "1.6", margin: "0 auto 32px" }}>
            No CLI setup required. Copy your hosted MCP server endpoint URL below, then configure it inside your favorite chat client with a secure authorization token.
          </p>

          <div className="mcp-box" style={{ maxWidth: "480px", margin: "0 auto 32px" }}>
            <input
              type="text"
              readOnly
              value="https://klmcp.vercel.app/api/mcp"
              className="mcp-input"
            />
            <button onClick={handleCopy} className="mcp-copy-btn">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <Link className="button-primary" href="/connect" style={{ height: "44px", padding: "0 24px", background: "var(--colors-primary)" }}>
              Get started for free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{ padding: "48px 0", marginTop: "80px", borderTop: "1px solid var(--colors-hairline)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div className="brand-mark" style={{ fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <img src="/logo/image.png" alt="KLMCP" style={{ height: "36px", width: "auto" }} />
            <span>KLMCP</span>
          </div>
          <span className="code" style={{ color: "var(--colors-muted)", fontSize: "12px" }}>
            © {new Date().getFullYear()} KLMCP — 2026-2027 Academic Year
          </span>
        </div>
      </footer>
    </main>
  );
}
