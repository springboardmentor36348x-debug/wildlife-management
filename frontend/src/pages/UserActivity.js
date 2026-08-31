import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import { SearchIcon, ChevronDownIcon } from "../components/Icons";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// Renders a small horizontal list of species with a proportional bar so
// the breakdown reads at a glance instead of as a plain bullet list.
function SpeciesBreakdown({ items, color }) {
  if (!items || items.length === 0) {
    return <p className="species-breakdown-empty">No detections yet.</p>;
  }
  const max = Math.max(...items.map((s) => s.count));
  return (
    <div className="species-breakdown-list">
      {items.map((s) => (
        <div className="species-breakdown-row" key={s.species_name}>
          <span className="species-breakdown-name">{s.species_name}</span>
          <div className="species-breakdown-bar-track">
            <div
              className="species-breakdown-bar-fill"
              style={{ width: `${(s.count / max) * 100}%`, background: color }}
            />
          </div>
          <span className="species-breakdown-count">{s.count}</span>
        </div>
      ))}
    </div>
  );
}

function UserActivity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("total"); // total | image | audio | name
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/user-activity/by-user")
      .then((res) => setActivity(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load activity."))
      .finally(() => setLoading(false));
  }, []);

  const topUser = activity.length > 0
    ? activity.reduce((max, a) => (a.total_detections > max.total_detections ? a : max), activity[0])
    : null;

  const totals = activity.reduce(
    (acc, a) => ({
      images: acc.images + a.image_detections,
      audio: acc.audio + a.audio_detections,
      total: acc.total + a.total_detections,
    }),
    { images: 0, audio: 0, total: 0 }
  );

  // Rank is computed off the full unfiltered list so medals don't shift
  // around as someone types into the search box.
  const ranked = useMemo(() => {
    return [...activity]
      .sort((a, b) => b.total_detections - a.total_detections)
      .map((a, i) => ({ ...a, rank: i }));
  }, [activity]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    let rows = ranked.filter((a) =>
      !term || a.full_name.toLowerCase().includes(term) || a.role.toLowerCase().includes(term)
    );
    const sorters = {
      total: (a, b) => b.total_detections - a.total_detections,
      image: (a, b) => b.image_detections - a.image_detections,
      audio: (a, b) => b.audio_detections - a.audio_detections,
      name: (a, b) => a.full_name.localeCompare(b.full_name),
    };
    rows = [...rows].sort(sorters[sortBy] || sorters.total);
    return rows;
  }, [ranked, search, sortBy]);

  const chartData = {
    labels: ranked.map((a) => a.full_name),
    datasets: [
      {
        label: "Image Detections",
        data: ranked.map((a) => a.image_detections),
        backgroundColor: "#14b8a6",
      },
      {
        label: "Audio Detections",
        data: ranked.map((a) => a.audio_detections),
        backgroundColor: "#60a5fa",
      },
    ],
  };

  return (
    <DashboardLayout title="Detections by User">
      <div className="panel">
        <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          ← Back
        </button>

        <div className="panel-title">Detections by User</div>
        <p className="panel-subtitle" style={{ marginTop: 0 }}>
          Who uploaded what — image and audio detection counts per researcher. Click a row to see species detected.
        </p>

        {error && <p style={{ color: "var(--dl-red)" }}>{error}</p>}
        {loading && <p style={{ color: "var(--dl-text-dim)" }}>Loading activity...</p>}

        {!loading && activity.length > 0 && (
          <>
            {/* Summary stat strip */}
            <div className="activity-summary-grid">
              <div className="activity-summary-card">
                <span className="activity-summary-label">Contributors</span>
                <span className="activity-summary-value">{activity.length}</span>
              </div>
              <div className="activity-summary-card">
                <span className="activity-summary-label">Image Detections</span>
                <span className="activity-summary-value" style={{ color: "#14b8a6" }}>{totals.images}</span>
              </div>
              <div className="activity-summary-card">
                <span className="activity-summary-label">Audio Detections</span>
                <span className="activity-summary-value" style={{ color: "#60a5fa" }}>{totals.audio}</span>
              </div>
              <div className="activity-summary-card">
                <span className="activity-summary-label">Total Detections</span>
                <span className="activity-summary-value">{totals.total}</span>
              </div>
            </div>

            <div style={{ maxWidth: "640px", marginTop: "22px" }}>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: { legend: { labels: { color: "#16241d" } } },
                  scales: {
                    x: { stacked: true, ticks: { color: "#6b7a72" }, grid: { display: false } },
                    y: { stacked: true, ticks: { color: "#6b7a72" }, grid: { color: "rgba(22,36,29,0.06)" }, beginAtZero: true },
                  },
                }}
              />
            </div>

            {topUser && (
              <p style={{ marginTop: "16px", fontSize: "14px", color: "var(--dl-accent-dark)" }}>
                🏆 Most active: <strong>{topUser.full_name}</strong> with {topUser.total_detections} total detections.
              </p>
            )}
          </>
        )}

        {!loading && activity.length > 0 && (
          <div className="activity-toolbar">
            <div className="activity-search">
              <SearchIcon size={15} />
              <input
                type="text"
                placeholder="Search by name or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="activity-sort">
              <span>Sort by</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="total">Total detections</option>
                <option value="image">Image detections</option>
                <option value="audio">Audio detections</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        )}

        <div className="activity-list" style={{ marginTop: activity.length > 0 ? "16px" : "24px" }}>
          {!loading && activity.length === 0 && (
            <p style={{ color: "var(--dl-text-dim)" }}>No activity yet.</p>
          )}

          {!loading && activity.length > 0 && visible.length === 0 && (
            <p style={{ color: "var(--dl-text-dim)" }}>No users match "{search}".</p>
          )}

          {visible.map((a) => {
            const isOpen = expandedUserId === a.user_id;
            const imagePct = a.total_detections ? (a.image_detections / a.total_detections) * 100 : 0;
            return (
              <div className={"activity-card" + (isOpen ? " open" : "")} key={a.user_id}>
                <button
                  type="button"
                  className="activity-card-header"
                  onClick={() => setExpandedUserId(isOpen ? null : a.user_id)}
                >
                  <span className="activity-rank">{RANK_MEDALS[a.rank] || a.rank + 1}</span>
                  <span className="activity-avatar">{initials(a.full_name)}</span>

                  <div className="activity-identity">
                    <span className="activity-name">{a.full_name}</span>
                    <span className="activity-role">{a.role.replace(/_/g, " ")}</span>
                  </div>

                  <div className="activity-split">
                    <div className="activity-split-bar">
                      <div className="activity-split-bar-fill" style={{ width: `${imagePct}%` }} />
                    </div>
                    <div className="activity-split-labels">
                      <span style={{ color: "#14b8a6" }}>{a.image_detections} img</span>
                      <span style={{ color: "#60a5fa" }}>{a.audio_detections} audio</span>
                    </div>
                  </div>

                  <span className="activity-total">{a.total_detections}</span>
                  <span className={"activity-chevron" + (isOpen ? " open" : "")}>
                    <ChevronDownIcon size={16} />
                  </span>
                </button>

                {isOpen && (
                  <div className="activity-card-body">
                    <div>
                      <div className="species-breakdown-title" style={{ color: "#14b8a6" }}>
                        Species detected via images
                      </div>
                      <SpeciesBreakdown items={a.image_species_breakdown} color="#14b8a6" />
                    </div>
                    <div>
                      <div className="species-breakdown-title" style={{ color: "#60a5fa" }}>
                        Species detected via audio
                      </div>
                      <SpeciesBreakdown items={a.audio_species_breakdown} color="#60a5fa" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default UserActivity;