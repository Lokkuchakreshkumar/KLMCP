"use client";

import { useState } from "react";

export function McpGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="button-tertiary-text"
        style={{ fontSize: "13px", color: "var(--colors-body)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        Learn how to add MCP
      </button>

      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(11, 10, 8, 0.85)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "16px"
        }}>
          <div style={{
            backgroundColor: "var(--colors-surface-card)",
            border: "1px solid var(--colors-hairline)",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 className="title-md" style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--colors-ink)" }}>
                How to add KLMCP
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="button-tertiary-text" 
                style={{ fontSize: "18px", color: "var(--colors-body)", cursor: "pointer", padding: "4px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px", lineHeight: "1.5", color: "var(--colors-body)" }}>
              <div>
                <strong style={{ color: "var(--colors-ink)" }}>Step 1: Copy your Endpoint URL</strong>
                <pre style={{ 
                  margin: "8px 0 0", 
                  backgroundColor: "var(--colors-canvas-soft)", 
                  padding: "10px", 
                  borderRadius: "6px", 
                  border: "1px solid var(--colors-hairline)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--colors-ink)",
                  overflowX: "auto"
                }}>
                  https://klmcp.vercel.app/api/mcp
                </pre>
              </div>

              <div>
                <strong style={{ color: "var(--colors-ink)" }}>Step 2: Generate Authorization Token</strong>
                <p style={{ margin: "4px 0 0" }}>
                  Go to <a href="/connect" style={{ color: "var(--colors-primary)", textDecoration: "underline" }}>Get Started</a>, enter your credentials, and click generate to get your Bearer token.
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--colors-hairline)", paddingTop: "16px" }}>
                <strong style={{ color: "var(--colors-ink)", display: "block", marginBottom: "8px" }}>Step 3: Setup in your Chat App</strong>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <span style={{ fontWeight: "600", color: "var(--colors-ink)", fontSize: "13px" }}>🤖 ChatGPT Plus / Pro</span>
                    <p style={{ margin: "2px 0 0", fontSize: "13px" }}>
                      Settings → Developer → MCP Servers → Add SSE Server. Enter Name, Endpoint URL, and Auth Header: `Bearer &lt;token&gt;`.
                    </p>
                  </div>

                  <div>
                    <span style={{ fontWeight: "600", color: "var(--colors-ink)", fontSize: "13px" }}>🎛️ Cursor Editor</span>
                    <p style={{ margin: "2px 0 0", fontSize: "13px" }}>
                      Settings → Features → MCP → Add New MCP Server. Choose `SSE`, input Name, URL, and credentials.
                    </p>
                  </div>

                  <div>
                    <span style={{ fontWeight: "600", color: "var(--colors-ink)", fontSize: "13px" }}>💡 Claude Desktop</span>
                    <p style={{ margin: "2px 0 0", fontSize: "13px" }}>
                      Add the KLMCP configuration object to your `claude_desktop_config.json` under `mcpServers`.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="button-primary"
              style={{ width: "100%", marginTop: "24px", height: "40px", background: "var(--colors-primary)" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
