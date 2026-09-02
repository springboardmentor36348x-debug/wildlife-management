import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import DonutStat from "../components/DonutStat";
import { PopulationIcon, TreeIcon, ShieldIcon, TrendUpIcon } from "../components/Icons";

const STATUS_COLOR = {
  Excellent: "#0f8a5f",
  Healthy: "#0f8a5f",
  "Moderate Concern": "#d99a2b",
  Vulnerable: "#d99a2b",
  Critical: "#e0483e",
};

const PRIORITY_TONE = { High: "red", Medium: "amber", Low: "blue", Info: "green" };

function WildlifeIntelligenceDashboard() {
  const [ecosystem, setEcosystem] = useState(null);
  const [population, setPopulation] = useState(null);
  const [habitat, setHabitat] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.allSettled([
      api.get("/ecosystem-health/score").then((r) => setEcosystem(r.data)),
      api.get("/population/estimates").then((r) => setPopulation(r.data)),
      api.get("/habitat/intelligence").then((r) => setHabitat(r.data)),
      api.get("/conservation-recommendations/").then((r) => setRecommendations(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const decliningSpecies = population?.species_population?.filter((s) => s.trend === "decreasing") || [];
  const criticalSites = habitat?.sites?.filter((s) => s.status === "Critical" || s.status === "Vulnerable") || [];
  const topRecommendations = recommendations?.recommendations?.slice(0, 4) || [];
  const scoreTone = STATUS_COLOR[ecosystem?.status] || "#0f8a5f";

  return (
    <DashboardLayout title="Wildlife Intelligence Dashboard">
      <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Back
      </button>

      {loading ? (
        <p style={{ color: "var(--dl-text-dim)" }}>Loading intelligence overview…</p>
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 22 }}>
            <div className="panel-title-row">
              <div className="panel-title" style={{ marginBottom: 0 }}>Overall Ecosystem Health</div>
              <Link className="panel-link" to="/ecosystem-health">Full breakdown →</Link>
            </div>
            {ecosystem ? (
              <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                <DonutStat percent={ecosystem.overall_score} color={scoreTone} size={96} stroke={9} />
                <div>
                  <span className="status-badge" style={{ background: `${scoreTone}22`, color: scoreTone }}>
                    {ecosystem.status}
                  </span>
                  <p style={{ margin: "8px 0 0", color: "var(--dl-text-dim)", fontSize: 13.5, maxWidth: 440 }}>
                    {ecosystem.endangered_detections} of {ecosystem.total_detections} recorded detections
                    are flagged as endangered species. Score weights species diversity (30%), population
                    stability (25%), habitat quality (20%), endangered status (15%) and environmental
                    conditions (10%).
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--dl-text-dim)" }}>No ecosystem score available yet.</p>
            )}
          </div>

          <div className="stat-grid" style={{ marginBottom: 22 }}>
            <StatCard label="Species Tracked" value={population?.species_count ?? "—"} icon={PopulationIcon} tone="blue" />
            <StatCard label="Sites Monitored" value={habitat?.site_count ?? "—"} icon={TreeIcon} tone="green" />
            <StatCard label="Active Recommendations" value={recommendations?.recommendation_count ?? "—"} icon={ShieldIcon} tone="amber" />
            <StatCard label="Declining Species" value={decliningSpecies.length} icon={TrendUpIcon} tone={decliningSpecies.length > 0 ? "red" : "green"} />
          </div>

          <div className="dl-panels" style={{ marginBottom: 22 }}>
            <Link to="/population-estimation" className="panel" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="panel-title">Population</div>
              {decliningSpecies.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--dl-red)" }}>
                  {decliningSpecies.map((s) => (
                    <li key={s.species_name}>{s.species_name} — declining</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "var(--dl-text-dim)", fontSize: 13.5, margin: 0 }}>
                  No species currently trending down.
                </p>
              )}
              <span className="panel-link" style={{ display: "inline-block", marginTop: 10 }}>View details →</span>
            </Link>

            <Link to="/habitat-intelligence" className="panel" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="panel-title">Habitat</div>
              {criticalSites.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--dl-amber)" }}>
                  {criticalSites.map((s) => (
                    <li key={s.site_id || s.site_name}>{s.site_name} — {s.status}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "var(--dl-text-dim)", fontSize: 13.5, margin: 0 }}>
                  All monitored sites in stable condition.
                </p>
              )}
              <span className="panel-link" style={{ display: "inline-block", marginTop: 10 }}>View details →</span>
            </Link>
          </div>

          <div className="panel">
            <div className="panel-title-row">
              <div className="panel-title" style={{ marginBottom: 0 }}>Top Priority Actions</div>
              <Link className="panel-link" to="/conservation-recommendations">View all →</Link>
            </div>
            {topRecommendations.length === 0 ? (
              <p style={{ color: "var(--dl-text-dim)", fontSize: 13.5 }}>No open recommendations.</p>
            ) : (
              topRecommendations.map((r, i) => (
                <div className="alert-row" key={i}>
                  <span className={`alert-icon tone-${PRIORITY_TONE[r.priority] || "green"}`}>
                    {r.priority?.[0] || "!"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="alert-title">{r.priority} — {r.category}</div>
                    <div className="alert-sub">{r.recommendation}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default WildlifeIntelligenceDashboard;