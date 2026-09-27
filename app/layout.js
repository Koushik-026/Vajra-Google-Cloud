import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import Navbar from "./components/Navbar";
import LanguageExtension from "./components/LanguageExtension";

export const metadata = {
  title: "Vajra — Precision AI Digital Public Infrastructure",
  description:
    "Next-generation digital public infrastructure: AI-powered deduplication, spatial clustering, and budget-aware prioritization of citizen feedback for municipal governance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
          defer
        ></script>
      </head>
      <body>
        <LanguageProvider>
          {/* Top Minimalist Navigation (from Stitch Visual Scaffolding) */}
          <Navbar />

          {/* Floating Slide-out Language Extension (Zero Layout Displacement) */}
          <LanguageExtension />

          <main>{children}</main>

          {/* Minimalist Engineered Footer */}
          <footer className="stitch-footer">
            <div className="footer-inner">
              <div className="footer-top">
                <div className="footer-brand-col">
                  <div className="brand-name" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                    Vajra
                  </div>
                  <p className="footer-lead">
                    AI-Powered Digital Public Infrastructure for Municipal Governance & Capital Budgeting.
                  </p>
                  <div className="footer-badge">Digital Public Infrastructure Console</div>
                </div>
                <div className="footer-links-grid">
                  <div className="footer-col">
                    <div className="footer-heading">Architecture</div>
                    <a href="/#ai-engine" className="footer-link">Gemini Embeddings</a>
                    <a href="/hotspots" className="footer-link">Spatial Deduplication</a>
                    <a href="/planner" className="footer-link">Greedy Knapsack</a>
                  </div>
                  <div className="footer-col">
                    <div className="footer-heading">Public Portals</div>
                    <a href="/" className="footer-link">Citizen Reporting</a>
                    <a href="/hotspots" className="footer-link">Hotspots Map</a>
                    <a href="/status" className="footer-link">Public Ledger</a>
                    <a href="/planner" className="footer-link">Planner Dashboard</a>
                  </div>
                  <div className="footer-col">
                    <div className="footer-heading">Channels</div>
                    <a href="/api/whatsapp" className="footer-link">WhatsApp Webhook</a>
                    <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="footer-link">Google AI Studio</a>
                    <a href="https://firebase.google.com/" target="_blank" rel="noreferrer" className="footer-link">Firebase Cloud</a>
                  </div>
                </div>
              </div>
              <div className="footer-bottom">
                <span>© 2026 Vajra. Built for Google Cloud "Build with AI: Code for Communities".</span>
                <span>Zero GCP Billing Architecture • Free Tier Verified</span>
              </div>
            </div>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
