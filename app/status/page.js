"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

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

// Hardcoded multilingual lookup object (Instant & 100% demo-safe)
const STATUS_TRANSLATIONS = {
  en: {
    received: "Received",
    verified: "Verified",
    funded: "Funded",
    queued: "Queued",
    badgeFunded: "✓ FUNDED FOR TENDER",
    badgeQueued: "⏳ QUEUED FOR BUDGET",
    badgeReceived: "📩 RECEIVED",
    step1Title: "1. Complaint Logged to Public Ledger",
    step1Desc: "Recorded on public ledger.",
    step2Title: "2. Gemini Vectorization & Vision Verification",
    step2Desc: "Complaint vectorized with Gemini Embedding 001.",
    photoVerified: "📷 Gemini Vision verified photo match",
    step3Title: "3. Neighborhood Hotspot Clustering",
    step3Desc: "Corroborated with citizen reports within 2km radius.",
    step4Title: "4. Municipal Budget Allocation",
    step4Funded: "✓ High priority score cleared the municipal budget cutoff! Civic tender is approved and funded.",
    step4Queued: "⏳ Hotspot is verified on the municipal priority board. Currently queued for funding in next round.",
    hotspotId: "Hotspot Identifier",
    corroboration: "Community Corroboration",
    citizenCountSuffix: "Citizen Report(s)",
    priorityScore: "Priority Score",
    searchLabel: "Enter 20-character Tracking ID",
    searchBtn: "Track Status →",
    searching: "Searching...",
    subtitle: "Follow your report from Gemini AI vectorization to neighborhood clustering and municipal funding.",
  },
  te: {
    received: "స్వీకరించబడింది",
    verified: "ధృవీకరించబడింది",
    funded: "నిధులు మంజూరయ్యాయి",
    queued: "జాబితాలో వేచి ఉంది",
    badgeFunded: "✓ నిధులు మంజూరయ్యాయి",
    badgeQueued: "⏳ బడ్జెట్ కోసం వేచి ఉంది",
    badgeReceived: "📩 ఫిర్యాదు అందింది",
    step1Title: "1. ఫిర్యాదు ప్రజా రికార్డులో నమోదు చేయబడింది",
    step1Desc: "ప్రజా రికార్డులో సురక్షితంగా నమోదు చేయబడింది.",
    step2Title: "2. జెమిని ఏఐ వెక్టరైజేషన్ & ఫోటో ధృవీకరణ",
    step2Desc: "జెమిని ఎంబెడ్డింగ్ 001 తో ఫిర్యాదు విశ్లేషించబడింది.",
    photoVerified: "📷 జెమిని విజన్ ఫోటోను విజయవంతంగా ధృవీకరించింది",
    step3Title: "3. పరిసర ప్రాంతాల హాట్‌స్పాట్ క్లస్టరింగ్",
    step3Desc: "2 కి.మీ పరిధిలోని ఇతర పౌరుల ఫిర్యాదులతో సరిపోల్చబడింది.",
    step4Title: "4. మునిసిపల్ బడ్జెట్ కేటాయింపు",
    step4Funded: "✓ అత్యున్నత ప్రాధాన్యతతో మునిసిపల్ బడ్జెట్ ఆమోదించబడింది! మరమ్మతు పనులు ప్రారంభించబడతాయి.",
    step4Queued: "⏳ సమస్య ధృవీకరించబడింది. తదుపరి బడ్జెట్ కేటాయింపు రౌండ్ కోసం వేచి ఉంది.",
    hotspotId: "హాట్‌స్పాట్ గుర్తింపు",
    corroboration: "సమాజ మద్దతు",
    citizenCountSuffix: "పౌరుల నివేదిక(లు)",
    priorityScore: "ప్రాధాన్యత స్కోరు",
    searchLabel: "20-అక్షరాల ట్రాకింగ్ ఐడీని నమోదు చేయండి",
    searchBtn: "స్థితిని చూడండి →",
    searching: "శోధిస్తోంది...",
    subtitle: "మీ ఫిర్యాదు నమోదు నుండి ఏఐ క్లస్టరింగ్ మరియు మునిసిపల్ నిధుల మంజూరు వరకు ప్రత్యక్ష స్థితిని గమనించండి.",
  },
  hi: {
    received: "प्राप्त हुआ",
    verified: "सत्यापित",
    funded: "स्वीकृत एवं वित्तपोषित",
    queued: "प्रतीक्षारत (कतार में)",
    badgeFunded: "✓ कार्य स्वीकृत एवं वित्तपोषित",
    badgeQueued: "⏳ बजट हेतु कतार में",
    badgeReceived: "📩 शिकायत दर्ज",
    step1Title: "1. शिकायत सार्वजनिक बहीखाते में दर्ज",
    step1Desc: "सार्वजनिक लेजर में सफलतापूर्वक दर्ज किया गया।",
    step2Title: "2. जेमिनी एआई वेक्टर एवं फोटो सत्यापन",
    step2Desc: "जेमिनी एम्बेडिंग 001 के साथ शिकायत का विश्लेषण किया गया।",
    photoVerified: "📷 जेमिनी विज़न ने फोटो का सत्यापन किया",
    step3Title: "3. मोहल्ला हॉटस्पॉट क्लस्टरिंग",
    step3Desc: "2 किमी के दायरे में अन्य नागरिकों की शिकायतों के साथ सत्यापित।",
    step4Title: "4. नगरपालिका बजट आवंटन",
    step4Funded: "✓ उच्च प्राथमिकता के आधार पर नगरपालिका बजट स्वीकृत! नागरिक कार्य स्वीकृत हो गया है।",
    step4Queued: "⏳ हॉटस्पॉट सत्यापित है। अगले बजट आवंटन दौर के लिए प्रतीक्षारत है।",
    hotspotId: "हॉटस्पॉट पहचान",
    corroboration: "सामुदायिक समर्थन",
    citizenCountSuffix: "नागरिक रिपोर्ट",
    priorityScore: "प्राथमिकता स्कोर",
    searchLabel: "20-अंकों का ट्रैकिंग आईडी दर्ज करें",
    searchBtn: "स्थिति जांचें →",
    searching: "खोज जारी है...",
    subtitle: "जेमिनी एआई वेक्टर विश्लेषण से लेकर मोहल्ला क्लस्टरिंग और बजट आवंटन तक अपनी शिकायत की स्थिति देखें।",
  },
};

