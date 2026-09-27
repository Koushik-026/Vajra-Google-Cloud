"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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

function StatusContent() {
  const searchParams = useSearchParams();
  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const idFromQuery = searchParams.get("id");
    if (idFromQuery) {
      setReportId(idFromQuery);
      fetchStatus(idFromQuery);
    }
  }, [searchParams]);

  async function fetchStatus(id) {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch(`/api/status/${id.trim()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Report not found with this tracking ID.");
      } else {
        setReport(data);
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLookup(e) {
    e.preventDefault();
    fetchStatus(reportId);
  }

  const isFunded = report?.status === "funded" || report?.hotspot?.funding_status === "funded";
  const isQueued = report?.status === "queued" || report?.hotspot?.funding_status === "queued";

  return (
    <div style={{ maxWidth: "780px", margin: "110px auto 80px", padding: "0 1.5rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <span className="brand-pill" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
          PUBLIC TRANSPARENCY LEDGER
        </span>
        <h1 style={{ fontSize: "2.4rem", fontWeight: 700, margin: "0.25rem 0" }}>
          Track Infrastructure Complaint
        </h1>
        <p style={{ color: "#666", fontSize: "0.95rem" }}>
          Follow your report from Gemini AI vectorization to neighborhood clustering and municipal funding.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="scaffold-card" style={{ padding: "1.8rem 2rem", marginBottom: "2rem" }}>
        <form onSubmit={handleLookup}>
          <label className="form-label-stitch" htmlFor="report-search-input">
            Enter 20-character Tracking ID
          </label>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              id="report-search-input"
              type="text"
              className="form-input-stitch"
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              placeholder="E.g., GNxSXuR4WYKHCrJNxroc"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem" }}
            />
            <button
              type="submit"
              className="btn-stitch-primary"
              disabled={loading || !reportId.trim()}
              style={{ minWidth: "150px", justifyContent: "center" }}
            >
              {loading ? "Searching..." : "Track Status →"}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "1rem",
            color: "#991b1b",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Report Details and Timeline */}
      {report && (
        <div className="scaffold-card" style={{ padding: "2.5rem" }}>
          {/* Status Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid #e7e7e4", paddingBottom: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "1.4rem" }}>
                  {CATEGORY_ICONS[report.category] || "📍"}
                </span>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, textTransform: "capitalize" }}>
                  {report.category?.replace(/_/g, " ")} Issue
                </h2>
              </div>
              <p style={{ color: "#666", fontSize: "0.85rem" }}>
                Tracking ID: <code style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{report.id}</code>
              </p>
            </div>
            <div>
              <span className={`badge-status ${isFunded ? "badge-funded-stitch" : isQueued ? "badge-queued-stitch" : "badge-received-stitch"}`} style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>
                {isFunded ? "✓ FUNDED FOR TENDER" : isQueued ? "⏳ QUEUED FOR BUDGET" : "📩 RECEIVED"}
              </span>
            </div>
          </div>

          {/* Minimalist Progress Timeline */}
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.2rem" }}>Lifecycle Progression</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", borderLeft: "2px solid #e5e7eb", paddingLeft: "1.5rem", marginLeft: "0.5rem" }}>
            {/* Step 1 */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-2.15rem", top: "2px", width: "18px", height: "18px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>✓</div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>1. Complaint Logged to Public Ledger</div>
              <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "2px" }}>
                Recorded on {new Date(report.created_at).toLocaleString()}.
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-2.15rem", top: "2px", width: "18px", height: "18px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>✓</div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>2. Gemini Vectorization & Vision Verification</div>
              <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "2px" }}>
                Complaint vectorized with Gemini Embedding 001.
                {report.photo_verification?.checked && (
                  <span style={{ display: "block", color: "#059669", fontWeight: 500, marginTop: "2px" }}>
                    📷 Gemini Vision verified photo match ({Math.round(report.photo_verification.confidence * 100)}% confidence).
                  </span>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-2.15rem", top: "2px", width: "18px", height: "18px", borderRadius: "50%", background: report.hotspot ? "#059669" : "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                {report.hotspot ? "✓" : "●"}
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>3. Neighborhood Hotspot Clustering</div>
              <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "2px" }}>
                {report.hotspot ? (
                  <span>
                    Corroborated with <strong style={{ color: "#111" }}>{report.hotspot.corroboration_count} citizen report(s)</strong> within 2km radius. Priority Score: <strong>{report.hotspot.priority_score}</strong>.
                  </span>
                ) : (
                  "Evaluating spatial proximity..."
                )}
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-2.15rem", top: "2px", width: "18px", height: "18px", borderRadius: "50%", background: isFunded ? "#059669" : isQueued ? "#d97706" : "#9ca3af", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                {isFunded ? "✓" : "●"}
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>4. Municipal Budget Allocation</div>
              <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "2px" }}>
                {isFunded ? (
                  <span style={{ color: "#059669", fontWeight: 500 }}>
                    ✓ High priority score cleared the municipal budget cutoff! Civic tender is approved and funded.
                  </span>
                ) : isQueued ? (
                  <span style={{ color: "#d97706", fontWeight: 500 }}>
                    ⏳ Hotspot is verified on the municipal priority board. Currently queued for funding in the next budget allocation round.
                  </span>
                ) : (
                  "Pending municipal planner budget run."
                )}
              </div>
            </div>
          </div>

          {/* Hotspot Community Box */}
          {report.hotspot && (
            <div
              style={{
                marginTop: "2.5rem",
                padding: "1.2rem 1.5rem",
                background: "#f9f9f9",
                border: "1px solid #e7e7e4",
                borderRadius: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ color: "#666", fontSize: "0.78rem", textTransform: "uppercase" }}>Hotspot Identifier</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "#111" }}>
                  {report.hotspot_id}
                </div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: "0.78rem", textTransform: "uppercase" }}>Corroboration</div>
                <div style={{ color: "#111", fontWeight: 700, fontSize: "1.1rem" }}>
                  {report.hotspot.corroboration_count} Citizen{report.hotspot.corroboration_count > 1 ? "s" : ""}
                </div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: "0.78rem", textTransform: "uppercase" }}>Priority Score</div>
                <div style={{ color: "#2563eb", fontWeight: 700, fontSize: "1.1rem" }}>
                  {report.hotspot.priority_score} / 100
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href="/" style={{ color: "#000", fontWeight: 600, fontSize: "0.88rem" }}>
              ← Submit Another Report
            </a>
            <a href="/planner" style={{ color: "#666", fontSize: "0.88rem" }}>
              View City Priority Board →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div style={{ padding: "8rem", textAlign: "center", color: "#666" }}>Loading status...</div>}>
      <StatusContent />
    </Suspense>
  );
}
