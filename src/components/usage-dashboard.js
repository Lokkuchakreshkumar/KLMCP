"use client";

import { useEffect, useMemo, useState } from "react";

const numberFormatter = new Intl.NumberFormat("en-US");

const formatNumber = (value) => numberFormatter.format(value || 0);

const formatDateTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const MetricCard = ({ label, value, detail }) => (
  <div className="usage-metric-card">
    <span>{label}</span>
    <strong>{formatNumber(value)}</strong>
    {detail && <small>{detail}</small>}
  </div>
);

export function UsageDashboard() {
  const [secret, setSecret] = useState("");
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedSecret = window.localStorage.getItem("klmcp_usage_secret");
    if (savedSecret) {
      setSecret(savedSecret);
    }
  }, []);

  const maxDailyRequests = useMemo(() => {
    if (!summary?.dailyRequestsLast7d?.length) return 1;
    return Math.max(...summary.dailyRequestsLast7d.map((day) => day.requests), 1);
  }, [summary]);

  const loadUsage = async (event) => {
    event?.preventDefault();
    const trimmedSecret = secret.trim();

    if (!trimmedSecret) {
      setError("Enter the analytics secret first.");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/usage", {
        headers: {
          Authorization: `Bearer ${trimmedSecret}`,
        },
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load usage analytics.");
      }

      window.localStorage.setItem("klmcp_usage_secret", trimmedSecret);
      setSummary(payload);
      setStatus("ready");
    } catch (err) {
      setSummary(null);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to load usage analytics.");
    }
  };

  return (
    <div className="usage-dashboard">
      <section className="usage-hero">
        <div>
          <span className="eyebrow">Analytics</span>
          <h1 className="headline">KLMCP usage dashboard</h1>
          <p>
            Track MCP requests, unique users, tool calls, failures, and latency from the
            MongoDB usage events collection.
          </p>
        </div>

        <form className="usage-secret-form" onSubmit={loadUsage}>
          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="Analytics secret"
            aria-label="Analytics secret"
          />
          <button className="primary-button" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Loading" : "Load"}
          </button>
        </form>
      </section>

      {error && <div className="usage-error">{error}</div>}

      {!summary && !error && (
        <section className="usage-empty">
          <strong>Enter your secret to view live usage.</strong>
          <span>The secret is stored only in this browser's local storage.</span>
        </section>
      )}

      {summary && (
        <>
          <div className="usage-refresh-row">
            <span>Updated {formatDateTime(summary.generatedAt)}</span>
            <button className="secondary-button" type="button" onClick={loadUsage}>
              Refresh
            </button>
          </div>

          <section className="usage-metric-grid">
            <MetricCard
              label="Total requests"
              value={summary.totals.mcpRequests}
              detail={`${formatNumber(summary.last24h.mcpRequests)} in 24h`}
            />
            <MetricCard
              label="Total tool calls"
              value={summary.totals.toolCalls}
              detail={`${formatNumber(summary.last24h.toolCalls)} in 24h`}
            />
            <MetricCard
              label="Unique users"
              value={summary.totals.uniqueUsers}
              detail={`${formatNumber(summary.last7d.uniqueUsers)} in 7d`}
            />
            <MetricCard
              label="Failures"
              value={summary.totals.failures}
              detail={`${formatNumber(summary.last7d.failures)} in 7d`}
            />
          </section>

          <section className="usage-grid-two">
            <div className="usage-panel">
              <div className="usage-panel-header">
                <h2>Tool calls</h2>
                <span>Last 7 days</span>
              </div>
              <div className="usage-table-wrap">
                <table className="usage-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Calls</th>
                      <th>Failures</th>
                      <th>Avg ms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.toolBreakdownLast7d.length ? (
                      summary.toolBreakdownLast7d.map((tool) => (
                        <tr key={tool.toolName}>
                          <td>{tool.toolName}</td>
                          <td>{formatNumber(tool.calls)}</td>
                          <td>{formatNumber(tool.failures)}</td>
                          <td>{formatNumber(tool.avgDurationMs)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">No tool calls recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="usage-panel">
              <div className="usage-panel-header">
                <h2>Daily requests</h2>
                <span>Last 7 days</span>
              </div>
              <div className="usage-bars">
                {summary.dailyRequestsLast7d.length ? (
                  summary.dailyRequestsLast7d.map((day) => (
                    <div className="usage-bar-row" key={day.date}>
                      <span>{day.date}</span>
                      <div className="usage-bar-track">
                        <div
                          className="usage-bar-fill"
                          style={{ width: `${Math.max((day.requests / maxDailyRequests) * 100, 3)}%` }}
                        />
                      </div>
                      <strong>{formatNumber(day.requests)}</strong>
                    </div>
                  ))
                ) : (
                  <div className="usage-empty-inline">No requests recorded yet.</div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
