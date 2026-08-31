import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler,
} from "chart.js";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import DonutStat from "../components/DonutStat";
import SpeciesImage from "../components/SpeciesImage";
import {
  ClipboardIcon, PinIcon, ButterflyIcon, UserIcon, UsersIcon, ChartBarIcon,
  TrendUpIcon, CameraIcon, MicIcon, DnaIcon, SearchIcon, BellIcon,
} from "../components/Icons";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// Each quick action can carry its own icon + color tone so the tiles on
// the right of the dashboard look distinct instead of plain buttons.
const QUICK_ACTIONS = {
  wildlife_researcher: [
    { label: "Manage Surveys", to: "/surveys", icon: ClipboardIcon, tone: "blue" },
    { label: "Monitoring Sites", to: "/monitoring-sites", icon: PinIcon, tone: "green" },
    { label: "Log Observations", to: "/observations", icon: ButterflyIcon, tone: "amber" },
  ],
  conservation_officer: [
    { label: "Biodiversity Analytics", to: "/analytics", icon: ChartBarIcon, tone: "purple" },
    { label: "Species Trend", to: "/species-trend", icon: TrendUpIcon, tone: "amber" },
  ],
  forest_officer: [
    { label: "Protected Area Monitoring", to: "/monitoring-sites", icon: PinIcon, tone: "green" },
    { label: "Camera Trap Monitoring", to: "/camera-traps", icon: CameraIcon, tone: "blue" },
    { label: "Biodiversity Analytics", to: "/analytics", icon: ChartBarIcon, tone: "purple" },
  ],
  administrator: [
    { label: "User Management", to: "/admin-panel", icon: UsersIcon, tone: "purple" },
    { label: "Full Survey Access", to: "/surveys", icon: ClipboardIcon, tone: "blue" },
    { label: "Biodiversity Analytics", to: "/analytics", icon: ChartBarIcon, tone: "purple" },
    { label: "Species Trend", to: "/species-trend", icon: TrendUpIcon, tone: "amber" },
  ],
};

// Renders only if the API returns species_by_class, e.g.
// { amphibians: 80, mammals: 240, fish: 360, birds: 120 }
const CLASS_META = [
  { key: "amphibians", label: "Amphibians", color: "#d99a2b" },
  { key: "mammals", label: "Mammals", color: "#0f8a5f" },
  { key: "fish", label: "Fish", color: "#3a7bd5" },
  { key: "birds", label: "Birds", color: "#e0483e" },
];

// Palette used for the "Top Species Observed" donut — cycles through
// these colors, with the last slot reserved for an "Others" bucket.
const DONUT_PALETTE = ["#0f8a5f", "#3a7bd5", "#8b5cf6", "#d99a2b", "#9ca3af"];

const TREND_RANGES = [
  { label: "Last 7 Days", value: 7 },
  { label: "Last 30 Days", value: 30 },
  { label: "Last 90 Days", value: 90 },
];

