import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const TREND_LABELS = {
  increasing: { label: "↑ Increasing", color: "var(--dl-accent)" },
  decreasing: { label: "↓ Decreasing", color: "var(--dl-red)" },
  stable: { label: "→ Stable", color: "var(--dl-amber)" },
  insufficient_data: { label: "Insufficient data", color: "var(--dl-text-dim)" },
};

const TREND_ORDER = { increasing: 0, decreasing: 1, stable: 2, insufficient_data: 3 };

function PopulationEstimation() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/population/estimates")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load population data."));
  }, []);

  const sortedSpecies = data
    ? [...data.species_population].sort((a, b) => TREND_ORDER[a.trend] - TREND_ORDER[b.trend])
    : [];

  const trendCounts = data
    ? data.species_population.reduce((acc, s) => {
        acc[s.trend] = (acc[s.trend] || 0) + 1;
        return acc;
      }, {})
    : {};

  return (
    <DashboardLayout title="Population Estimation">
      <div className="panel">
        <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          ← Back
        </button>

        <div className="panel-title">Population Estimation</div>
        <p className="panel-subtitle" style={{ marginTop: 0 }}>Population counts, site density, and trend direction per species.</p>

        {error && <p style={{ color: "var(--dl-red)" }}>{error}</p>}

        {data && (
          <>
            <div className="stat-grid" style={{ margin: "16px 0" }}>
              <div className="stat-card" style={{ minWidth: "160px" }}>
                <div className="stat-label">Total Population Count</div>
                <div className="stat-value">{data.total_population_count}</div>
              </div>
              <div className="stat-card" style={{ minWidth: "160px" }}>
                <div className="stat-label">Species Tracked</div>
                <div className="stat-value">{data.species_count}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              {Object.entries(TREND_LABELS).map(([key, t]) => (
                <span key={key} style={{
                  color: t.color, fontWeight: 600, fontSize: "13px",
                  border: `1px solid ${t.color}`, borderRadius: "20px",
                  padding: "4px 12px",
                }}>
                  {t.label}: {trendCounts[key] || 0}
                </span>
              ))}
            </div>

            <p style={{ fontSize: "13px", color: "var(--dl-text-dim)", marginBottom: "16px" }}>
              A trend requires at least 3 combined observations across the last 28 days
              (recent + prior 14-day windows). Species below this threshold show as
              "Insufficient data" until more observations are logged.
            </p>

            <table className="dl-table">
              <thead>
                <tr>
                  <th>Species</th>
                  <th>Population Count</th>
                  <th>Sites Observed</th>
                  <th>Density / Site</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {sortedSpecies.map((s) => {
                  const trend = TREND_LABELS[s.trend] || TREND_LABELS.insufficient_data;
                  return (
                    <tr key={s.species_name} style={s.trend === "insufficient_data" ? { opacity: 0.6 } : {}}>
                      <td>{s.species_name}</td>
                      <td>{s.population_count}</td>
                      <td>{s.sites_observed}</td>
                      <td>{s.density_per_site}</td>
                      <td style={{ color: trend.color, fontWeight: 600 }}>{trend.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PopulationEstimation;