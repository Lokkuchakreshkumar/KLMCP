"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { McpGuide } from "@/components/mcp-guide";

const AI_CLIENTS = [
  { name: "ChatGPT", logo: "/chatgpt_logo.png" },
  { name: "Claude", logo: "/claude_logo.png" },
  { name: "Gemini", logo: "/gemini_logo.png" },
];

export default function HomePage() {
  const demoPlayerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentClientIndex, setCurrentClientIndex] = useState(0);
  const [isBlurring, setIsBlurring] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [demoPlayerSrc, setDemoPlayerSrc] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setIsBlurring(true);
      setTimeout(() => {
        setCurrentClientIndex((prev) => (prev + 1) % AI_CLIENTS.length);
        setIsBlurring(false);
      }, 300);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://klmcp.vercel.app/api/mcp");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requestDemoQuality = () => {
    const playerWindow = demoPlayerRef.current?.contentWindow;

    if (!playerWindow) return;

    const postPlayerCommand = (func, args = []) => {
      playerWindow.postMessage(
        JSON.stringify({
          event: "command",
          func,
          args,
        }),
        "https://www.youtube.com"
      );
    };

    postPlayerCommand("setPlaybackQualityRange", ["hd1080", "hd1080"]);
    postPlayerCommand("setPlaybackQuality", ["hd1080"]);
  };

  const handleDemoPlay = () => {
    const origin =
      typeof window !== "undefined"
        ? `&origin=${encodeURIComponent(window.location.origin)}`
        : "";

    setDemoPlayerSrc(
      `https://www.youtube.com/embed/dcR63YaWnBA?si=RwqM_dvRbDzmOliD&autoplay=1&rel=0&vq=hd1080&hd=1&enablejsapi=1${origin}`
    );
    setIsDemoPlaying(true);
  };

  return (
    <main style={{ width: "100%", position: "relative" }}>
      {/* Top Navbar Floating Overlay (Runway Style) */}
      <header className="runway-header" style={{ position: "sticky", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", pointerEvents: "none", height: "64px", marginBottom: "-64px" }}>
        <div className="runway-header-inner" style={{ pointerEvents: "auto", position: "relative", width: "800px", maxWidth: "calc(100% - 64px)" }}>
          {/* Left Inverted Corner */}
          <div className="runway-corner-left" style={{
            position: "absolute",
            top: 0,
            left: "-24px",
            width: "24px",
            height: "24px",
            background: "radial-gradient(circle at bottom left, transparent 24px, #000000 24.5px)"
          }} />
          
          <nav className="top-nav" style={{ 
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
            padding: "16px 32px", 
            background: "#000000", 
            borderBottomLeftRadius: "24px",
            borderBottomRightRadius: "24px",
            minHeight: "64px",
            width: "100%"
          }}>
            <div className="brand-mark" style={{ fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              <img src="/logo/image.png" alt="KLMCP" style={{ height: "36px", width: "auto" }} />
              <span style={{ color: "#fff" }}>KLMCP</span>
            </div>
            
            {/* Navigation links (hidden on mobile, expandable) */}
            <div 
              className={`nav-links ${isMenuOpen ? "mobile-open" : ""}`} 
              style={{ 
                backgroundColor: isMenuOpen ? "#000000" : "transparent",
                borderRadius: isMenuOpen ? "16px" : "0",
                marginTop: isMenuOpen ? "8px" : "0"
              }}
            >
              <McpGuide />
              <Link className="button-tertiary-text" href="/api/health" style={{ color: "rgba(255,255,255,0.7)" }}>
                Health check
              </Link>
            </div>

            {/* Action buttons visible on both mobile and desktop */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Link className="button-primary desktop-only-btn" href="/connect" style={{ 
                height: "38px", 
                padding: "0 8px 0 16px", 
                background: "var(--colors-primary)", 
                color: "white", 
                borderRadius: "999px", 
                display: "flex", 
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                textDecoration: "none"
              }}>
                <span>Get Started</span>
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}>
                  ↗
                </span>
              </Link>

              {/* Hamburger toggle button */}
              <button 
                className="mobile-menu-toggle"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle Menu"
                style={{ color: "#fff" }}
              >
                {isMenuOpen ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" y1="8" x2="20" y2="8"></line><line x1="8" y1="16" x2="20" y2="16"></line></svg>
                )}
              </button>
            </div>
          </nav>
          
          {/* Right Inverted Corner */}
          <div className="runway-corner-right" style={{
            position: "absolute",
            top: 0,
            right: "-24px",
            width: "24px",
            height: "24px",
            background: "radial-gradient(circle at bottom right, transparent 24px, #000000 24.5px)"
          }} />
        </div>
      </header>

      {/* Hero Section with Full-Screen Height and Background Image */}
      <section 
        className="hero-band" 
        style={{ 
          position: "relative",
          backgroundImage: "url('/hero/image.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "calc(100vh - 24px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          padding: "120px 24px 0",
          color: "#ffffff"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "1000px", zIndex: 2 }}>
          {/* Now Available Pill (Runway style) */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: "12px",
            fontWeight: "500",
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: "24px",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--colors-primary)", display: "inline-block" }}></span>
            <span>Now Available</span>
          </div>

          <h1 className="display-mega" style={{ textAlign: "center", maxWidth: "1000px", lineHeight: "1.3", color: "#ffffff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            <span>Attendance, TimeTable, Internals, LMS, Everything in </span>
            <span 
              className={`blur-transition ${isBlurring ? "blur-active" : ""}`} 
              style={{ 
                color: "var(--colors-primary)", 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "16px",
                fontWeight: "600",
                verticalAlign: "middle"
              }}
            >
              <span>{AI_CLIENTS[currentClientIndex].name}</span>
              <img 
                src={AI_CLIENTS[currentClientIndex].logo} 
                alt="" 
                style={{ height: "0.95em", width: "auto", objectFit: "contain", display: "inline-block" }} 
              />
            </span>
          </h1>
          <p className="hero-subhead" style={{ textAlign: "center", fontSize: "17px", lineHeight: "1.6", color: "rgba(255,255,255,0.85)", maxWidth: "700px", margin: "24px auto 32px", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            KLMCP is a quietly-confident bridge turning your ERP and LMS data into a hosted endpoint.
            Query your schedule, attendance, and internals directly from your favorite AI chat client.
          </p>
          <div style={{ marginTop: "32px", display: "flex", justifyContent: "center", width: "100%" }}>
            <Link className="runway-cta" href="/connect">
              <span>Get Started</span>
              <span className="runway-cta-arrow">
                ↗
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Wrapper (Container for remaining sections) */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}>

      {/* Demo Video Showcase */}
      <section id="demo" style={{ padding: "0 0 80px" }}>
        <div className="demo-video-card">
          <div className="demo-video-shell">
            {isDemoPlaying ? (
              <iframe
                ref={demoPlayerRef}
                className="demo-video-frame"
                src={demoPlayerSrc}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => {
                  requestDemoQuality();
                  setTimeout(requestDemoQuality, 1200);
                  setTimeout(requestDemoQuality, 3000);
                }}
                allowFullScreen
              />
            ) : (
              <button
                className="demo-video-cover"
                type="button"
                aria-label="Play KLMCP demo video"
                onClick={handleDemoPlay}
              >
                <img
                  src="https://img.youtube.com/vi/dcR63YaWnBA/maxresdefault.jpg"
                  alt=""
                  aria-hidden="true"
                />
                <span className="demo-video-scrim" aria-hidden="true"></span>
                <span className="demo-play-button">
                  <span className="demo-play-icon" aria-hidden="true"></span>
                  <span>Play demo</span>
                </span>
              </button>
            )}
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
      </div>
    </main>
  );
}