const OBS_TYPE_META = {
  image: { label: "Camera Trap", tone: "blue" },
  audio: { label: "Audio Sensor", tone: "green" },
  manual: { label: "Observation", tone: "amber" },
};

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function timeAgo(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function isThisMonth(value) {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// Small multi-segment donut built with a conic-gradient, since DonutStat
// only supports a single-color progress ring.
function TopSpeciesDonut({ segments, total }) {
  let cumulative = 0;
  const stops = segments.map((s) => {
    const start = total ? (cumulative / total) * 360 : 0;
    cumulative += s.value;
    const end = total ? (cumulative / total) * 360 : 0;
    return `${s.color} ${start}deg ${end}deg`;
  });
  const gradient = stops.length ? `conic-gradient(${stops.join(", ")})` : "var(--dl-panel-alt)";

  return (
    <div className="top-species-donut-wrap">
      <div className="top-species-donut" style={{ background: gradient }}>
        <div className="top-species-donut-hole">
          <span className="top-species-donut-total">{total}</span>
          <span className="top-species-donut-label">Total</span>
        </div>
      </div>
      <div className="top-species-legend">
        {segments.map((s) => (
          <div className="donut-legend-item" key={s.label}>
            <span className="donut-dot" style={{ background: s.color }} />
            {s.label}
            <span className="donut-pct">
              {total ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [trendDays, setTrendDays] = useState(30);
  const [observations, setObservations] = useState([]);
  const [sites, setSites] = useState([]);
  const [cameraTraps, setCameraTraps] = useState([]);
  const [audioSensors, setAudioSensors] = useState([]);
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [detections, setDetections] = useState({ images: [], audio: [] });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!token) return;
    api.get("/analytics/overview").then((res) => setOverview(res.data)).catch(() => {});
    api.get("/observations/").then((res) => setObservations(res.data)).catch(() => {});
    api.get("/monitoring-sites/").then((res) => setSites(res.data)).catch(() => {});
    api.get("/camera-traps/").then((res) => setCameraTraps(res.data)).catch(() => {});
    api.get("/audio-sensors/").then((res) => setAudioSensors(res.data)).catch(() => {});
    api.get("/datasets/species").then((res) => setSpeciesCatalog(res.data)).catch(() => {});
    api.get("/image-analysis/").then((res) =>
      setDetections((d) => ({ ...d, images: res.data }))
    ).catch(() => {});
    api.get("/bioacoustics/").then((res) =>
      setDetections((d) => ({ ...d, audio: res.data }))
    ).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.get(`/analytics/observation-trend?days=${trendDays}`)
      .then((res) => setTrend(res.data))
      .catch(() => {
        // Backend may not support the days filter — fall back to the
        // unfiltered endpoint so the chart still renders.
        api.get("/analytics/observation-trend").then((res) => setTrend(res.data)).catch(() => setTrend([]));
      });
  }, [token, trendDays]);

  // Build alerts from whatever device / detection data is available —
  // low battery devices, endangered-species detections, and habitat
  // status, mirroring the logic on the dedicated Alerts page.
  useEffect(() => {
    const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
    const collected = [];

    [...cameraTraps.map((t) => ({ ...t, kind: "Camera Trap" })),
     ...audioSensors.map((s) => ({ ...s, kind: "Audio Sensor" }))]
      .filter((d) => typeof d.battery_level === "number" && d.battery_level <= 20)
      .forEach((d) => {
        const site = siteById[d.monitoring_site_id];
        collected.push({
          title: "Low Battery",
          message: `${d.kind} ${d.device_code || ""}${site ? ` in ${site.site_name}` : ""}`,
          tone: "amber",
          detected_at: d.updated_at || d.installation_date,
        });
      });

    detections.images.filter((d) => d.is_endangered).forEach((d) => {
      collected.push({
        title: "New Species Detected",
        message: `${d.predicted_species} detected via camera trap`,
        tone: "red",
        detected_at: d.created_at,
      });
    });

    detections.audio.filter((d) => d.is_endangered).forEach((d) => {
      collected.push({
        title: "New Species Detected",
        message: `${d.predicted_species} detected via audio sensor`,
        tone: "red",
        detected_at: d.created_at,
      });
    });

    collected.sort((a, b) => new Date(b.detected_at || 0) - new Date(a.detected_at || 0));
    setAlerts(collected.slice(0, 4));
  }, [cameraTraps, audioSensors, detections, sites]);

  const actions = QUICK_ACTIONS[user?.role] || [];

  const chartData = {
    labels: trend.map((t) => t.date),
    datasets: [{
      label: "Observations",
      data: trend.map((t) => t.observation_count),
      borderColor: "#0f8a5f",
      backgroundColor: "rgba(15, 138, 95, 0.12)",
      fill: true,
      tension: 0.35,
      pointRadius: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#6b7a72" } },
      y: { grid: { color: "#e3e9e5" }, ticks: { color: "#6b7a72" } },
    },
  };

  const classData = overview?.species_by_class;
  const classTotal = classData ? Object.values(classData).reduce((sum, v) => sum + (Number(v) || 0), 0) : 0;

  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
  const recentObservations = [...observations]
    .sort((a, b) => new Date(b.created_at || b.observed_at || 0) - new Date(a.created_at || a.observed_at || 0))
    .slice(0, 4);

  const activeCameraTraps = cameraTraps.filter((t) => t.status === "active").length;
  const activeAudioSensors = audioSensors.filter((s) => s.status === "active").length;
  // Observations already include image- and audio-sourced detections
  // (observation_type: "image" / "audio"), so counting those tables
  // separately on top would double-count the same events.
  const detectionsThisMonth = observations.filter((o) => isThisMonth(o.created_at || o.observed_at)).length;

  const speciesCounts = {};
  observations.forEach((o) => {
    if (!o.species_name) return;
    speciesCounts[o.species_name] = (speciesCounts[o.species_name] || 0) + 1;
  });
  const sortedSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1]);
  const topSpecies = sortedSpecies.slice(0, 4).map(([label, value], i) => ({
    label, value, color: DONUT_PALETTE[i],
  }));
  const othersTotal = sortedSpecies.slice(4).reduce((sum, [, v]) => sum + v, 0);
  if (othersTotal > 0) {
    topSpecies.push({ label: "Others", value: othersTotal, color: DONUT_PALETTE[4] });
  }
  const speciesGrandTotal = topSpecies.reduce((sum, s) => sum + s.value, 0);

  return (
    <DashboardLayout title={`Welcome back, ${user?.full_name || ""}!`}>
      <div className="stat-grid">
        <StatCard label="Total Surveys" value={overview?.total_surveys ?? "—"} icon={ClipboardIcon} tone="green" />
        <StatCard label="Monitoring Sites" value={overview?.total_monitoring_sites ?? "—"} icon={PinIcon} tone="blue" />
        <StatCard label="Total Observations" value={overview?.total_observations ?? "—"} icon={ButterflyIcon} tone="amber" />
        <StatCard label="Your Role" value={user?.role?.replace(/_/g, " ") ?? "—"} icon={UserIcon} tone="green" />
      </div>

      {classData && (
        <div className="panel" style={{ marginBottom: 22 }}>
          <div className="panel-title">Species Composition</div>
          <div className="composition-grid">
            {CLASS_META.map((c) => {
              const value = Number(classData[c.key]) || 0;
              const pct = classTotal ? (value / classTotal) * 100 : 0;
              return (
                <div className="composition-card" key={c.key}>
                  <DonutStat percent={pct} color={c.color} />
                  <div className="composition-info">
                    <span className="composition-label">{c.label}</span>
                    <span className="composition-value">{value} species</span>
                    <span className="composition-sub">{Math.round(pct)}% of total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dl-panels">
        <div className="panel">
          <div className="panel-title-row">
            <div className="panel-title" style={{ marginBottom: 0 }}>Observation Activity</div>
            <select
              className="chart-range-select"
              value={trendDays}
              onChange={(e) => setTrendDays(Number(e.target.value))}
            >
              {TREND_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {trend.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <p style={{ color: "#6b7a72" }}>No observation data yet.</p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="panel">
            <div className="panel-title">Quick Actions</div>
            <div className="quick-tile-grid">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <button key={a.to} type="button" className="quick-tile" onClick={() => navigate(a.to)}>
                    <span className={`quick-tile-icon tone-${a.tone}`}><Icon size={17} /></span>
                    <span className="quick-tile-label">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">System Overview</div>
            <div className="sys-overview-grid">
              <div className="sys-overview-item">
                <span className="sys-overview-icon tone-blue"><CameraIcon size={16} /></span>
                <div>
                  <div className="sys-overview-label">Active Camera Traps</div>
                  <div className="sys-overview-value">{activeCameraTraps}</div>
                </div>
              </div>
              <div className="sys-overview-item">
                <span className="sys-overview-icon tone-purple"><MicIcon size={16} /></span>
                <div>
                  <div className="sys-overview-label">Audio Sensors</div>
                  <div className="sys-overview-value">{activeAudioSensors}</div>
                </div>
              </div>
              <div className="sys-overview-item">
                <span className="sys-overview-icon tone-green"><DnaIcon size={16} /></span>
                <div>
                  <div className="sys-overview-label">Species in Catalog</div>
                  <div className="sys-overview-value">{speciesCatalog.length}</div>
                </div>
              </div>
              <div className="sys-overview-item">
                <span className="sys-overview-icon tone-blue"><SearchIcon size={16} /></span>
                <div>
                  <div className="sys-overview-label">Detections This Month</div>
                  <div className="sys-overview-value">{detectionsThisMonth}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dl-panels-row">
        <div className="panel">
          <div className="panel-title-row">
            <div className="panel-title" style={{ marginBottom: 0 }}>Recent Observations</div>
            <Link className="panel-link" to="/observations">View All</Link>
          </div>
          {recentObservations.length === 0 && (
            <p style={{ color: "var(--dl-text-dim)", fontSize: 13 }}>No observations yet.</p>
          )}
          {recentObservations.map((o) => {
            const site = siteById[o.monitoring_site_id];
            const meta = OBS_TYPE_META[o.observation_type] || OBS_TYPE_META.manual;
            const when = o.created_at || o.observed_at;
            return (
              <div className="obs-row" key={o.id}>
                <SpeciesImage
                  commonName={o.species_name}
                  scientificName={o.species_name}
                  fallbackLetter={o.species_name?.[0] || "?"}
                />
                <div className="obs-info">
                  <span className="obs-name">{o.species_name}</span>
                  <span className="obs-meta">{site?.site_name || "Unknown site"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span className="obs-date">{formatDate(when)}</span>
                  <span className={`obs-type-badge tone-${meta.tone}`}>{meta.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel">
          <div className="panel-title-row">
            <div className="panel-title" style={{ marginBottom: 0 }}>Recent Alerts</div>
            <Link className="panel-link" to="/alerts">View All</Link>
          </div>
          {alerts.length === 0 && (
            <p style={{ color: "var(--dl-accent)", fontSize: 13 }}>✅ No active alerts.</p>
          )}
          {alerts.map((a, i) => (
            <div className="alert-row" key={i}>
              <span className={`alert-icon tone-${a.tone}`}><BellIcon size={15} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="alert-title">{a.title}</div>
                <div className="alert-sub">{a.message}</div>
              </div>
              <span className="alert-time">{timeAgo(a.detected_at)}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">Top Species Observed</div>
          {speciesGrandTotal > 0 ? (
            <TopSpeciesDonut segments={topSpecies} total={speciesGrandTotal} />
          ) : (
            <p style={{ color: "var(--dl-text-dim)", fontSize: 13 }}>No species data yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;