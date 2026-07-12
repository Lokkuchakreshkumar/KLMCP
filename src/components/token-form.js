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

  useEffect(() => {
    try {
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

    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
          <strong>Token generation failed</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {result ? (
        <>
          <div className="status-box">
            <strong>Token ready</strong>
            <p>
              Copy the bearer token below and use it for the remote MCP server at{" "}
              <span className="mono">{mcpUrl || result.mcpUrl}</span>.
            </p>
          </div>
          <div className="token-box">
            <pre className="mono">{result.accessToken}</pre>
          </div>
        </>
      ) : null}
    </form>
  );
}
