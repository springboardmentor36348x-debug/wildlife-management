import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const STATUS_COLORS = {
  "Excellent": "var(--dl-accent)",
  "Healthy": "var(--dl-accent)",
  "Moderate Concern": "var(--dl-amber)",
  "Vulnerable": "var(--dl-amber)",
  "Critical": "var(--dl-red)",
};

const PRIORITY_COLORS = {
  High: "var(--dl-red)",
  Medium: "var(--dl-amber)",
  Low: "var(--dl-blue)",
  Info: "var(--dl-text-dim)",
};

function WildlifeIntelligenceDashboard() {
  const [ecosystem, setEcosystem] = useState(null);
  const [population, setPopulation] = useState(null);
  const [habitat, setHabitat] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/ecosystem-health/score").then((res) => setEcosystem(res.data)).catch(() => {});
    api.get("/population/estimates").then((res) => setPopulation(res.data)).catch(() => {});
    api.get("/habitat/intelligence").then((res) => setHabitat(res.data)).catch(() => {});
    api.get("/conservation-recommendations/").then((res) => setRecommendations(res.data)).catch(() => {});
  }, []);

  const topRecommendations = recommendations?.recommendations?.slice(0, 3) || [];
  const decliningSpecies = population?.species_population?.filter((s) => s.trend === "decreasing") || [];
  const criticalSites = habitat?.sites?.filter((s) => s.status === "Critical" || s.status === "Vulnerable") || [];

  const cardStyle = {
    padding: "20px", border: "1px solid var(--dl-border)", borderRadius: "12px",
    cursor: "pointer", transition: "border-color 0.15s ease",
    textDecoration: "none", color: "var(--dl-text)", display: "block",
    background: "var(--dl-panel-alt)",
  };

  return (
    <DashboardLayout title="Wildlife Intelligence Dashboard">
      <div className="panel">
        <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          ← Back
        </button>

        <div className="panel-title">Wildlife Intelligence Dashboard</div>
        <p className="panel-subtitle" style={{ marginTop: 0 }}>Combined overview of ecosystem health, population trends, habitat status, and conservation priorities. Click any card for full details.</p>

        {ecosystem && (
          <Link to="/ecosystem-health" style={{
            marginTop: "16px", padding: "24px", borderRadius: "16px", display: "block",
            background: "linear-gradient(135deg, var(--dl-accent), var(--dl-accent-dark))",
            border: `2px solid ${STATUS_COLORS[ecosystem.status] || "var(--dl-border)"}`,
            textAlign: "center", textDecoration: "none", color: "#fff",
          }}>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)" }}>Overall Ecosystem Health</div>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#fff" }}>
              {ecosystem.overall_score}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>
              {ecosystem.status}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", marginTop: "8px" }}>View full breakdown →</div>
          </Link>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginTop: "20px" }}>
          <Link to="/population-estimation" style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Population</h3>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{population?.species_count ?? "-"}</div>
            <div style={{ fontSize: "13px", color: "var(--dl-text-dim)" }}>species tracked</div>
            {decliningSpecies.length > 0 && (
              <p style={{ color: "var(--dl-red)", fontSize: "13px", marginTop: "10px" }}>
                ⚠ {decliningSpecies.length} species declining: {decliningSpecies.map((s) => s.species_name).join(", ")}
              </p>
            )}
            <div style={{ fontSize: "12px", color: "var(--dl-text-dim)", marginTop: "8px" }}>View details →</div>
          </Link>

          <Link to="/habitat-intelligence" style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Habitat</h3>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{habitat?.site_count ?? "-"}</div>
            <div style={{ fontSize: "13px", color: "var(--dl-text-dim)" }}>sites monitored</div>
            {criticalSites.length > 0 && (
              <p style={{ color: "var(--dl-amber)", fontSize: "13px", marginTop: "10px" }}>
                ⚠ {criticalSites.length} site(s) need attention: {criticalSites.map((s) => s.site_name).join(", ")}
              </p>
            )}
            <div style={{ fontSize: "12px", color: "var(--dl-text-dim)", marginTop: "8px" }}>View details →</div>
          </Link>

          <Link to="/conservation-recommendations" style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Recommendations</h3>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{recommendations?.recommendation_count ?? "-"}</div>
            <div style={{ fontSize: "13px", color: "var(--dl-text-dim)" }}>active recommendations</div>
            <div style={{ fontSize: "12px", color: "var(--dl-text-dim)", marginTop: "8px" }}>View details →</div>
          </Link>
        </div>

        {topRecommendations.length > 0 && (
          <>
            <div className="panel-title" style={{ marginTop: "28px" }}>Top Priority Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topRecommendations.map((r, i) => (
                <div key={i} style={{
                  padding: "14px", borderRadius: "8px", background: "var(--dl-panel-alt)",
                  border: `1px solid ${PRIORITY_COLORS[r.priority] || "var(--dl-border)"}`,
                  borderLeft: `4px solid ${PRIORITY_COLORS[r.priority] || "var(--dl-border)"}`,
                }}>
                  <div style={{ fontWeight: 700, color: PRIORITY_COLORS[r.priority] || "var(--dl-text-dim)", fontSize: "13px" }}>
                    {r.priority} — {r.category}
                  </div>
                  <p style={{ margin: "4px 0 0", color: "var(--dl-text)" }}>{r.recommendation}</p>
                </div>
              ))}
            </div>
            <Link to="/conservation-recommendations" style={{ display: "inline-block", marginTop: "12px" }}>
              <button type="button">View all recommendations →</button>
            </Link>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default WildlifeIntelligenceDashboard;