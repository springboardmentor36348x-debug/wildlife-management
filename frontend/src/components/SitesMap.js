import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function SitesMap({ sites = [], onSelect, height = 340 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validSites = sites.filter(
      (s) => s.latitude != null && s.longitude != null && s.latitude !== "" && s.longitude !== ""
    );

    // If two or more sites share the exact same coordinates, their pins
    // would sit exactly on top of one another and only the topmost would
    // be visible/clickable. Nudge every repeat occurrence a little so all
    // of them stay visible on the map.
    const seenCoordCounts = {};
    validSites.forEach((site) => {
      const key = `${Number(site.latitude).toFixed(5)},${Number(site.longitude).toFixed(5)}`;
      const occurrence = seenCoordCounts[key] || 0;
      seenCoordCounts[key] = occurrence + 1;

      let lat = Number(site.latitude);
      let lng = Number(site.longitude);
      if (occurrence > 0) {
        // Spread duplicates in a small circle (~50-100m) around the
        // original point instead of stacking them exactly.
        const angle = (occurrence * 137.5 * Math.PI) / 180; // golden-angle spiral
        const radius = 0.0006 * occurrence;
        lat += radius * Math.cos(angle);
        lng += radius * Math.sin(angle);
      }

      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(
        `<strong>${site.site_name || "Unnamed site"}</strong><br/>${site.habitat_type || ""}`
      );
      if (onSelect) {
        marker.on("click", () => onSelect(site));
      }
      markersRef.current.push(marker);
    });

    if (validSites.length > 0) {
      const bounds = L.latLngBounds(
        validSites.map((s) => [Number(s.latitude), Number(s.longitude)])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [sites, onSelect]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: 14, overflow: "hidden" }}
    />
  );
}

export default SitesMap;