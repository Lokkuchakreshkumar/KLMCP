"use client";

import { useState } from "react";

export function CopyButton({ text, className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`copy-btn ${className}`}
      style={{
        background: "var(--colors-surface-strong)",
        border: "1px solid var(--colors-hairline)",
        color: copied ? "var(--colors-semantic-success)" : "var(--colors-body)",
        cursor: "pointer",
        padding: "6px 12px",
        fontSize: "12px",
        borderRadius: "6px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        transition: "all 150ms ease",
      }}
      type="button"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
