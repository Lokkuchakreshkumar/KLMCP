"use client";

import { useEffect, useMemo, useState } from "react";

const initialForm = {
  erpUsername: "",
  erpPassword: "",
  lmsUsername: "",
  lmsPassword: "",
  academicYear: "2026-2027",
  semester: "odd",
};

export function TokenForm({
  clientId = "",
  redirectUri = "",
  responseType = "",
  scope = "",
  state = "",
  codeChallenge = "",
  codeChallengeMethod = "",
}) {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("klmcp_token");
      if (token) {
        setHasExistingToken(true);
      }
      
      const saved = localStorage.getItem("klmcp_credentials");
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({
          ...prev,
          ...parsed,
          academicYear: "2026-2027",
        }));
      }
    } catch (e) {
      console.error("Failed to load saved credentials from localStorage", e);
    }
  }, []);

  const mcpUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/api/mcp`;
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setResult(null);

    const existingToken = localStorage.getItem("klmcp_token");
    setIsUpdating(!!existingToken);

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (existingToken) {
        headers["Authorization"] = `Bearer ${existingToken}`;
      }

      const response = await fetch("/api/token", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...form,
          clientId,
          redirectUri,
          responseType,
          scope,
          state,
          codeChallenge,
          codeChallengeMethod,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate token.");
      }

      try {
        localStorage.setItem(
          "klmcp_credentials",
          JSON.stringify({
            erpUsername: form.erpUsername,
            erpPassword: form.erpPassword,
            lmsUsername: form.lmsUsername,
            lmsPassword: form.lmsPassword,
            semester: form.semester,
          })
        );
        if (payload.accessToken) {
          localStorage.setItem("klmcp_token", payload.accessToken);
        }
      } catch (storageError) {
        console.error("Failed to save credentials to localStorage", storageError);
      }

      if (payload.redirectUrl) {
        window.location.href = payload.redirectUrl;
        return;
      }

      setResult(payload);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {hasExistingToken && (
        <div className="status-box" style={{ marginBottom: 12, borderLeft: "4px solid var(--colors-primary)" }}>
          <strong style={{ display: "block", marginBottom: 4, fontSize: "14px" }}>Active Session Detected</strong>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--colors-body)" }}>
            You already have an active token. Submitting this form will update your semester or credentials on the server. <strong>Your existing MCP client setup will work instantly without any re-configuration!</strong>
          </p>
        </div>
      )}
      <div className="field-split">
        <div className="field-row">
          <label htmlFor="erpUsername">ERP username</label>
          <input
            id="erpUsername"
            name="erpUsername"
            value={form.erpUsername}
            onChange={handleChange}
            required
          />
        </div>
        <div className="field-row">
          <label htmlFor="erpPassword">ERP password</label>
          <input
            id="erpPassword"
            name="erpPassword"
            type="password"
            value={form.erpPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="field-split">
        <div className="field-row">
          <label htmlFor="lmsUsername">LMS username</label>
          <input
            id="lmsUsername"
            name="lmsUsername"
            value={form.lmsUsername}
            onChange={handleChange}
            required
          />
        </div>
        <div className="field-row">
          <label htmlFor="lmsPassword">LMS password</label>
          <input
            id="lmsPassword"
            name="lmsPassword"
            type="password"
            value={form.lmsPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="field-split">
        <div className="field-row">
          <label htmlFor="academicYear">Academic year</label>
          <input
            id="academicYear"
            name="academicYear"
            value={form.academicYear}
            readOnly
            required
          />
        </div>
        <div className="field-row">
          <label htmlFor="semester">Semester</label>
          <select
            id="semester"
            name="semester"
            value={form.semester}
            onChange={handleChange}
          >
            <option value="odd">Odd</option>
            <option value="even">Even</option>
          </select>
        </div>
      </div>

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting
          ? clientId ? "Authorizing..." : "Generating..."
          : clientId ? "Authorize" : "Generate KLMCP token"}
      </button>

      {error ? (
        <div className="status-box error">
          <strong style={{ display: "block", marginBottom: 6 }}>Token generation failed</strong>
          <p style={{ margin: 0, fontSize: "14px" }}>{error}</p>
        </div>
      ) : null}

      {result ? (
        <>
          <div className="status-box" style={{ marginTop: 8 }}>
            <strong style={{ display: "block", marginBottom: 6 }}>
              {isUpdating ? "Configuration Updated Successfully" : "Token ready"}
            </strong>
            <p style={{ margin: 0, fontSize: "14px" }}>
              {isUpdating ? (
                <>
                  Your semester and credentials have been updated in the database. 
                  <strong> Your active MCP client configuration will automatically reflect these updates</strong>—no need to change the token settings in ChatGPT/Cursor/Claude!
                </>
              ) : (
                <>
                  Copy the bearer token below and use it for the remote MCP server at{" "}
                  <span className="mono" style={{ color: "var(--colors-primary-hover)" }}>{mcpUrl || result.mcpUrl}</span>.
                </>
              )}
            </p>
          </div>
          <div className="token-box" style={{ marginTop: 12 }}>
            <pre className="mono">{result.accessToken}</pre>
          </div>
        </>
      ) : null}
    </form>
  );
}
