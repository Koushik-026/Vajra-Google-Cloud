"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { useState, useEffect } from "react";

export default function LanguageExtension() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-peek slightly on first load so user discovers it, then tuck away
    const timer = setTimeout(() => {
      // Keep collapsed by default so it never gets in the way of content
      setIsOpen(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const languages = [
    { code: "en", label: "English", native: "English", flag: "🌐", codeShort: "EN" },
    { code: "te", label: "Telugu", native: "తెలుగు", flag: "🏛️", codeShort: "తె" },
    { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳", codeShort: "हि" },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  if (!mounted) return null;

  return (
    <aside
      aria-label="Language Extension"
      className="vajra-language-extension-container"
      style={{
        position: "fixed",
        right: 0,
        top: "130px",
        zIndex: 99999,
        display: "flex",
        alignItems: "flex-start",
        pointerEvents: "none", // Container transparent to clicks
      }}
    >
      {/* Sliding Wrapper */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          transform: isOpen ? "translateX(0)" : "translateX(calc(100% - 46px))",
          transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: isOpen
            ? "-10px 16px 40px rgba(0, 0, 0, 0.16), -2px 0 10px rgba(0, 0, 0, 0.05)"
            : "-3px 6px 18px rgba(0, 0, 0, 0.08)",
          borderRadius: "14px 0 0 14px",
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        {/* Toggle Tab (Always Visible on Screen Right Margin) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Slide close language panel" : "Slide open language selector"}
          title={isOpen ? "Collapse panel" : "Switch language (English / Telugu / Hindi)"}
          style={{
            width: "46px",
            minHeight: "130px",
            background: "#0f172a",
            color: "#ffffff",
            border: "none",
            borderRight: "1px solid rgba(255,255,255,0.1)",
            padding: "12px 6px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            userSelect: "none",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0f172a")}
        >
          {/* Top Icon */}
          <span style={{ fontSize: "16px", lineHeight: 1 }}>🌐</span>

          {/* Vertical Label */}
          <div
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
              letterSpacing: "1.5px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
            }}
          >
            {isOpen ? "CLOSE" : "LANG"}
          </div>

          {/* Current Lang Badge */}
          <div
            style={{
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: 800,
              padding: "2px 4px",
              borderRadius: "4px",
              lineHeight: 1.1,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {currentLang.codeShort}
          </div>
        </button>

        {/* Extension Content Panel (Sliding Drawer) */}
        <div
          style={{
            width: "250px",
            background: "#ffffff",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            borderTop: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
            borderLeft: "1px solid #e2e8f0",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "8px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.01em",
                }}
              >
                Select Language
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                భాష / भाषा / Language
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close language panel"
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "6px",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                color: "#475569",
                cursor: "pointer",
              }}
              title="Slide close"
            >
              ›
            </button>
          </div>

          {/* Language Options List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {languages.map((l) => {
              const isActive = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    // Leave open or close on choice
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: isActive ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                    background: isActive ? "#eff6ff" : "#f8fafc",
                    color: isActive ? "#1d4ed8" : "#334155",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#f1f5f9";
                      e.currentTarget.style.borderColor = "#cbd5e1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px" }}>{l.flag}</span>
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: isActive ? 700 : 600,
                          lineHeight: 1.2,
                        }}
                      >
                        {l.native}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "#64748b" }}>
                        {l.label}
                      </div>
                    </div>
                  </div>

                  {isActive ? (
                    <span
                      style={{
                        background: "#2563eb",
                        color: "#ffffff",
                        borderRadius: "50%",
                        width: "18px",
                        height: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      ✓
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      {l.codeShort}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Extension Footer Badge */}
          <div
            style={{
              paddingTop: "6px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "10px",
              color: "#94a3b8",
            }}
          >
            <span>DPI Localization</span>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                background: "#f1f5f9",
                padding: "2px 6px",
                borderRadius: "4px",
                color: "#475569",
              }}
            >
              Zero Overlay
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
