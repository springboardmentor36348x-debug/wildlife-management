import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

// Distinct colored dot icons per layer type — no external image files needed.
const dotIcon = (color) =>
  L.divIcon({
    className: "gis-dot-icon",
    html: `<span style="
      display:block;width:14px;height:14px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 0 0 1px ${color}, 0 1px 4px rgba(0,0,0,0.35);
    "></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  });

const SITE_ICON = dotIcon("#0f8a5f");     // green — monitoring sites
const CAMERA_ICON = dotIcon("#3a7bd5");   // blue  — camera traps

function spread(lat, lng, occurrence) {
  if (occurrence === 0) return [lat, lng];
  const angle = (occurrence * 137.5 * Math.PI) / 180;
  const radius = 0.0006 * occurrence;
  return [lat + radius * Math.cos(angle), lng + radius * Math.sin(angle)];
}

/**
 * sites: [{ id, site_name, habitat_type, latitude, longitude }]
 * cameraTraps: [{ id, device_code, status, battery_level, monitoring_site_id }]
 * Camera trap coordinates are resolved via their linked monitoring site.
 * onSiteSelect(site): optional callback fired when a site marker is clicked.
 */
function GISOverviewMap({ sites = [], cameraTraps = [], onSiteSelect, height = 420 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [showSites, setShowSites] = useState(true);
  const [showCameras, setShowCameras] = useState(true);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [20, 0], zoom: 2, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
    const seen = {};
    const bounds = [];

    const place = (lat, lng, icon, popupHtml, onClick) => {
      const key = `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
      const occurrence = seen[key] || 0;
      seen[key] = occurrence + 1;
      const [plat, plng] = spread(Number(lat), Number(lng), occurrence);
      const marker = L.marker([plat, plng], { icon }).bindPopup(popupHtml).addTo(layer);
      if (onClick) marker.on("click", onClick);
      bounds.push([plat, plng]);
    };

    if (showSites) {
      sites
        .filter((s) => s.latitude != null && s.longitude != null && s.latitude !== "")
        .forEach((s) =>
          place(
            s.latitude,
            s.longitude,
            SITE_ICON,
            `<strong>${s.site_name || "Unnamed site"}</strong><br/>Monitoring site · ${s.habitat_type || "—"}`,
            onSiteSelect ? () => onSiteSelect(s) : null
          )
        );
    }

    if (showCameras) {
      cameraTraps.forEach((trap) => {
        const site = siteById[trap.monitoring_site_id];
        if (!site || site.latitude == null || site.longitude == null) return;
        place(
          site.latitude,
          site.longitude,
          CAMERA_ICON,
          `<strong>${trap.device_code}</strong><br/>Camera trap · ${trap.status} · ${trap.battery_level}% battery<br/>at ${site.site_name}`
        );
      });
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 10 });
    }
  }, [sites, cameraTraps, showSites, showCameras, onSiteSelect]);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 13 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={showSites} onChange={(e) => setShowSites(e.target.checked)} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#0f8a5f", display: "inline-block" }} />
          Monitoring Sites ({sites.length})
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={showCameras} onChange={(e) => setShowCameras(e.target.checked)} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a7bd5", display: "inline-block" }} />
          Camera Traps ({cameraTraps.length})
        </label>
      </div>
      <div ref={containerRef} style={{ height, width: "100%", borderRadius: 14, overflow: "hidden" }} />
    </div>
  );
}

export default GISOverviewMap;