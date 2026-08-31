import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const PRIORITY_ORDER = ["High", "Medium", "Low", "Info"];

const PRIORITY_COLORS = {
  High: "var(--dl-red)",
  Medium: "var(--dl-amber)",
  Low: "var(--dl-blue)",
  Info: "var(--dl-text-dim)",
};

const CATEGORY_LINKS = {
  "Habitat Restoration": "/habitat-intelligence",
  "Population Protection": "/population-estimation",
  "Species Protection": "/species-detections",
  "Biodiversity": "/analytics",
  "Ecosystem Health": "/ecosystem-health",
  "Monitoring Optimization": "/habitat-intelligence",
};

function normalizeQuotedNames(text) {
  return text.replace(/'([^']+)'/g, (match, name) => {
    const titled = name
      .toLowerCase()
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
    return `'${titled}'`;
  });
}

function getSampleSizeWarning(text) {
  const match = text.match(/recent:\s*(\d+),\s*prior:\s*(\d+)/i);
  if (!match) return null;
  const total = Number(match[1]) + Number(match[2]);
  return total < 6 ? `Low sample size (${total} sightings total)` : null;
}

function ConservationRecommendations() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/conservation-recommendations/")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load recommendations."));
  }, []);

  const sortedRecommendations = data
    ? [...data.recommendations].sort(
        (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
      )
    : [];

  const priorityCounts = sortedRecommendations.reduce((acc, r) => {
    acc[r.priority] = (acc[r.priority] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout title="Conservation Recommendations">
      <div className="panel">
        <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          ← Back
        </button>

        <div className="panel-title">Conservation Recommendations</div>
        <p className="panel-subtitle" style={{ marginTop: 0 }}>
          Rule-based conservation priorities, generated from ecosystem health, habitat, and population data.
        </p>

        {error && <p style={{ color: "var(--dl-red)" }}>{error}</p>}

        {data && (
          <>
            <div className="stat-grid" style={{ margin: "16px 0" }}>
              <div className="stat-card">
                <div className="stat-label">Ecosystem Score</div>
                <div className="stat-value">{data.ecosystem_score} — {data.ecosystem_status}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Active Recommendations</div>
                <div className="stat-value">{data.recommendation_count}</div>
              </div>
            </div>

            {PRIORITY_ORDER.some((p) => priorityCounts[p]) && (
              <div className="priority-summary">
                {PRIORITY_ORDER.filter((p) => priorityCounts[p]).map((p) => (
                  <span key={p} className="priority-chip" style={{ "--chip-color": PRIORITY_COLORS[p] }}>
                    {priorityCounts[p]} {p} Priority
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              {sortedRecommendations.map((r, i) => {
                const linkTo = CATEGORY_LINKS[r.category];
                const color = PRIORITY_COLORS[r.priority] || "var(--dl-border)";
                const cleanText = normalizeQuotedNames(r.recommendation);
                const sampleWarning = getSampleSizeWarning(r.recommendation);

                return (
                  <div key={i} className="recommendation-card" style={{ "--rec-color": color }}>
                    <div className="recommendation-header">
                      <span className="recommendation-priority">
                        {r.priority} Priority
                        {sampleWarning && <span className="low-sample-badge">{sampleWarning}</span>}
                      </span>
                      <span className="recommendation-category">{r.category}</span>
                    </div>
                    <p className="recommendation-text">{cleanText}</p>
                    {linkTo && (
                      <Link to={linkTo} className="recommendation-link">
                        View details →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ConservationRecommendations;