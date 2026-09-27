"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import ReportForm from "./components/ReportForm";
import ReportsList from "./components/ReportsList";
import HotspotMap from "./components/HotspotMap";

export default function Home() {
  const { t } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);
  const [hotspots, setHotspots] = useState([]);
  const [stats, setStats] = useState({ totalReports: 0, totalHotspots: 0, fundedCount: 0 });

  useEffect(() => {
    async function loadData() {
      try {
        const [hsRes, repRes] = await Promise.all([
          fetch("/api/hotspots"),
          fetch("/api/reports"),
        ]);
        const hsData = await hsRes.json();
        const repData = await repRes.json();

        const hsList = hsData.hotspots || [];
        const repList = repData.reports || [];

        setHotspots(hsList);
        setStats({
          totalReports: repList.length,
          totalHotspots: hsList.length,
          fundedCount: hsList.filter((h) => h.funding_status === "funded").length,
        });
      } catch (err) {
        console.error("Failed to load map data:", err);
      }
    }
    loadData();
  }, [refreshKey]);

  return (
    <div>
      {/* Asymmetrical Editorial Hero (Stitch Visual Scaffolding) */}
      <section className="hero-editorial-section">
        <div className="hero-editorial-grid">
          <div className="hero-left-spine">
            <div style={{ marginBottom: "1rem" }}>
              <span className="brand-pill">{t.heroTag || "DIGITAL PUBLIC INFRASTRUCTURE CONSOLE"}</span>
            </div>
            <h1 className="hero-headline">
              {t.heroHeadline1 || "Citizen Voice to"} <br />
              <span style={{ color: "#2563eb" }}>{t.heroHeadline2 || "Municipal Action."}</span>
            </h1>
            <div className="hero-actions-strip">
              <a href="#report-form" className="btn-stitch-primary" style={{ padding: "0.8rem 1.6rem", fontSize: "0.95rem" }}>
                {t.reportIssueBtn || "Report an Issue"}
              </a>
              <a href="/hotspots" className="btn-stitch-secondary" style={{ padding: "0.8rem 1.6rem", fontSize: "0.95rem" }}>
                {t.exploreHotspotsBtn || "Explore Hotspots Map →"}
              </a>
              <a href="/planner" className="btn-stitch-secondary" style={{ padding: "0.8rem 1.6rem", fontSize: "0.95rem" }}>
                {t.plannerBtn || "Municipal Planner →"}
              </a>
            </div>
          </div>

          <div className="hero-right-float">
            <p className="hero-lead-text">
              {t.heroLead || "Vajra is India's precision AI infrastructure platform. We turn fragmented citizen complaints into geospatially clustered hotspots, verify photo evidence with Gemini Vision, and rank municipal spending using transparent greedy budget optimization."}
            </p>
            <div className="hero-meta-badges">
              <span className="meta-pill">Zero GCP Billing</span>
              <span className="meta-pill">Gemini Embedding 001</span>
              <span className="meta-pill">Cosine Proximity Clustering</span>
              <span className="meta-pill">Greedy Knapsack Engine</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Citizen Portal Section */}
      <section className="showcase-container" id="report-section">
        <div className="fog-panel">
          <div className="showcase-tab-bar">
            <div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 600, color: "#111" }}>
                Citizen Reporting Portal
              </h2>
              <p style={{ color: "#666", fontSize: "0.88rem" }}>
                Submit infrastructure defects directly to the public ledger for Gemini AI vectorization
              </p>
            </div>
            <div>
              <a href="/hotspots" className="btn-stitch-secondary" style={{ fontSize: "0.85rem", background: "#ffffff" }}>
                Open Full City Map ↗
              </a>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "2rem", alignItems: "start" }}>
            {/* Form */}
            <ReportForm onReportSubmitted={() => setRefreshKey((k) => k + 1)} />

            {/* Right: Live Map Preview & Activity Feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
              <div className="scaffold-card" style={{ padding: "1.5rem" }}>
                <div className="card-top-row" style={{ marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 600 }}>Neighborhood Hotspots</h3>
                    <p style={{ color: "#666", fontSize: "0.82rem" }}>
                      Active clusters within 2km proximity
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <span className="badge-status badge-funded-stitch">Funded</span>
                    <span className="badge-status badge-queued-stitch">Queued</span>
                  </div>
                </div>
                <HotspotMap hotspots={hotspots} height="360px" />
                <div style={{ marginTop: "1rem", textAlign: "right" }}>
                  <a href="/hotspots" style={{ fontSize: "0.82rem", color: "#2563eb", fontWeight: 600 }}>
                    View All {hotspots.length} Clusters on Dedicated Map →
                  </a>
                </div>
              </div>

              <div className="scaffold-card" style={{ padding: "1.5rem" }}>
                <ReportsList refreshKey={refreshKey} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Architecture Strip (Stitch Spec) */}
      <section className="trust-section">
        <div className="trust-lead">Engineered on Google Cloud & Digital Public Goods Architecture</div>
        <div className="trust-badges-grid">
          <div className="trust-badge-item">
            <span>⚡</span> Google Gemini 3.5 & Embedding 001
          </div>
          <div className="trust-badge-item">
            <span>🔥</span> Google Cloud Firestore (Spark Tier)
          </div>
          <div className="trust-badge-item">
            <span>🗺️</span> OpenStreetMap & Esri World Street
          </div>
          <div className="trust-badge-item">
            <span>💬</span> WhatsApp Cloud API Messaging
          </div>
        </div>
      </section>

      {/* Structural Scaffolding 3-Pillar Grid */}
      <section style={{ maxWidth: "1320px", margin: "0 auto 100px", padding: "0 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div className="brand-pill" style={{ display: "inline-block", marginBottom: "0.75rem" }}>
            PRECISION CIVIC ENGINE
          </div>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 700 }}>
            Three Pillars of Intelligent Governance
          </h2>
          <p style={{ color: "#666", maxWidth: "600px", margin: "0.75rem auto 0" }}>
            How Vajra replaces redundant complaint tracking with algorithmic action plans.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          <div className="scaffold-card">
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              1. Semantic Deduplication
            </h3>
            <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Instead of logging 50 separate tickets for one water pipe breach, Gemini vectors group them into a single high-confidence hotspot with quantified community corroboration.
            </p>
          </div>

          <div className="scaffold-card">
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📷</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              2. Multimodal Photo Verification
            </h3>
            <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Citizens attach photo evidence. Gemini Vision cross-references the image against the selected category, filtering out spam or irrelevant photos before entering the public ledger.
            </p>
          </div>

          <div className="scaffold-card">
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚖️</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              3. Greedy Fiscal Allocation
            </h3>
            <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Hotspots are ranked by urgency score (category weight × corroboration × recency). Available municipal budgets are greedily assigned to maximize public impact per rupee.
            </p>
          </div>
        </div>
      </section>

      {/* Dark Technical Console Callout */}
      <section style={{ maxWidth: "1320px", margin: "0 auto 120px", padding: "0 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "3rem", alignItems: "center" }}>
          <div>
            <div className="brand-pill" style={{ display: "inline-block", marginBottom: "0.75rem" }}>
              DEVELOPER & API ENGINE
            </div>
            <h2 style={{ fontSize: "2.3rem", fontWeight: 700, marginBottom: "1rem" }}>
              Algorithmic Clustering & Greedy Knapsack
            </h2>
            <p style={{ color: "#666", fontSize: "0.95rem", lineHeight: 1.65, marginBottom: "1.5rem" }}>
              Every citizen complaint is converted into a 3072-dimensional semantic vector using Gemini Embedding 001. Our spatial clustering evaluates both high-dimensional text cosine similarity and Haversine geographic distance.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <a href="/planner" className="btn-stitch-primary">
                Test Budget Engine →
              </a>
              <a href="/api/hotspots" target="_blank" className="btn-stitch-secondary">
                View Hotspots JSON
              </a>
            </div>
          </div>

          <div className="dark-console-box">
            <div className="console-header-dots">
              <span className="dot-red"></span>
              <span className="dot-yellow"></span>
              <span className="dot-green"></span>
              <span style={{ color: "#94a3b8", fontSize: "0.75rem", marginLeft: "8px", fontFamily: "var(--font-mono)" }}>
                vajra-ai-clustering-core.js
              </span>
            </div>
            <pre style={{ overflowX: "auto", margin: 0 }}>
              <code>
<span className="console-comment">// 1. Generate 3072-d Gemini Vector</span>{`\n`}
<span className="console-code">const</span> vector = <span className="console-code">await</span> gemini.embedContent(complaint.text);{`\n\n`}
<span className="console-comment">// 2. Compute Cosine & Spatial Haversine (2km proximity)</span>{`\n`}
<span className="console-code">const</span> match = hotspots.find(h =&gt; {`\n`}
  <span className="console-code">return</span> cosineSim(vector, h.embedding) &gt;= <span style={{ color: "#34d399" }}>0.78</span> &amp;&amp;{`\n`}
         haversineKm(complaint.coords, h.coords) &lt;= <span style={{ color: "#34d399" }}>2.0</span>;{`\n`}
{`});\n\n`}
<span className="console-comment">// 3. Greedy Knapsack Priority Allocation</span>{`\n`}
<span className="console-code">const</span> score = categoryWeight * corroboration * recency;{`\n`}
<span className="console-code">const</span> status = remainingBudget &gt;= cost ? <span style={{ color: "#34d399" }}>"funded"</span> : <span style={{ color: "#f59e0b" }}>"queued"</span>;
              </code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
