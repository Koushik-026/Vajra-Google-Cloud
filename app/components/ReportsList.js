"use client";

import { useState, useEffect } from "react";

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

  if (loading) return <p>Loading reports...</p>;
  if (error) return <p className="error-banner">Error: {error}</p>;
  if (reports.length === 0) return <p>No reports yet. Submit the first one above!</p>;

  const statusEmoji = {
    received: "📩",
    verified: "✅",
    funded: "💰",
    queued: "⏳",
  };

  return (
    <div className="reports-list">
      <h2>Recent Reports ({reports.length})</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Category</th>
            <th>Description</th>
            <th>Status</th>
            <th>Location</th>
            <th>Photo Check</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td title={r.id}>
                <code>{r.id.substring(0, 8)}…</code>
              </td>
              <td>{r.category}</td>
              <td className="desc-cell" title={r.text}>
                {r.text.length > 60 ? r.text.substring(0, 60) + "…" : r.text}
              </td>
              <td>
                {statusEmoji[r.status] || "❓"} {r.status}
              </td>
              <td>
                {r.lat?.toFixed(3)}, {r.lng?.toFixed(3)}
              </td>
              <td>
                {r.photo_verification?.checked
                  ? `${r.photo_verification.matches_category} (${(
                      r.photo_verification.confidence * 100
                    ).toFixed(0)}%)`
                  : "—"}
              </td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
