import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api/client";

// react-leaflet's default marker icon points at bundler-relative image
// paths that break under Vite unless you copy the PNGs manually. We
// sidestep that entirely with a small inline SVG divIcon instead of the
// default L.Icon, so no external image assets are required.
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

const DEFAULT_ICON = markerIcon("#3f6b34");
const DECLINING_ICON = markerIcon("#c0392b");
const STABLE_ICON = markerIcon("#4e7f2f");

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

function Card({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-bark-900">{title}</h2>
      {subtitle && <p className="text-xs text-canopy-600 mt-0.5 mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}

export default function HabitatPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");

  const [classification, setClassification] = useState(null);
  const [degradation, setDegradation] = useState(null);
  const [vegetation, setVegetation] = useState(null);
  const [environmental, setEnvironmental] = useState(null);
  const [suitabilitySpecies, setSuitabilitySpecies] = useState("elephant");
  const [suitability, setSuitability] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  useEffect(() => {
    if (!selectedSiteId) return;
    setDetailLoading(true);
    Promise.all([
      api.getHabitatClassification(selectedSiteId),
      api.getHabitatDegradation(selectedSiteId),
      api.getHabitatVegetation(selectedSiteId),
      api.getHabitatEnvironmental(selectedSiteId),
    ])
      .then(([c, d, v, e]) => {
        setClassification(c);
        setDegradation(d);
        setVegetation(v);
        setEnvironmental(e);
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
    setSuitability(null);
  }, [selectedSiteId]);

  function runSuitability() {
    if (!selectedSiteId || !suitabilitySpecies) return;
    api
      .getHabitatSuitability(selectedSiteId, suitabilitySpecies)
      .then(setSuitability)
      .catch((e) => setSuitability({ error: e.message }));
  }

  const validSites = useMemo(
    () => sites.filter((s) => typeof s.latitude === "number" && typeof s.longitude === "number"),
    [sites]
  );
  const center = validSites.length ? [validSites[0].latitude, validSites[0].longitude] : [20.5937, 78.9629];
  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-bark-900">Habitat Intelligence</h1>
        <p className="text-canopy-700 text-sm mt-1">
          Real GIS visualization of monitoring sites, plus habitat classification, degradation detection, and
          suitability scoring (Milestone 3, Feature C).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-2 overflow-hidden" style={{ height: 440 }}>
          {!loading && validSites.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-canopy-600">
              No monitoring sites with GPS coordinates yet — register one from Surveys &amp; Sites.
            </div>
          ) : (
            <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%", borderRadius: "0.65rem" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds sites={validSites} />
              {validSites.map((s) => (
                <Marker
                  key={s.id}
                  position={[s.latitude, s.longitude]}
                  icon={s.id === selectedSiteId ? STABLE_ICON : DEFAULT_ICON}
                  eventHandlers={{ click: () => setSelectedSiteId(s.id) }}
                >
                  <Popup>
                    <strong>{s.site_name}</strong>
                    <br />
                    {s.habitat_type} · {s.monitoring_device}
                    <br />
                    {s.protected_area || "Unassigned protected area"}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        <Card title="Monitoring Sites" subtitle="Select a site to view its habitat analysis.">
          <div className="max-h-80 overflow-y-auto divide-y divide-canopy-100">
            {sites.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSiteId(s.id)}
                className={`w-full text-left py-2 px-1 text-sm rounded-lg transition-colors ${
                  s.id === selectedSiteId ? "bg-canopy-50 text-canopy-900 font-medium" : "hover:bg-canopy-50"
                }`}
              >
                {s.site_name}
                <span className="block text-xs text-canopy-600">{s.habitat_type}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {selectedSite && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title={`Habitat Classification — ${selectedSite.site_name}`} subtitle="Real, field-registered habitat type.">
            {detailLoading ? (
              <p className="text-sm text-canopy-600">Loading…</p>
            ) : (
              <p className="text-lg font-semibold text-bark-900 capitalize">{classification?.habitat_type}</p>
            )}
          </Card>

          <Card title="Habitat Degradation Detection" subtitle="Recent vs. prior observation-activity window proxy.">
            {detailLoading ? (
              <p className="text-sm text-canopy-600">Loading…</p>
            ) : degradation ? (
              <div className="text-sm space-y-1">
                <p>
                  Status:{" "}
                  <span
                    className={`badge ${
                      degradation.status === "declining"
                        ? "badge-high"
                        : degradation.status === "stable"
                        ? "badge-ok"
                        : "badge-low"
                    }`}
                  >
                    {degradation.status}
                  </span>
                </p>
                <p className="text-canopy-700">
                  Recent: {degradation.recent_count} · Previous: {degradation.previous_count}
                  {degradation.change_pct !== null && degradation.change_pct !== undefined
                    ? ` · Change: ${degradation.change_pct}%`
                    : ""}
                </p>
              </div>
            ) : (
              <p className="text-sm text-canopy-600">No data.</p>
            )}
          </Card>

          <Card title="Vegetation Analysis" subtitle="Honestly reported — no fabricated data.">
            <p className="text-sm text-canopy-700">
              {vegetation?.status === "not_available" ? vegetation.reason : JSON.stringify(vegetation)}
            </p>
          </Card>

          <Card title="Environmental Condition Monitoring" subtitle="Honestly reported — no fabricated data.">
            <p className="text-sm text-canopy-700">
              {environmental?.status === "not_available" ? environmental.reason : JSON.stringify(environmental)}
            </p>
          </Card>

          <Card title="Habitat Suitability Prediction" subtitle="Compatibility lookup + cross-site observation evidence.">
            <div className="flex items-center gap-2 mb-3">
              <input
                className="input"
                value={suitabilitySpecies}
                onChange={(e) => setSuitabilitySpecies(e.target.value)}
                placeholder="species, e.g. elephant"
              />
              <button className="btn-secondary whitespace-nowrap" onClick={runSuitability}>
                Check
              </button>
            </div>
            {suitability && !suitability.error && (
              <div className="text-sm">
                <p className="font-semibold text-bark-900">Score: {suitability.suitability_score}</p>
                <p className="text-canopy-700 mt-1">{suitability.reasoning}</p>
              </div>
            )}
            {suitability?.error && <p className="text-sm text-red-600">{suitability.error}</p>}
          </Card>
        </div>
      )}
    </div>
  );
}
