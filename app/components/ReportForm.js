"use client";

import { useState, useRef } from "react";

const CATEGORIES = [
  { value: "roads", label: "Roads & Potholes", icon: "🛣️" },
  { value: "water_supply", label: "Water Supply", icon: "🚰" },
  { value: "sanitation", label: "Sanitation", icon: "🧹" },
  { value: "streetlights", label: "Streetlights", icon: "💡" },
  { value: "drainage", label: "Drainage", icon: "🌊" },
  { value: "health_facility", label: "Health Facility", icon: "🏥" },
  { value: "public_transport", label: "Public Transit", icon: "🚌" },
  { value: "solid_waste", label: "Solid Waste", icon: "🗑️" },
  { value: "other", label: "Other Issues", icon: "⚠️" },
];

export default function ReportForm({ onReportSubmitted }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoMimeType, setPhotoMimeType] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const cLat = parseFloat(pos.coords.latitude.toFixed(5));
        const cLng = parseFloat(pos.coords.longitude.toFixed(5));
        setLat(cLat);
        setLng(cLng);
        setLocationLabel(`${cLat}, ${cLng}`);
        setLocating(false);
        setError(null);
      },
      (err) => {
        setLocating(false);
        setLat(12.9716);
        setLng(77.5946);
        setLocationLabel("12.97160, 77.59460 (Default Demo)");
        setError("Location access denied. Using demo coordinates.");
      },
      { timeout: 10000 }
    );
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5 MB");
      return;
    }

    setPhotoMimeType(file.type);
    setPhotoPreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setPhoto(base64);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoMimeType(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function copyReportId(id) {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!category) {
      setError("Please select an infrastructure category");
      return;
    }
    if (!text.trim()) {
      setError("Please describe the issue in detail");
      return;
    }
    if (lat == null || lng == null) {
      setError("Please attach your location using 'Detect GPS'");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          category,
          lat,
          lng,
          photo: photo || undefined,
          photoMimeType: photoMimeType || undefined,
          language: "en",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Submission failed");
      } else {
        setResult(data);
        setText("");
        setCategory("");
        setLat(null);
        setLng(null);
        setLocationLabel("");
        removePhoto();
        if (onReportSubmitted) onReportSubmitted();
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="scaffold-card" id="report-form">
      <div className="card-top-row">
        <div>
          <h2 className="card-title-stitch">Citizen Infrastructure Complaint</h2>
          <p className="card-desc-stitch">
            Recorded to municipal public ledger & analyzed with Gemini embeddings.
          </p>
        </div>
        <span className="badge-status badge-received-stitch">Public Ledger</span>
      </div>

      {result && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "14px",
            padding: "1.2rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#065f46", fontWeight: 600 }}>
            <span>✓</span> Report Logged & Dispatched to AI Engine!
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", margin: "0.75rem 0" }}>
            <code
              style={{
                background: "#ffffff",
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid #d1fae5",
                color: "#047857",
                fontWeight: 700,
                fontSize: "1rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              {result.id}
            </code>
            <button
              type="button"
              onClick={() => copyReportId(result.id)}
              className="btn-stitch-secondary"
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
            >
              {copied ? "Copied!" : "Copy ID"}
            </button>
          </div>
          <a
            href={`/status?id=${result.id}`}
            className="btn-stitch-primary"
            style={{ fontSize: "0.82rem", display: "inline-flex" }}
          >
            Track Neighborhood Status →
          </a>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "0.8rem 1rem",
            color: "#991b1b",
            fontSize: "0.85rem",
            marginBottom: "1.2rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Category Selection */}
        <div className="form-group-stitch">
          <label className="form-label-stitch">1. Infrastructure Sector</label>
          <div className="category-chips-stitch">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.value}
                className={`chip-stitch ${category === cat.value ? "active" : ""}`}
                onClick={() => setCategory(cat.value)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Problem Description */}
        <div className="form-group-stitch">
          <label className="form-label-stitch" htmlFor="problem-desc-stitch">
            2. Detailed Description
          </label>
          <textarea
            id="problem-desc-stitch"
            className="form-textarea-stitch"
            placeholder="Describe the defect, location landmarks, severity, and impact..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
          <div style={{ display: "flex", justifyContent: "space-between", color: "#888888", fontSize: "0.75rem", marginTop: "0.3rem" }}>
            <span>Supports natural input in English, Hindi, and local vernacular</span>
            <span>{text.length} chars</span>
          </div>
        </div>

        {/* Location Picker */}
        <div className="form-group-stitch">
          <label className="form-label-stitch">3. Geolocation Verification</label>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="btn-stitch-secondary"
              onClick={useMyLocation}
              disabled={locating}
            >
              <span>{locating ? "⏳" : "📍"}</span>
              <span>{locating ? "Acquiring..." : "Detect GPS"}</span>
            </button>
            <input
              type="text"
              readOnly
              className="form-input-stitch"
              style={{ background: "#f9f9f9", color: "#444748" }}
              placeholder="Click 'Detect GPS' to link coordinates"
              value={locationLabel}
            />
          </div>
        </div>

        {/* Photo Upload with Gemini Vision Verification */}
        <div className="form-group-stitch">
          <label className="form-label-stitch">
            4. Photo Proof (Gemini Vision Verification)
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <label className="btn-stitch-secondary" style={{ cursor: "pointer" }}>
              <span>📷</span>
              <span>{photo ? "Change Photo" : "Upload Evidence"}</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                style={{ display: "none" }}
              />
            </label>
            {photoPreview && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: "42px",
                    height: "42px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    border: "1px solid #d4d4d8",
                  }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn-stitch-primary"
          style={{ width: "100%", justifyContent: "center", padding: "0.85rem 1.5rem", fontSize: "0.95rem" }}
          disabled={submitting}
        >
          {submitting ? "Analyzing & Vectorizing..." : "Submit to Public Ledger →"}
        </button>
      </form>
    </div>
  );
}
