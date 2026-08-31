import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

function Reports() {
  const [report, setReport] = useState(null);
  const [ecosystem, setEcosystem] = useState(null);
  const [population, setPopulation] = useState(null);
  const [habitat, setHabitat] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/reports/monitoring-summary")
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Failed to load report."))
      .finally(() => setLoading(false));

    api.get("/ecosystem-health/score").then((res) => setEcosystem(res.data)).catch(() => {});
    api.get("/population/estimates").then((res) => setPopulation(res.data)).catch(() => {});
    api.get("/habitat/intelligence").then((res) => setHabitat(res.data)).catch(() => {});
    api.get("/conservation-recommendations/").then((res) => setRecommendations(res.data)).catch(() => {});
  }, []);

  const handleDownloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    const generatedAt = new Date().toLocaleString();

    doc.setFontSize(18);
    doc.text("Wildlife Monitoring Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated on ${generatedAt}`, 14, 25);
    doc.setTextColor(0);

    doc.setFontSize(11);
    doc.text(`Total Observations: ${report.total_observations}`, 14, 36);
    doc.text(`Species Richness: ${report.biodiversity.species_richness}`, 14, 43);
    doc.text(`Shannon Index: ${report.biodiversity.shannon_index}`, 14, 50);

    let y = 60;
    doc.setFontSize(13);
    doc.text("Recent Image Detections", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Species", "Confidence", "Endangered", "Detected At"]],
      body: report.recent_image_detections.map((d) => [
        d.species, `${(d.confidence * 100).toFixed(1)}%`,
        d.is_endangered ? "Yes" : "No", new Date(d.detected_at).toLocaleString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 138, 95] },
    });

    y = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.text("Recent Audio Detections", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Species", "Confidence", "Call Type", "Endangered", "Detected At"]],
      body: report.recent_audio_detections.map((d) => [
        d.species, `${(d.confidence * 100).toFixed(1)}%`, d.call_type || "-",
        d.is_endangered ? "Yes" : "No", new Date(d.detected_at).toLocaleString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 138, 95] },
    });

    if (ecosystem) {
      y = doc.lastAutoTable.finalY + 14;
      doc.setFontSize(13);
      doc.text("Ecosystem Health", 14, y);
      y += 6;
      doc.setFontSize(10);
      doc.text(`Overall Score: ${ecosystem.overall_score} (${ecosystem.status})`, 14, y);
      y += 5;
      doc.text(`${ecosystem.endangered_detections} of ${ecosystem.total_detections} detections flagged as endangered.`, 14, y);
      y += 10;
    }

    if (population && population.species_population.length > 0) {
      doc.setFontSize(13);
      doc.text("Population Estimates", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Species", "Population", "Sites", "Trend"]],
        body: population.species_population.map((s) => [
          s.species_name, s.population_count, s.sites_observed, s.trend.replace("_", " "),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 138, 95] },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    if (habitat && habitat.sites.length > 0) {
      doc.setFontSize(13);
      doc.text("Habitat Health by Site", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Site", "Habitat Type", "Health Score", "Status"]],
        body: habitat.sites.map((s) => [
          s.site_name, s.habitat_type || "-", s.habitat_health_score, s.status,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 138, 95] },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    if (recommendations && recommendations.recommendations.length > 0) {
      doc.setFontSize(13);
      doc.text("Conservation Recommendations", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Priority", "Category", "Recommendation"]],
        body: recommendations.recommendations.map((r) => [r.priority, r.category, r.recommendation]),
        styles: { fontSize: 8, cellWidth: "wrap" },
        headStyles: { fillColor: [15, 138, 95] },
        columnStyles: { 2: { cellWidth: 110 } },
      });
    }

    doc.save(`wildlife-monitoring-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) return <DashboardLayout title="Wildlife Monitoring Report"><p>Loading report...</p></DashboardLayout>;
  if (error) return <DashboardLayout title="Wildlife Monitoring Report"><p style={{ color: "var(--dl-red)" }}>{error}</p></DashboardLayout>;
  if (!report) return null;

  return (
    <DashboardLayout title="Wildlife Monitoring Report">
      <button className="dl-link-button" onClick={() => navigate(-1)}>← Back</button>
      <button className="dl-primary-button" onClick={handleDownloadPDF} style={{ marginLeft: "12px" }}>
        ⬇ Download PDF
      </button>

      <div className="dl-stat-grid" style={{ marginTop: "20px" }}>
        <StatCard label="Total Observations" value={report.total_observations} />
        <StatCard label="Species Richness" value={report.biodiversity.species_richness} />
        <StatCard label="Shannon Index" value={report.biodiversity.shannon_index} />
        {ecosystem && (
          <StatCard label="Ecosystem Health" value={`${ecosystem.overall_score} — ${ecosystem.status}`} />
        )}
      </div>

      <h3 className="dl-section-title">Recent Image Detections</h3>
      {report.recent_image_detections.length === 0 ? (
        <p className="dl-empty">No image detections yet.</p>
      ) : (
        <table className="dl-table">
          <thead>
            <tr><th>Species</th><th>Confidence</th><th>Endangered</th><th>Detected At</th></tr>
          </thead>
          <tbody>
            {report.recent_image_detections.map((d, i) => (
              <tr key={i}>
                <td>{d.species}</td>
                <td>{(d.confidence * 100).toFixed(1)}%</td>
                <td>{d.is_endangered ? <StatusBadge status="Endangered" /> : "No"}</td>
                <td>{new Date(d.detected_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="dl-section-title">Recent Audio Detections</h3>
      {report.recent_audio_detections.length === 0 ? (
        <p className="dl-empty">No audio detections yet.</p>
      ) : (
        <table className="dl-table">
          <thead>
            <tr><th>Species</th><th>Confidence</th><th>Call Type</th><th>Endangered</th><th>Detected At</th></tr>
          </thead>
          <tbody>
            {report.recent_audio_detections.map((d, i) => (
              <tr key={i}>
                <td>{d.species}</td>
                <td>{(d.confidence * 100).toFixed(1)}%</td>
                <td>{d.call_type || "-"}</td>
                <td>{d.is_endangered ? <StatusBadge status="Endangered" /> : "No"}</td>
                <td>{new Date(d.detected_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {population && population.species_population.length > 0 && (
        <>
          <h3 className="dl-section-title">Population Estimates</h3>
          <table className="dl-table">
            <thead><tr><th>Species</th><th>Population</th><th>Sites</th><th>Trend</th></tr></thead>
            <tbody>
              {population.species_population.map((s) => (
                <tr key={s.species_name}>
                  <td>{s.species_name}</td>
                  <td>{s.population_count}</td>
                  <td>{s.sites_observed}</td>
                  <td>{s.trend.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {habitat && habitat.sites.length > 0 && (
        <>
          <h3 className="dl-section-title">Habitat Health by Site</h3>
          <table className="dl-table">
            <thead><tr><th>Site</th><th>Habitat Type</th><th>Health Score</th><th>Status</th></tr></thead>
            <tbody>
              {habitat.sites.map((s) => (
                <tr key={s.site_id}>
                  <td>{s.site_name}</td>
                  <td>{s.habitat_type || "-"}</td>
                  <td>{s.habitat_health_score}</td>
                  <td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {recommendations && recommendations.recommendations.length > 0 && (
        <>
          <h3 className="dl-section-title">Conservation Recommendations</h3>
          <div className="dl-card-list">
            {recommendations.recommendations.map((r, i) => (
              <div className="dl-card" key={i}>
                <strong>{r.priority} — {r.category}</strong>
                <p style={{ margin: "4px 0 0" }}>{r.recommendation}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default Reports;