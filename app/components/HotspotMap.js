"use client";

import { useEffect, useRef, useState } from "react";

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

export default function HotspotMap({ hotspots = [], selectedId = null, onSelect = () => {}, height = "440px" }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet map safely on client
  useEffect(() => {
    let intervalId = null;

    const initMap = () => {
      if (!window.L || !mapContainerRef.current) return false;
      if (mapInstanceRef.current) return true;

      try {
        const L = window.L;
        const map = L.map(mapContainerRef.current, {
          center: [12.9716, 77.5946],
          zoom: 12,
          scrollWheelZoom: true,
        });

        // 100% Free Esri World Street Map Tiles (Zero API key required, verified public access)
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          {
            attribution:
              '&copy; <a href="https://www.esri.com/">Esri</a>, OpenStreetMap contributors',
            maxZoom: 19,
          }
        ).addTo(map);

        mapInstanceRef.current = map;
        setMapReady(true);

        // Invalidate size after layout settles
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 300);

        return true;
      } catch (err) {
        console.error("Leaflet init error:", err);
        return false;
      }
    };

    if (!initMap()) {
      intervalId = setInterval(() => {
        if (initMap()) {
          clearInterval(intervalId);
        }
      }, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Invalidate map size to ensure all tiles render
    map.invalidateSize();

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!hotspots || hotspots.length === 0) return;

    const bounds = [];

    hotspots.forEach((hs) => {
      if (hs.lat == null || hs.lng == null) return;

      const isFunded = hs.funding_status === "funded";
      const isSelected = selectedId === hs.id;
      const color = isFunded ? "#059669" : "#d97706";
      const icon = CATEGORY_ICONS[hs.category] || "📍";

      const marker = L.circleMarker([hs.lat, hs.lng], {
        radius: isSelected ? 14 : 10,
        fillColor: color,
        color: isSelected ? "#000000" : "#ffffff",
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.4; padding: 4px; color: #111;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <strong style="font-size: 13px; text-transform: capitalize; color: #000;">${icon} ${hs.category?.replace(/_/g, " ")}</strong>
            <span style="background: ${isFunded ? "#ecfdf5" : "#fffbeb"}; 
                         color: ${color}; 
                         border: 1px solid ${isFunded ? "#a7f3d0" : "#fde68a"};
                         font-weight: 700; 
                         font-size: 9px; 
                         padding: 2px 6px; 
                         border-radius: 9999px; 
                         text-transform: uppercase;">
              ${hs.funding_status || "queued"}
            </span>
          </div>
          <div style="color: #4b5563; font-size: 12px; margin-bottom: 4px;">
            👥 <strong>${hs.corroboration_count || 1}</strong> Citizen Report${(hs.corroboration_count || 1) > 1 ? "s" : ""}
          </div>
          <div style="color: #6b7280; font-size: 11px;">
            Priority Score: <strong style="color: #2563eb;">${hs.priority_score || 0}</strong> | 
            Est. Cost: <strong style="color: #111;">₹${hs.sample_budget_used || 10}L</strong>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => {
        onSelect(hs.id);
      });

      markersRef.current.push(marker);
      bounds.push([hs.lat, hs.lng]);
    });

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      } else {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [mapReady, hotspots, selectedId]);

  return (
    <div className="map-wrapper-stitch" style={{ height }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "380px" }} />
      {!mapReady && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9f9f9",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Loading Street Map...
        </div>
      )}
    </div>
  );
}
