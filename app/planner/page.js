"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  const [rawHotspots, setRawHotspots] = useState([]);
  const [budget, setBudget] = useState({ total_budget: 100, allocated_so_far: 0 });
  const [sliderValue, setSliderValue] = useState(100);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [hotspotsRes, budgetRes] = await Promise.all([
        fetch("/api/hotspots"),
        fetch("/api/budget"),
      ]);
      const hotspotsData = await hotspotsRes.json();
      const budgetData = await budgetRes.json();

      setRawHotspots(hotspotsData.hotspots || []);
      setBudget(budgetData);
      setSliderValue(budgetData.total_budget || 100);
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
            Priority Ranking & Budget Allocation
          </h1>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            Dynamic greedy knapsack optimization: <code style={{ color: "#2563eb" }}>category_weight × corroboration × recency</code>.
          </p>
        </div>
        <button
          onClick={() => setAuthenticated(false)}
          className="btn-stitch-secondary"
        >
          Lock Session
        </button>
      </div>

      {/* Interactive Budget Control Card (Stitch Scaffolding) */}
      <div className="scaffold-card" style={{ marginBottom: "2.5rem", background: "#fdf8f8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>
              Live Municipal Budget Allocation
            </h2>
            <p style={{ color: "#666", fontSize: "0.85rem" }}>
              Drag to simulate capital allocation thresholds. Watch projects automatically transition between funded and queued.
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
              {allocating ? "Committing..." : "Commit Decision to Ledger →"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div className="scaffold-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>Funded Hotspots</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "#059669", marginTop: "0.2rem" }}>{fundedHotspots.length}</div>
          <div style={{ fontSize: "0.78rem", color: "#888" }}>Immediate tenders approved</div>
        </div>
        <div className="scaffold-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>Queued Hotspots</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "#d97706", marginTop: "0.2rem" }}>{queuedHotspots.length}</div>
          <div style={{ fontSize: "0.78rem", color: "#888" }}>Awaiting next budget round</div>
        </div>
        <div className="scaffold-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>Total Verified Hotspots</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "#111", marginTop: "0.2rem" }}>{simulatedHotspots.length}</div>
          <div style={{ fontSize: "0.78rem", color: "#888" }}>Across all municipal wards</div>
        </div>
        <div className="scaffold-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>Budget Utilization</div>
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
          <div className="card-top-row">
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Priority Ranked Hotspots</h3>
              <p style={{ color: "#666", fontSize: "0.82rem" }}>Sorted by algorithmic score (Greedy allocation sequence)</p>
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
                  </tr>
                </thead>
                <tbody>
                  {simulatedHotspots.map((h, idx) => {
                    const isFunded = h.funding_status === "funded";
                    const isSelected = selectedHotspotId === h.id;

                    return (
                      <tr
                        key={h.id}
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
                      </tr>
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
