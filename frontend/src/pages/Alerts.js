import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const SEVERITY_COLORS = {
  High: "var(--dl-red)",
  Medium: "var(--dl-amber)",
};

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const collected = [];

    const imagePromise = api.get("/image-analysis/").then((res) => {
      res.data.filter((d) => d.is_endangered).forEach((d) => {
        collected.push({
          type: "Endangered Species Detected",
          message: `${d.predicted_species} detected via image (${(d.confidence * 100).toFixed(1)}% confidence)`,
          severity: "High",
          detected_at: d.created_at,
          link: "/species-detections",
        });
      });
    }).catch(() => {});

    const audioPromise = api.get("/bioacoustics/").then((res) => {
      res.data.filter((d) => d.is_endangered).forEach((d) => {
        collected.push({
          type: "Endangered Species Detected",
          message: `${d.predicted_species} detected via audio (${(d.confidence * 100).toFixed(1)}% confidence)`,
          severity: "High",
          detected_at: d.created_at,
          link: "/species-detections",
        });
      });
    }).catch(() => {});

    const habitatPromise = api.get("/habitat/intelligence").then((res) => {
      res.data.sites.filter((s) => s.status === "Critical" || s.status === "Vulnerable").forEach((s) => {
        collected.push({
          type: "Habitat Degradation Alert",
          message: `'${s.site_name}' is in ${s.status} condition (score ${s.habitat_health_score})`,
          severity: s.status === "Critical" ? "High" : "Medium",
          detected_at: null,
          link: "/habitat-intelligence",
        });
      });
    }).catch(() => {});

    const populationPromise = api.get("/population/estimates").then((res) => {
      res.data.species_population.filter((s) => s.trend === "decreasing").forEach((s) => {
        collected.push({
          type: "Population Decline Alert",
          message: `${s.species_name} population is declining (recent: ${s.recent_period_count}, prior: ${s.prior_period_count})`,
          severity: "High",
          detected_at: null,
          link: "/population-estimation",
        });
      });
    }).catch(() => {});

    Promise.all([imagePromise, audioPromise, habitatPromise, populationPromise]).then(() => {
      const severityOrder = { High: 0, Medium: 1 };
      collected.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      setAlerts(collected);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout title="Alerts">
      <div className="panel">
        <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          ← Back
        </button>

        <div className="panel-title">Alerts</div>
        <p className="panel-subtitle" style={{ marginTop: 0 }}>Endangered species, population decline, and habitat degradation alerts, drawn from live monitoring data.</p>

        {loading && <p style={{ color: "var(--dl-text-dim)" }}>Loading alerts...</p>}

        {!loading && alerts.length === 0 && (
          <p style={{ color: "var(--dl-accent)", marginTop: "16px" }}>✅ No active alerts — everything looks stable.</p>
        )}

        {!loading && alerts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                padding: "16px", borderRadius: "10px", background: "var(--dl-panel-alt)",
                border: `1px solid ${SEVERITY_COLORS[a.severity]}`,
                borderLeft: `4px solid ${SEVERITY_COLORS[a.severity]}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 700, color: SEVERITY_COLORS[a.severity] }}>
                    {a.severity} — {a.type}
                  </span>
                  {a.detected_at && (
                    <span style={{ fontSize: "12px", color: "var(--dl-text-dim)" }}>
                      {new Date(a.detected_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, color: "var(--dl-text)" }}>{a.message}</p>
                <Link to={a.link} style={{ fontSize: "13px", display: "inline-block", marginTop: "8px", color: "var(--dl-accent-dark)" }}>
                  View details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Alerts;