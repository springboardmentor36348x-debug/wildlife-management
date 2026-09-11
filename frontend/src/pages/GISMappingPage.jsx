import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api/client";

// Same inline-SVG marker approach as HabitatPage.jsx — sidesteps the
// Leaflet+Vite default-icon-path bug without needing any image assets.
function markerIcon(color) {
  return L.divIcon({
    className: "",
    html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.4 13 21 13 21s13-11.6 13-21C26 5.8 20.2 0 13 0z" fill="${color}" stroke="#1f2d1a" stroke-width="1"/>
      <circle cx="13" cy="13" r="5" fill="white"/>
    </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

const DEVICE_COLORS = {
  camera_trap: "#3f6b34",
  drone: "#2f6f7f",
  audio_sensor: "#8a5fb0",
  satellite: "#b0742f",
  manual_survey: "#5c5c5c",
};
const DEVICE_LABELS = {
  camera_trap: "Camera Trap",
  drone: "Drone",
  audio_sensor: "Audio Sensor",
  satellite: "Satellite",
  manual_survey: "Manual Survey",
};
const SELECTED_ICON = markerIcon("#c0392b");

function FitBounds({ sites }) {
  const map = useMap();
  useEffect(() => {
    if (sites.length === 0) return;
    if (sites.length === 1) {
      map.setView([sites[0].latitude, sites[0].longitude], 9);
      return;
    }
    const bounds = L.latLngBounds(sites.map((s) => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [sites, map]);
  return null;
}

export default function GISMappingPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [layerFilter, setLayerFilter] = useState("all");
  const [selectedSiteId, setSelectedSiteId] = useState("");

  useEffect(() => {
    api
      .listAllSites()
      .then((s) => {
        setSites(s);
        if (s.length) setSelectedSiteId(s[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const validSites = useMemo(
    () => sites.filter((s) => typeof s.latitude === "number" && typeof s.longitude === "number"),
    [sites]
  );
  const filteredSites = useMemo(
    () => (layerFilter === "all" ? validSites : validSites.filter((s) => s.monitoring_device === layerFilter)),
    [validSites, layerFilter]
  );
  const deviceTypesPresent = useMemo(
    () => [...new Set(validSites.map((s) => s.monitoring_device))],
    [validSites]
  );

  const center = filteredSites.length ? [filteredSites[0].latitude, filteredSites[0].longitude] : [20.5937, 78.9629];
  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-bark-900">
          Interactive GIS Spatial Intelligence &amp; Telemetry Map
        </h1>
        <p className="text-canopy-700 text-sm mt-1">
          Real-time geospatial visualization of every registered monitoring site (camera traps, drones, audio
          sensors, satellite links, manual surveys), plotted from real GPS coordinates (Milestone 4, FR-8/FR-11).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-2 overflow-hidden" style={{ height: 480 }}>
          {!loading && filteredSites.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-canopy-600 px-6 text-center">
              No monitoring sites with GPS coordinates for this layer yet — register one from Surveys &amp;
              Sites, or switch layers.
            </div>
          ) : (
            <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%", borderRadius: "0.65rem" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds sites={filteredSites} />
              {filteredSites.map((s) => (
                <Marker
                  key={s.id}
                  position={[s.latitude, s.longitude]}
                  icon={s.id === selectedSiteId ? SELECTED_ICON : markerIcon(DEVICE_COLORS[s.monitoring_device] || "#3f6b34")}
                  eventHandlers={{ click: () => setSelectedSiteId(s.id) }}
                >
                  <Popup>
                    <strong>{s.site_name}</strong>
                    <br />
                    {DEVICE_LABELS[s.monitoring_device] || s.monitoring_device} · {s.habitat_type}
                    <br />
                    {s.latitude.toFixed(4)}°, {s.longitude.toFixed(4)}°
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-bark-900">GIS Inspector</h2>
          <p className="text-xs text-canopy-600 mt-0.5 mb-3">Layer Filter</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setLayerFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                layerFilter === "all"
                  ? "bg-canopy-800 text-white border-canopy-800"
                  : "bg-white text-canopy-700 border-canopy-200 hover:bg-canopy-50"
              }`}
            >
              All
            </button>
            {deviceTypesPresent.map((d) => (
              <button
                key={d}
                onClick={() => setLayerFilter(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  layerFilter === d
                    ? "bg-canopy-800 text-white border-canopy-800"
                    : "bg-white text-canopy-700 border-canopy-200 hover:bg-canopy-50"
                }`}
              >
                {DEVICE_LABELS[d] || d}
              </button>
            ))}
          </div>

          {selectedSite ? (
            <div className="text-sm space-y-2 border-t border-canopy-100 pt-3">
              <p className="font-semibold text-bark-900">{selectedSite.site_name}</p>
              <p className="text-canopy-700">Node type: {DEVICE_LABELS[selectedSite.monitoring_device] || selectedSite.monitoring_device}</p>
              <p className="text-canopy-700">Habitat: {selectedSite.habitat_type}</p>
              <p className="text-canopy-700">
                Coordinates: {selectedSite.latitude.toFixed(4)}°, {selectedSite.longitude.toFixed(4)}°
              </p>
              <p className="text-canopy-700">Protected area: {selectedSite.protected_area || "Unassigned"}</p>
              <p className="text-xs text-canopy-500 pt-1">
                Registered {new Date(selectedSite.created_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-canopy-600">Select a marker to inspect its details.</p>
          )}

          <div className="mt-4 border-t border-canopy-100 pt-3 max-h-48 overflow-y-auto divide-y divide-canopy-100">
            {filteredSites.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSiteId(s.id)}
                className={`w-full text-left py-2 px-1 text-sm rounded-lg transition-colors ${
                  s.id === selectedSiteId ? "bg-canopy-50 text-canopy-900 font-medium" : "hover:bg-canopy-50"
                }`}
              >
                {s.site_name}
                <span className="block text-xs text-canopy-600">{DEVICE_LABELS[s.monitoring_device] || s.monitoring_device}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
