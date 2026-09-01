import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import * as XLSX from "xlsx";

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
      .catch((err) =>
        setError(
          err.response?.data?.detail || "Failed to load report."
        )
      )
      .finally(() => setLoading(false));

    api
      .get("/ecosystem-health/score")
      .then((res) => setEcosystem(res.data))
      .catch(() => {});

    api
      .get("/population/estimates")
      .then((res) => setPopulation(res.data))
      .catch(() => {});

    api
      .get("/habitat/intelligence")
      .then((res) => setHabitat(res.data))
      .catch(() => {});

    api
      .get("/conservation-recommendations/")
      .then((res) => setRecommendations(res.data))
      .catch(() => {});
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
    doc.text(
      `Total Observations: ${report.total_observations}`,
      14,
      36
    );
    doc.text(
      `Species Richness: ${report.biodiversity.species_richness}`,
      14,
      43
    );
    doc.text(
      `Shannon Index: ${report.biodiversity.shannon_index}`,
      14,
      50
    );

    let y = 60;

    doc.setFontSize(13);
    doc.text("Recent Image Detections", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Species", "Confidence", "Endangered", "Detected At"]],
      body: report.recent_image_detections.map((d) => [
        d.species,
        `${(d.confidence * 100).toFixed(1)}%`,
        d.is_endangered ? "Yes" : "No",
        new Date(d.detected_at).toLocaleString(),
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
      head: [
        [
          "Species",
          "Confidence",
          "Call Type",
          "Endangered",
          "Detected At",
        ],
      ],
      body: report.recent_audio_detections.map((d) => [
        d.species,
        `${(d.confidence * 100).toFixed(1)}%`,
        d.call_type || "-",
        d.is_endangered ? "Yes" : "No",
        new Date(d.detected_at).toLocaleString(),
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
      doc.text(
        `Overall Score: ${ecosystem.overall_score} (${ecosystem.status})`,
        14,
        y
      );

      y += 5;

      doc.text(
        `${ecosystem.endangered_detections} of ${ecosystem.total_detections} detections flagged as endangered.`,
        14,
        y
      );

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
          s.species_name,
          s.population_count,
          s.sites_observed,
          s.trend.replace("_", " "),
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
        head: [
          ["Site", "Habitat Type", "Health Score", "Status"],
        ],
        body: habitat.sites.map((s) => [
          s.site_name,
          s.habitat_type || "-",
          s.habitat_health_score,
          s.status,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 138, 95] },
      });

      y = doc.lastAutoTable.finalY + 12;
    }

    if (
      recommendations &&
      recommendations.recommendations.length > 0
    ) {
      doc.setFontSize(13);
      doc.text("Conservation Recommendations", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Priority", "Category", "Recommendation"]],
        body: recommendations.recommendations.map((r) => [
          r.priority,
          r.category,
          r.recommendation,
        ]),
        styles: {
          fontSize: 8,
          cellWidth: "wrap",
        },
        headStyles: {
          fillColor: [15, 138, 95],
        },
        columnStyles: {
          2: {
            cellWidth: 110,
          },
        },
      });
    }

    doc.save(
      `wildlife-monitoring-report-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    );
  };

  const handleDownloadExcel = () => {
    if (!report) return;

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        report.recent_image_detections.map((d) => ({
          Species: d.species,
          "Confidence %": (d.confidence * 100).toFixed(1),
          Endangered: d.is_endangered ? "Yes" : "No",
          "Detected At": new Date(
            d.detected_at
          ).toLocaleString(),
        }))
      ),
      "Image Detections"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        report.recent_audio_detections.map((d) => ({
          Species: d.species,
          "Confidence %": (d.confidence * 100).toFixed(1),
          "Call Type": d.call_type || "-",
          Endangered: d.is_endangered ? "Yes" : "No",
          "Detected At": new Date(
            d.detected_at
          ).toLocaleString(),
        }))
      ),
      "Audio Detections"
    );

    if (population?.species_population?.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          population.species_population.map((s) => ({
            Species: s.species_name,
            Population: s.population_count,
            Sites: s.sites_observed,
            Trend: s.trend.replace("_", " "),
          }))
        ),
        "Population"
      );
    }

    if (habitat?.sites?.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          habitat.sites.map((s) => ({
            Site: s.site_name,
            "Habitat Type": s.habitat_type || "-",
            "Health Score": s.habitat_health_score,
            Status: s.status,
          }))
        ),
        "Habitat"
      );
    }

    if (recommendations?.recommendations?.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          recommendations.recommendations.map((r) => ({
            Priority: r.priority,
            Category: r.category,
            Recommendation: r.recommendation,
          }))
        ),
        "Recommendations"
      );
    }

    XLSX.writeFile(
      wb,
      `wildlife-monitoring-report-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Wildlife Monitoring Report">
        <p>Loading report...</p>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Wildlife Monitoring Report">
        <p style={{ color: "var(--dl-red)" }}>{error}</p>
      </DashboardLayout>
    );
  }

  if (!report) return null;

  return (
    <DashboardLayout title="Wildlife Monitoring Report">
      <button
        className="secondary"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <button
        onClick={handleDownloadPDF}
        style={{ marginLeft: "12px" }}
      >
        ⬇ Download PDF
      </button>

      <button
        onClick={handleDownloadExcel}
        style={{ marginLeft: "8px" }}
      >
        ⬇ Download Excel
      </button>

      <div
        className="stat-grid"
        style={{ marginTop: "20px" }}
      >
        <StatCard
          label="Total Observations"
          value={report.total_observations}
        />

        <StatCard
          label="Species Richness"
          value={report.biodiversity.species_richness}
        />

        <StatCard
          label="Shannon Index"
          value={report.biodiversity.shannon_index}
        />

        {ecosystem && (
          <StatCard
            label="Ecosystem Health"
            value={`${ecosystem.overall_score} — ${ecosystem.status}`}
          />
        )}
      </div>

      <div
        className="panel-title"
        style={{ marginTop: 24 }}
      >
        Recent Image Detections
      </div>

      {report.recent_image_detections.length === 0 ? (
        <p
          style={{
            color: "var(--dl-text-dim)",
            fontSize: 13.5,
          }}
        >
          No image detections yet.
        </p>
      ) : (
        <table className="dl-table">
          <thead>
            <tr>
              <th>Species</th>
              <th>Confidence</th>
              <th>Endangered</th>
              <th>Detected At</th>
            </tr>
          </thead>

          <tbody>
            {report.recent_image_detections.map((d, i) => (
              <tr key={i}>
                <td>{d.species}</td>
                <td>
                  {(d.confidence * 100).toFixed(1)}%
                </td>
                <td>
                  {d.is_endangered ? (
                    <StatusBadge status="Endangered" />
                  ) : (
                    "No"
                  )}
                </td>
                <td>
                  {new Date(
                    d.detected_at
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div
        className="panel-title"
        style={{ marginTop: 24 }}
      >
        Recent Audio Detections
      </div>

      {report.recent_audio_detections.length === 0 ? (
        <p
          style={{
            color: "var(--dl-text-dim)",
            fontSize: 13.5,
          }}
        >
          No audio detections yet.
        </p>
      ) : (
        <table className="dl-table">
          <thead>
            <tr>
              <th>Species</th>
              <th>Confidence</th>
              <th>Call Type</th>
              <th>Endangered</th>
              <th>Detected At</th>
            </tr>
          </thead>

          <tbody>
            {report.recent_audio_detections.map((d, i) => (
              <tr key={i}>
                <td>{d.species}</td>
                <td>
                  {(d.confidence * 100).toFixed(1)}%
                </td>
                <td>{d.call_type || "-"}</td>
                <td>
                  {d.is_endangered ? (
                    <StatusBadge status="Endangered" />
                  ) : (
                    "No"
                  )}
                </td>
                <td>
                  {new Date(
                    d.detected_at
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {population &&
        population.species_population.length > 0 && (
          <>
            <div
              className="panel-title"
              style={{ marginTop: 24 }}
            >
              Population Estimates
            </div>

            <table className="dl-table">
              <thead>
                <tr>
                  <th>Species</th>
                  <th>Population</th>
                  <th>Sites</th>
                  <th>Trend</th>
                </tr>
              </thead>

              <tbody>
                {population.species_population.map((s) => (
                  <tr key={s.species_name}>
                    <td>{s.species_name}</td>
                    <td>{s.population_count}</td>
                    <td>{s.sites_observed}</td>
                    <td>
                      {s.trend.replace("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

      {habitat && habitat.sites.length > 0 && (
        <>
          <div
            className="panel-title"
            style={{ marginTop: 24 }}
          >
            Habitat Health by Site
          </div>

          <table className="dl-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Habitat Type</th>
                <th>Health Score</th>
                <th>Status</th>
              </tr>
            </thead>

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

      {recommendations &&
        recommendations.recommendations.length > 0 && (
          <>
            <div
              className="panel-title"
              style={{ marginTop: 24 }}
            >
              Conservation Recommendations
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {recommendations.recommendations.map((r, i) => (
                <div className="alert-row" key={i}>
                  <div style={{ flex: 1 }}>
                    <strong>
                      {r.priority} — {r.category}
                    </strong>

                    <p style={{ margin: "4px 0 0" }}>
                      {r.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
    </DashboardLayout>
  );
}

export default Reports;