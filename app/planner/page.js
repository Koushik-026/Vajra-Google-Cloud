"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import HotspotMap from "../components/HotspotMap";

const CATEGORY_LABELS = {
  roads: "🛣️ Roads & Potholes",
  water_supply: "🚰 Water Supply",
  sanitation: "🧹 Sanitation & Sewage",
  streetlights: "💡 Streetlights",
  drainage: "🌊 Drainage & Floods",
  health_facility: "🏥 Health Facility",
  public_transport: "🚌 Public Transit",
  solid_waste: "🗑️ Solid Waste",
  other: "⚠️ Other Issues",
};

const CATEGORY_COSTS = {
  roads: 20,
  water_supply: 15,
  sanitation: 12,
  streetlights: 5,
  drainage: 18,
  health_facility: 25,
  public_transport: 15,
  solid_waste: 8,
  other: 10,
};

export default function PlannerDashboard() {
  const { t } = useLanguage();
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  const [rawHotspots, setRawHotspots] = useState([]);
  const [budget, setBudget] = useState({ total_budget: 100, allocated_so_far: 0 });
  const [sliderValue, setSliderValue] = useState(100);
  const [rawReportsCount, setRawReportsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [briefings, setBriefings] = useState({});
  const [briefingLoading, setBriefingLoading] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [hotspotsRes, budgetRes, reportsRes] = await Promise.all([
        fetch("/api/hotspots"),
        fetch("/api/budget"),
        fetch("/api/reports"),
      ]);
      const hotspotsData = await hotspotsRes.json();
      const budgetData = await budgetRes.json();
      const reportsData = await reportsRes.json();

      setRawHotspots(hotspotsData.hotspots || []);
      setBudget(budgetData);
      setSliderValue(budgetData.total_budget || 100);
      setRawReportsCount(reportsData.reports ? reportsData.reports.length : 0);
    } catch (err) {
      console.error("Failed to fetch planner data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, fetchData]);

  function handleLogin(e) {
    e.preventDefault();
    if (passcode.trim() === "vajra-demo-2026") {
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid passcode. Use demo key: vajra-demo-2026");
    }
  }

  // Live greedy simulation based on sliderValue
  const simulatedHotspots = useMemo(() => {
    let remainingBudget = sliderValue;
    return rawHotspots.map((h) => {
      const cost = h.sample_budget_used || CATEGORY_COSTS[h.category] || 10;
      if (remainingBudget >= cost) {
        remainingBudget -= cost;
        return { ...h, funding_status: "funded", cost };
      } else {
        return { ...h, funding_status: "queued", cost };
      }
    });
  }, [rawHotspots, sliderValue]);

  const allocatedBudget = useMemo(() => {
    return simulatedHotspots
      .filter((h) => h.funding_status === "funded")
      .reduce((sum, h) => sum + (h.cost || 10), 0);
  }, [simulatedHotspots]);

  async function applyBudget() {
    setAllocating(true);
    setSaveMessage(null);
    try {
      await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total_budget: sliderValue }),
      });

      await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reallocate" }),
      });

      await fetchData();
      setSaveMessage("Budget & allocation committed to Firestore!");
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err) {
      console.error("Failed to update budget:", err);
    } finally {
      setAllocating(false);
    }
  }

  // Feature 3: Export as open civic-data format (vajra-open-demand-v1)
  const exportOpenDemandJson = (hotspot, e) => {
    if (e) e.stopPropagation();
    const payload = {
      schema_version: "vajra-open-demand-v1",
      hotspot_id: hotspot.id,
      category: hotspot.category,
      location: {
        lat: hotspot.location?.lat || 0,
        lng: hotspot.location?.lng || 0,
      },
      corroboration_count: hotspot.corroboration_count || 1,
      priority_score: parseFloat((hotspot.priority_score || 0).toFixed(2)),
      funding_status: hotspot.funding_status || "queued",
      country: "IN",
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vajra-open-demand-${hotspot.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Feature 4: AI hotspot briefing generator (Gemini 3.5 synthesis)
  async function generateBriefing(hotspot, e) {
    if (e) e.stopPropagation();
    const id = hotspot.id;
    setBriefingLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotspot_id: hotspot.id,
          category: hotspot.category,
          priority_score: hotspot.priority_score,
          corroboration_count: hotspot.corroboration_count,
          location: hotspot.location,
          funding_status: hotspot.funding_status,
        }),
      });
      const data = await res.json();
      if (data.briefing) {
        setBriefings((prev) => ({ ...prev, [id]: data.briefing }));
      }
    } catch (err) {
      console.error("Failed to generate briefing:", err);
      setBriefings((prev) => ({
        ...prev,
        [id]: "Failed to generate briefing. Please check network and try again.",
      }));
    } finally {
      setBriefingLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  // Authentication Screen
  if (!authenticated) {
    return (
      <div style={{ maxWidth: "440px", margin: "130px auto", padding: "0 1.5rem" }}>
        <div className="scaffold-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏛️</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.4rem" }}>
            Municipal Planner Portal
          </h2>
          <p style={{ color: "#666", fontSize: "0.88rem", marginBottom: "2rem" }}>
            Authorized console for municipal commissioners & budget allocators.
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group-stitch" style={{ textAlign: "left" }}>
              <label className="form-label-stitch" htmlFor="passcode-input">
                Planner Passcode
              </label>
              <input
                id="passcode-input"
                type="password"
                className="form-input-stitch"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
              />
              <div style={{ color: "#888", fontSize: "0.78rem", marginTop: "0.4rem" }}>
                Demo key: <code style={{ color: "#000", fontWeight: 600 }}>vajra-demo-2026</code>
              </div>
            </div>

            {authError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  color: "#991b1b",
                  fontSize: "0.85rem",
                  marginBottom: "1.2rem",
                }}
              >
                {authError}
              </div>
            )}

            <button type="submit" className="btn-stitch-primary" style={{ width: "100%", justifyContent: "center" }}>
              Unlock Dashboard →
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "8rem 2rem", textAlign: "center", color: "#666" }}>
        Loading Municipal Planner Decision Space...
      </div>
    );
  }

  const fundedHotspots = simulatedHotspots.filter((h) => h.funding_status === "funded");
  const queuedHotspots = simulatedHotspots.filter((h) => h.funding_status === "queued");

  return (
    <div style={{ maxWidth: "1320px", margin: "100px auto 80px", padding: "0 2rem" }}>
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span className="brand-pill" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
            MUNICIPAL DECISION SUPPORT SYSTEM
          </span>
          <h1 style={{ fontSize: "2.3rem", fontWeight: 700, margin: "0.25rem 0" }}>
            {t.plannerTitle || "Priority Ranking & Budget Allocation"}
          </h1>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            {t.plannerSubtitle || "Dynamic greedy knapsack optimization: category_weight × corroboration × recency."}
          </p>
        </div>
        <button
          onClick={() => setAuthenticated(false)}
          className="btn-stitch-secondary"
        >
          Lock Session
        </button>
      </div>

      {/* Prominent Noise-Reduction Metric (Additive Feature 1) */}
      <div
        className="scaffold-card"
        style={{
          padding: "1.4rem 2rem",
          marginBottom: "2rem",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid #cbd5e1",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.2rem",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#64748b",
              display: "inline-block",
              marginBottom: "4px",
            }}
          >
            {t.noiseReductionTitle || "AI DEMAND AGGREGATION & NOISE REDUCTION"}
          </span>
          <div
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            <span style={{ color: "#475569" }}>{rawReportsCount} {t.rawReportsLabel || "raw reports"}</span>
            <span style={{ color: "#2563eb", margin: "0 12px" }}>→</span>
            <span style={{ color: "#059669" }}>{simulatedHotspots.filter((h) => h.funding_status).length} {t.verifiedHotspotsLabel || "verified hotspots"}</span>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
            {t.noiseReductionSub || "Gemini vector embeddings deduplicated fragmented citizen complaints into verified, actionable municipal action plans."}
          </p>
        </div>
        <div style={{ textAlign: "right", borderLeft: "1px solid #e2e8f0", paddingLeft: "1.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
            {t.noiseFilteredLabel || "Redundancy Filtered"}
          </span>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#2563eb", lineHeight: 1.1 }}>
            {rawReportsCount > 0
              ? `${Math.max(0, Math.round(((rawReportsCount - simulatedHotspots.filter((h) => h.funding_status).length) / rawReportsCount) * 100))}%`
              : "0%"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{t.noiseEliminated || "Noise eliminated"}</span>
        </div>
      </div>

      {/* Interactive Budget Control Card (Stitch Scaffolding) */}
      <div className="scaffold-card" style={{ marginBottom: "2.5rem", background: "#fdf8f8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>
              {t.budgetSliderTitle || "Live Municipal Budget Allocation"}
            </h2>
            <p style={{ color: "#666", fontSize: "0.85rem" }}>
              {t.budgetSliderSub || "Drag to simulate capital allocation thresholds. Watch projects automatically transition between funded and queued."}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.78rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Selected Budget Pool
            </span>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>
              ₹{sliderValue} Lakhs
            </div>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="500"
          step="5"
          value={sliderValue}
          onChange={(e) => setSliderValue(parseInt(e.target.value))}
          style={{
            width: "100%",
            height: "8px",
            borderRadius: "4px",
            background: "#e5e7eb",
            accentColor: "#000000",
            cursor: "pointer",
            margin: "0.5rem 0 1rem",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", color: "#888", fontSize: "0.78rem", marginBottom: "1.5rem" }}>
          <span>₹0 Lakhs (Austerity)</span>
          <span>₹250 Lakhs (Baseline)</span>
          <span>₹500 Lakhs (Expanded Grants)</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid #e7e7e4", paddingTop: "1.2rem" }}>
          <div style={{ display: "flex", gap: "2rem" }}>
            <div>
              <span style={{ color: "#666", fontSize: "0.8rem" }}>Allocated Tenders:</span>{" "}
              <strong style={{ color: "#059669", fontSize: "1.1rem" }}>₹{allocatedBudget} L</strong>
            </div>
            <div>
              <span style={{ color: "#666", fontSize: "0.8rem" }}>Unallocated Reserve:</span>{" "}
              <strong style={{ color: "#111", fontSize: "1.1rem" }}>₹{Math.max(0, sliderValue - allocatedBudget)} L</strong>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {saveMessage && (
              <span style={{ color: "#059669", fontSize: "0.85rem", fontWeight: 600 }}>
                ✓ {saveMessage}
              </span>
            )}
            <button
              onClick={applyBudget}
              className="btn-stitch-primary"
              disabled={allocating}
            >
              {allocating ? "Committing..." : (t.commitBudgetBtn || "Commit Decision to Ledger →")}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div className="scaffold-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>{t.fundedHotspotsStat || "Funded Hotspots"}</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "#059669", marginTop: "0.2rem" }}>{fundedHotspots.length}</div>
          <div style={{ fontSize: "0.78rem", color: "#888" }}>Immediate tenders approved</div>
        </div>
        <div className="scaffold-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>{t.queuedHotspotsStat || "Queued Hotspots"}</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "#d97706", marginTop: "0.2rem" }}>{queuedHotspots.length}</div>
          <div style={{ fontSize: "0.78rem", color: "#888" }}>Awaiting next budget round</div>
        </div>
        <div className="scaffold-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>{t.totalHotspotsStat || "Total Verified Hotspots"}</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "#111", marginTop: "0.2rem" }}>{simulatedHotspots.length}</div>
          <div style={{ fontSize: "0.78rem", color: "#888" }}>Across all municipal wards</div>
        </div>
        <div className="scaffold-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>{t.budgetUtilizationStat || "Budget Utilization"}</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "#2563eb", marginTop: "0.2rem" }}>
            {sliderValue > 0 ? ((allocatedBudget / sliderValue) * 100).toFixed(0) : 0}%
          </div>
          <div style={{ fontSize: "0.78rem", color: "#888" }}>Fiscal efficiency</div>
        </div>
      </div>

      {/* Split Map & Ranked Table */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem", alignItems: "start" }}>
        {/* Left: Ranked Hotspot Table */}
        <div className="scaffold-card" style={{ padding: "1.8rem" }}>
          <div className="card-top-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Priority Ranked Hotspots</h3>
              <p style={{ color: "#666", fontSize: "0.82rem" }}>Sorted by algorithmic score (Greedy allocation sequence)</p>
            </div>
            <div
              style={{
                fontSize: "0.76rem",
                color: "#1d4ed8",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                padding: "6px 12px",
                borderRadius: "6px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🌐</span>
              <span>Open format for cross-region demand-signal interoperability</span>
            </div>
          </div>

          {simulatedHotspots.length === 0 ? (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#9ca3af" }}>
              No hotspots yet. Submit reports on the Citizen Portal to begin clustering.
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #e7e7e4", borderRadius: "12px" }}>
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Sector</th>
                    <th>Corroboration</th>
                    <th>Score</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Interoperability</th>
                  </tr>
                </thead>
                <tbody>
                  {simulatedHotspots.map((h, idx) => {
                    const isFunded = h.funding_status === "funded";
                    const isSelected = selectedHotspotId === h.id;

                    return (
                      <Fragment key={h.id}>
                        <tr
                          onClick={() => setSelectedHotspotId(h.id)}
                          style={{
                            cursor: "pointer",
                            background: isSelected
                              ? "#f1f5f9"
                              : isFunded
                              ? "#f0fdf4"
                              : "transparent",
                          }}
                        >
                          <td>
                            <span style={{ fontWeight: 700, color: idx < 3 ? "#2563eb" : "#666" }}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 500 }}>
                              {CATEGORY_LABELS[h.category] || h.category}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: "#4b5563" }}>
                              👥 {h.corroboration_count || 1} report{(h.corroboration_count || 1) > 1 ? "s" : ""}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: "#111" }}>{h.priority_score?.toFixed(1)}</strong>
                          </td>
                          <td>
                            <span>₹{h.cost || 10}L</span>
                          </td>
                          <td>
                            <span className={`badge-status ${isFunded ? "badge-funded-stitch" : "badge-queued-stitch"}`}>
                              {isFunded ? "✓ Funded" : "⏳ Queued"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                onClick={(e) => exportOpenDemandJson(h, e)}
                                title="Export as open civic-data format (vajra-open-demand-v1)"
                                className="btn-stitch-secondary"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "0.72rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  borderRadius: "6px",
                                  background: "#ffffff",
                                  border: "1px solid #d1d5db",
                                  fontWeight: 600,
                                }}
                              >
                                <span>📥</span>
                                <span>Export JSON</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => generateBriefing(h, e)}
                                disabled={briefingLoading[h.id]}
                                title="Generate 3-5 sentence AI executive briefing with Gemini 3.5"
                                className="btn-stitch-primary"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "0.72rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  borderRadius: "6px",
                                  background: "#0f172a",
                                  color: "#ffffff",
                                  fontWeight: 600,
                                }}
                              >
                                <span>{briefingLoading[h.id] ? "⏳" : "✨"}</span>
                                <span>{briefingLoading[h.id] ? "Generating..." : "Generate briefing"}</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline AI Executive Briefing Row */}
                        {(briefingLoading[h.id] || briefings[h.id]) && (
                          <tr style={{ background: "#f8fafc" }}>
                            <td colSpan={7} style={{ padding: "0.9rem 1.25rem" }}>
                              <div
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #e2e8f0",
                                  borderLeft: "4px solid #2563eb",
                                  borderRadius: "8px",
                                  padding: "1rem 1.25rem",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "14px" }}>✨</span>
                                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>
                                      Gemini 3.5 AI Executive Briefing
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.7rem",
                                        background: "#eff6ff",
                                        color: "#1d4ed8",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      On-Demand Strategic Synthesis
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBriefings((prev) => {
                                        const next = { ...prev };
                                        delete next[h.id];
                                        return next;
                                      });
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#94a3b8",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                      padding: "0 4px",
                                    }}
                                    title="Dismiss briefing"
                                  >
                                    ✕
                                  </button>
                                </div>

                                {briefingLoading[h.id] ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "0.84rem", padding: "0.4rem 0" }}>
                                    <span>⏳</span>
                                    <span>Synthesizing citizen complaints & generating municipal action briefing with Gemini 3.5 Flash...</span>
                                  </div>
                                ) : (
                                  <div>
                                    <p style={{ color: "#334155", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                                      {briefings[h.id]}
                                    </p>
                                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.6rem", fontSize: "0.73rem", color: "#64748b", flexWrap: "wrap" }}>
                                      <span>✓ Problem Pattern Identified</span>
                                      <span>✓ Civic & Commuter Impact Analyzed</span>
                                      <span>✓ Priority Action Recommended</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: CartoDB Hotspot Map */}
        <div className="scaffold-card" style={{ padding: "1.8rem" }}>
          <div className="card-top-row" style={{ marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Geospatial Distribution</h3>
              <p style={{ color: "#666", fontSize: "0.82rem" }}>Select a table row or pin to highlight cluster</p>
            </div>
          </div>
          <HotspotMap
            hotspots={simulatedHotspots}
            selectedId={selectedHotspotId}
            onSelect={(id) => setSelectedHotspotId(id)}
            height="520px"
          />
        </div>
      </div>
    </div>
  );
}
