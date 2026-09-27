"use client";

import { useState, useEffect } from "react";

const CATEGORY_ICONS = {
  roads: "🛣️",
  water_supply: "🚰",
  sanitation: "🧹",
  streetlights: "💡",
  drainage: "🌊",
  health_facility: "🏥",
  public_transport: "🚌",
  solid_waste: "🗑️",
  other: "⚠️",
};

export default function ReportsList({ refreshKey }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to fetch reports: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, [refreshKey]);

  if (loading) {
    return (
      <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#6b7280" }}>
        Loading public ledger reports...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1rem", color: "#ef4444", fontSize: "0.88rem" }}>
        Error loading ledger: {error}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "#9ca3af" }}>
        <p style={{ fontSize: "0.9rem" }}>No citizen reports recorded yet. Submit the first report above.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
            Recent Activity ({reports.length})
          </h3>
          <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Real-time feed of citizen complaints processed by Gemini AI
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="btn-stitch-secondary"
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
        >
          Refresh Feed
        </button>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #e7e7e4", borderRadius: "12px" }}>
        <table className="stitch-table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Sector</th>
              <th>Description</th>
              <th>Status</th>
              <th>Vision</th>
              <th>Ledger</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => {
              const isFunded = r.status === "funded";
              const isQueued = r.status === "queued";
              const statusClass = isFunded
                ? "badge-funded-stitch"
                : isQueued
                ? "badge-queued-stitch"
                : "badge-received-stitch";

              const icon = CATEGORY_ICONS[r.category] || "📍";

              return (
                <tr key={r.id}>
                  <td>
                    <code
                      style={{
                        background: "#f3f4f6",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontFamily: "var(--font-mono)",
                        color: "#1f2937",
                      }}
                    >
                      {r.id.substring(0, 8)}…
                    </code>
                  </td>
                  <td>
                    <span style={{ whiteSpace: "nowrap", fontWeight: 500 }}>
                      {icon} {r.category?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td title={r.text} style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#4b5563" }}>
                    {r.text}
                  </td>
                  <td>
                    <span className={`badge-status ${statusClass}`}>
                      {r.status || "received"}
                    </span>
                  </td>
                  <td>
                    {r.photo_verification?.checked ? (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: r.photo_verification.matches_category === "yes" ? "#059669" : "#dc2626",
                        }}
                      >
                        {r.photo_verification.matches_category === "yes" ? "✓ Verified" : "✗ Flagged"}
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>—</span>
                    )}
                  </td>
                  <td>
                    <a
                      href={`/status?id=${r.id}`}
                      style={{
                        color: "#000000",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        textDecoration: "underline",
                      }}
                    >
                      View →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
