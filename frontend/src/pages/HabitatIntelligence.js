import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const STATUS_LEVELS = [
  { label: "Healthy", color: "var(--dl-accent)" },
  { label: "Moderate Concern", color: "var(--dl-amber)" },
  { label: "Vulnerable", color: "var(--dl-amber)" },
  { label: "Critical", color: "var(--dl-red)" },
];

const STATUS_COLORS = Object.fromEntries(STATUS_LEVELS.map((s) => [s.label, s.color]));

function generateInsight(site) {
  if (site.total_observations < 3) {
    return "Very few observations logged — insight limited by low monitoring activity at this site.";
  }
  if (site.stability_score < site.diversity_score) {
    return `Weak point: population stability (${site.stability_score}) — most species here have only been seen once, suggesting limited confirmed ongoing presence.`;
  }
  return `Weak point: species diversity (${site.diversity_score}) — relatively few distinct species recorded at this site so far.`;
}

function HabitatIntelligence() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/habitat/intelligence")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load habitat data."));
  }, []);

  const sortedSites = data ? [...data.sites].sort((a, b) => a.habitat_health_score - b.habitat_health_score) : [];

  return (
    <DashboardLayout title="Habitat Intelligence">
      <div className="panel">
        <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          ← Back
        </button>

        <div className="panel-title">Habitat Intelligence</div>
        <p className="panel-subtitle" style={{ marginTop: 0 }}>
          Habitat health scoring per monitoring site, based on species diversity (60%) and population
          stability (40%). Sites needing the most attention appear first.
        </p>

        <div className="status-legend">
          {STATUS_LEVELS.filter((s, i) => STATUS_LEVELS.findIndex((x) => x.label === s.label) === i).map((s) => (
            <div className="status-legend-item" key={s.label}>
              <span className="status-legend-dot" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>

        {error && <p style={{ color: "var(--dl-red)" }}>{error}</p>}

        {data && data.site_count === 0 && (
          <p style={{ color: "var(--dl-text-dim)" }}>No monitoring sites with observation data yet.</p>
        )}

        {data && sortedSites.length > 0 && (
          <div className="habitat-grid">
            {sortedSites.map((s) => {
              const color = STATUS_COLORS[s.status] || "var(--dl-text-dim)";
              return (
                <div key={s.site_id} className="habitat-card" style={{ "--habitat-color": color }}>
                  <div className="habitat-card-header">
                    <h3>{s.site_name}</h3>
                    <span className="habitat-status-pill">{s.status}</span>
                  </div>

                  <p className="habitat-meta">
                    {s.habitat_type || "Habitat type not set"}
                    {s.protected_area ? ` · ${s.protected_area}` : ""}
                  </p>

                  <div className="habitat-score">
                    {s.habitat_health_score}
                    <span className="habitat-score-unit"> / 100</span>
                  </div>

                  <div className="habitat-score-bar">
                    <div
                      className="habitat-score-bar-fill"
                      style={{ width: `${Math.min(100, s.habitat_health_score)}%` }}
                    />
                  </div>

                  <div className="habitat-detail">
                    <div>Species richness: {s.species_richness} · Observations: {s.total_observations}</div>
                    <div style={{ marginTop: 6 }}>
                      Diversity: <strong>{s.diversity_score}</strong> (60%) · Stability:{" "}
                      <strong>{s.stability_score}</strong> (40%)
                    </div>
                  </div>

                  <p className="habitat-insight">{generateInsight(s)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default HabitatIntelligence;