function StatusContent() {
  const searchParams = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const t = STATUS_TRANSLATIONS[language] || STATUS_TRANSLATIONS.en;

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
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <span className="brand-pill" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
          PUBLIC TRANSPARENCY LEDGER
        </span>
        <h1 style={{ fontSize: "2.4rem", fontWeight: 700, margin: "0.25rem 0" }}>
          Track Infrastructure Complaint
        </h1>
        <p style={{ color: "#666", fontSize: "0.95rem" }}>
          {t.subtitle}
        </p>

        {/* Multilingual Language Toggle (English / Telugu / Hindi) */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "1.2rem", background: "#f1edec", padding: "4px 6px", borderRadius: "9999px", border: "1px solid #e7e7e4" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#666", paddingLeft: "8px" }}>🌐 Language:</span>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            style={{
              padding: "0.3rem 0.8rem",
              borderRadius: "9999px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              background: language === "en" ? "#000000" : "transparent",
              color: language === "en" ? "#ffffff" : "#444748",
              transition: "all 0.15s ease",
            }}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage("te")}
            style={{
              padding: "0.3rem 0.8rem",
              borderRadius: "9999px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              background: language === "te" ? "#000000" : "transparent",
              color: language === "te" ? "#ffffff" : "#444748",
              transition: "all 0.15s ease",
            }}
          >
            తెలుగు (Telugu)
          </button>
          <button
            type="button"
            onClick={() => setLanguage("hi")}
            style={{
              padding: "0.3rem 0.8rem",
              borderRadius: "9999px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              background: language === "hi" ? "#000000" : "transparent",
              color: language === "hi" ? "#ffffff" : "#444748",
              transition: "all 0.15s ease",
            }}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="scaffold-card" style={{ padding: "1.8rem 2rem", marginBottom: "2rem" }}>
        <form onSubmit={handleLookup}>
          <label className="form-label-stitch" htmlFor="report-search-input">
            {t.searchLabel}
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
              {loading ? t.searching : t.searchBtn}
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
                {isFunded ? t.badgeFunded : isQueued ? t.badgeQueued : t.badgeReceived}
              </span>
            </div>
          </div>

          {/* Minimalist Progress Timeline */}
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.2rem" }}>Lifecycle Progression</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", borderLeft: "2px solid #e5e7eb", paddingLeft: "1.5rem", marginLeft: "0.5rem" }}>
            {/* Step 1 */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-2.15rem", top: "2px", width: "18px", height: "18px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>✓</div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{t.step1Title}</div>
              <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "2px" }}>
                {t.step1Desc} ({new Date(report.created_at).toLocaleString()})
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-2.15rem", top: "2px", width: "18px", height: "18px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>✓</div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{t.step2Title}</div>
              <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "2px" }}>
                {t.step2Desc}
                {report.photo_verification?.checked && (
                  <span style={{ display: "block", color: "#059669", fontWeight: 500, marginTop: "2px" }}>
                    {t.photoVerified} ({Math.round(report.photo_verification.confidence * 100)}% confidence).
                  </span>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-2.15rem", top: "2px", width: "18px", height: "18px", borderRadius: "50%", background: report.hotspot ? "#059669" : "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                {report.hotspot ? "✓" : "●"}
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{t.step3Title}</div>
              <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "2px" }}>
                {report.hotspot ? (
                  <span>
                    {t.step3Desc} (<strong style={{ color: "#111" }}>{report.hotspot.corroboration_count} {t.citizenCountSuffix}</strong>. {t.priorityScore}: <strong>{report.hotspot.priority_score}</strong>)
                  </span>
                ) : (
                  t.step3Desc
                )}
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-2.15rem", top: "2px", width: "18px", height: "18px", borderRadius: "50%", background: isFunded ? "#059669" : isQueued ? "#d97706" : "#9ca3af", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                {isFunded ? "✓" : "●"}
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{t.step4Title}</div>
              <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "2px" }}>
                {isFunded ? (
                  <span style={{ color: "#059669", fontWeight: 500 }}>
                    {t.step4Funded}
                  </span>
                ) : isQueued ? (
                  <span style={{ color: "#d97706", fontWeight: 500 }}>
                    {t.step4Queued}
                  </span>
                ) : (
                  t.step4Queued
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
                <div style={{ color: "#666", fontSize: "0.78rem", textTransform: "uppercase" }}>{t.hotspotId}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "#111" }}>
                  {report.hotspot_id}
                </div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: "0.78rem", textTransform: "uppercase" }}>{t.corroboration}</div>
                <div style={{ color: "#111", fontWeight: 700, fontSize: "1.1rem" }}>
                  {report.hotspot.corroboration_count} {t.citizenCountSuffix}
                </div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: "0.78rem", textTransform: "uppercase" }}>{t.priorityScore}</div>
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
