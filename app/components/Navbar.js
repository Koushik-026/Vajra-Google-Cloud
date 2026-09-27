"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function Navbar() {
  const { t } = useLanguage();

  return (
    <header className="stitch-navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <a href="/" className="brand-logo">
            <span className="brand-name">{t.brandName || "Vajra"}</span>
          </a>
          <nav className="nav-menu">
            <a href="/" className="nav-item">
              {t.citizenPortal}
            </a>
            <a href="/hotspots" className="nav-item">
              {t.hotspotsMap}
            </a>
            <a href="/status" className="nav-item">
              {t.statusTracker}
            </a>
            <a href="/planner" className="nav-item">
              {t.municipalPlanner}
            </a>
          </nav>
        </div>
        <div className="navbar-right">
          <a href="/status" className="btn-stitch-secondary">
            {t.trackReport}
          </a>
          <a href="/#report-form" className="btn-stitch-primary">
            {t.submitReport}
          </a>
        </div>
      </div>
    </header>
  );
}
