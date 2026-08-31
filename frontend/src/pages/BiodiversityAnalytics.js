import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function BiodiversityAnalytics() {
  const [data, setData] = useState([]);
  const [biodiversity, setBiodiversity] = useState(null);

  useEffect(() => {
    api.get("/analytics/observation-trend")
      .then(res => setData(res.data))
      .catch(err => console.log(err));

    api.get("/biodiversity/index")
      .then(res => setBiodiversity(res.data))
      .catch(err => console.log(err));
  }, []);

  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: "Observations per Day",
        data: data.map(item => item.observation_count),
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96,165,250,0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointBackgroundColor: "#3b82f6",
        borderWidth: 3
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#16241d"
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#6b7a72" },
        grid: { color: "rgba(22,36,29,0.06)" }
      },
      y: {
        ticks: { color: "#6b7a72" },
        grid: { color: "rgba(22,36,29,0.06)" },
        beginAtZero: true
      }
    }
  };

  return (
    <DashboardLayout title="Biodiversity Analytics">
    <div className="panel">
      <div className="panel-title">Biodiversity Analytics</div>

      {biodiversity && (
        <div className="stat-grid" style={{ marginBottom: "24px" }}>
          <div style={{
  padding: "24px", borderRadius: "12px", minWidth: "160px",
  background: "linear-gradient(135deg, var(--dl-accent), var(--dl-accent-dark))",
}}>
  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)" }}>Species Richness</div>
  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#fff" }}>{biodiversity.species_richness}</div>
</div>
          <div className="stat-card" style={{ minWidth: "140px" }}>
            <div className="stat-label">Shannon Index</div>
            <div className="stat-value">{biodiversity.shannon_index}</div>
          </div>
          <div className="stat-card" style={{ minWidth: "140px" }}>
            <div className="stat-label">Simpson Index</div>
            <div className="stat-value">{biodiversity.simpson_index}</div>
          </div>
          <div className="stat-card" style={{ minWidth: "140px" }}>
            <div className="stat-label">Evenness</div>
            <div className="stat-value">{biodiversity.evenness}</div>
          </div>
        </div>
      )}

      {data.length > 0 ? (
        <Line data={chartData} options={options} />
      ) : (
        <p style={{ color: "var(--dl-text-dim)" }}>No observation trend data available</p>
      )}

      {biodiversity && biodiversity.species_breakdown.length > 0 && (
        <>
          <div className="panel-title" style={{ marginTop: "32px" }}>Species Count (Bar Chart)</div>
          <Bar
            data={{
              labels: biodiversity.species_breakdown.map((s) => s.species_name),
              datasets: [{
                label: "Observation Count",
                data: biodiversity.species_breakdown.map((s) => s.count),
                backgroundColor: "#0f8a5f",
              }],
            }}
            options={{
              responsive: true,
              plugins: { legend: { labels: { color: "#16241d" } } },
              scales: {
                x: { ticks: { color: "#6b7a72" }, grid: { color: "rgba(22,36,29,0.06)" } },
                y: { ticks: { color: "#6b7a72" }, grid: { color: "rgba(22,36,29,0.06)" }, beginAtZero: true },
              },
            }}
          />

          <div className="panel-title" style={{ marginTop: "32px" }}>Species Breakdown</div>
          <table className="dl-table">
            <thead>
              <tr>
                <th>Species</th>
                <th>Count</th>
                <th>Relative Abundance</th>
              </tr>
            </thead>
            <tbody>
              {biodiversity.species_breakdown.map((s) => (
                <tr key={s.species_name}>
                  <td>{s.species_name}</td>
                  <td>{s.count}</td>
                  <td>{(s.relative_abundance * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
    </DashboardLayout>
  );
}

export default BiodiversityAnalytics;