import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const STATUS_LEVELS = [
  { label: "Excellent / Healthy", color: "var(--dl-accent)" },
  { label: "Moderate Concern / Vulnerable", color: "var(--dl-amber)" },
  { label: "Critical", color: "var(--dl-red)" },
];

const FACTOR_LABELS = {
  species_diversity: "Species Diversity",
  population_stability: "Population Stability",
  habitat_quality: "Habitat Quality",
  endangered_status: "Endangered Species Status",
};

function EcosystemHealth() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/ecosystem-health/score")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load ecosystem health data."));
  }, []);

  const weakestFactor = data
    ? Object.entries(data.factors).reduce((min, [key, f]) =>
        f.score < min.score ? { key, ...f } : min,
        { key: null, score: 101 }
      )
    : null;

  return (
    <DashboardLayout title="Ecosystem Health Analytics">
      <div className="panel">
        <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          ← Back
        </button>

        <div className="panel-title">Ecosystem Health Analytics</div>
        <p className="panel-subtitle" style={{ marginTop: 0 }}>
          Overall ecosystem health, combining species diversity, population stability, habitat quality,
          and endangered species status.
        </p>

        <div className="status-legend">
          {STATUS_LEVELS.map((s) => (
            <div className="status-legend-item" key={s.label}>
              <span className="status-legend-dot" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>

        {error && <p style={{ color: "var(--dl-red)" }}>{error}</p>}

        {data && (
          <>
            <div className="score-hero">
              <div className="score-hero-label">Overall Ecosystem Health Score</div>
              <div className="score-hero-value">{data.overall_score}</div>
              <div className="score-hero-status">{data.status}</div>
            </div>

            {weakestFactor && weakestFactor.key && (
              <p style={{ marginTop: 16, fontSize: 14, color: "var(--dl-amber)", fontStyle: "italic" }}>
                ⚠ Primary drag on the score: {FACTOR_LABELS[weakestFactor.key]} ({weakestFactor.score}).
                Improving this factor would raise the overall score the most.
              </p>
            )}

            {data.note && <div className="info-note">{data.note}</div>}

            <div className="panel-title" style={{ marginTop: 28 }}>Contributing Factors</div>
            <div style={{ marginTop: 12 }}>
              {Object.entries(data.factors).map(([key, f]) => {
                const isEndangeredFactor = key === "endangered_status";
                return (
                  <div className="factor-row" key={key}>
                    <div className="factor-row-top">
                      <span>
                        {FACTOR_LABELS[key] || key} ({f.weight_pct}%)
                        {isEndangeredFactor && (
                          <span style={{ color: "var(--dl-text-dim)", fontWeight: 400 }}>
                            {" "}
                            — {data.endangered_detections} of {data.total_detections} detections flagged
                          </span>
                        )}
                      </span>
                      <strong>{f.score}</strong>
                    </div>
                    <div className="factor-bar">
                      <div
                        className={`factor-bar-fill ${key === weakestFactor?.key ? "weak" : "ok"}`}
                        style={{ width: `${Math.min(100, f.score)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to="/conservation-recommendations" style={{ display: "inline-block", marginTop: 12 }}>
              <button type="button">View Conservation Recommendations →</button>
            </Link>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default EcosystemHealth;