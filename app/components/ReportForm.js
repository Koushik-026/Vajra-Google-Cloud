"use client";

import { useState, useRef } from "react";

const CATEGORIES = [
  { value: "roads", label: "Roads & Potholes" },
  { value: "water_supply", label: "Water Supply" },
  { value: "sanitation", label: "Sanitation & Sewage" },
  { value: "streetlights", label: "Streetlights" },
  { value: "drainage", label: "Drainage & Flooding" },
  { value: "health_facility", label: "Health Facility" },
  { value: "public_transport", label: "Public Transport" },
  { value: "solid_waste", label: "Solid Waste / Garbage" },
  { value: "other", label: "Other" },
];

export default function ReportForm({ onReportSubmitted }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoMimeType, setPhotoMimeType] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  // Use browser geolocation as a quick fallback
  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationLabel(
          `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
        );
        setError(null);
      },
      (err) => setError("Location access denied: " + err.message)
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
      // Strip the data URL prefix to get raw base64
      const base64 = reader.result.split(",")[1];
      setPhoto(base64);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!text.trim()) {
      setError("Please describe the problem");
      return;
    }
    if (!category) {
      setError("Please select a category");
      return;
    }
    if (lat == null || lng == null) {
      setError("Please set a location (click 'Use my location' or enter coordinates)");
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
        // Reset form
        setText("");
        setCategory("");
        setLat(null);
        setLng(null);
        setLocationLabel("");
        setPhoto(null);
        setPhotoMimeType(null);
        setPhotoPreview(null);
        if (fileRef.current) fileRef.current.value = "";
        if (onReportSubmitted) onReportSubmitted();
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="report-form-container">
      <h2>Report an Infrastructure Problem</h2>

      {result && (
        <div className="success-banner">
          ✅ Report submitted! Your Report ID: <strong>{result.id}</strong>
          <br />
          <small>Save this ID to check your report status later.</small>
        </div>
      )}

      {error && <div className="error-banner">⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Category */}
        <label htmlFor="category">Category *</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">— Select category —</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Description */}
        <label htmlFor="description">Describe the problem *</label>
        <textarea
          id="description"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="E.g., Large pothole near the bus stop on MG Road causing accidents..."
          required
        />

        {/* Location */}
        <label>Location *</label>
        <div className="location-row">
          <button type="button" onClick={useMyLocation} className="btn-secondary">
            📍 Use my location
          </button>
          {locationLabel && <span className="location-display">{locationLabel}</span>}
        </div>
        <div className="manual-coords">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={lat ?? ""}
            onChange={(e) => {
              setLat(parseFloat(e.target.value));
              setLocationLabel(`${e.target.value}, ${lng ?? ""}`);
            }}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={lng ?? ""}
            onChange={(e) => {
              setLng(parseFloat(e.target.value));
              setLocationLabel(`${lat ?? ""}, ${e.target.value}`);
            }}
          />
        </div>

        {/* Photo */}
        <label htmlFor="photo">Photo (optional — helps verify your report)</label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handlePhoto}
          ref={fileRef}
        />
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Preview"
            style={{ maxWidth: "200px", marginTop: "8px", borderRadius: "4px" }}
          />
        )}

        {/* Submit */}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
