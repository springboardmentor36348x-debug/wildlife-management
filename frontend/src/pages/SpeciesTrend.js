import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function SpeciesTrend() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/analytics/species-trend")
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  }, []);

  const labels = data.map(item => item.species_name);
  const counts = data.map(item => item.observation_count);

  const colors = [
    "#60a5fa",  // blue
    "#f59e0b",  // orange
    "#10b981",  // green
    "#ef4444",  // red
    "#8b5cf6",  // purple
    "#ec4899",  // pink
    "#14b8a6",  // teal
    "#eab308"   // yellow
  ];

  const barData = {
    labels,
    datasets: [
      {
        label: "Species Observations",
        data: counts,
        backgroundColor: colors.slice(0, labels.length),
        borderRadius: 10
      }
    ]
  };

  const pieData = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: colors.slice(0, labels.length)
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

  const pieOptions = {
    plugins: {
      legend: {
        labels: { color: "#16241d" }
      }
    }
  };

  return (
    <DashboardLayout title="Species Trend">
    <div className="panel">

      <div className="panel-title">Species Trend</div>

      {data.length > 0 ? (
        <>
          <div style={{ marginBottom: "50px" }}>
            <Bar data={barData} options={options} />
          </div>

          <div style={{ maxWidth: "450px", margin: "auto" }}>
            <Pie data={pieData} options={pieOptions} />
          </div>
        </>
      ) : (
        <p style={{ color: "var(--dl-text-dim)" }}>No species data available</p>
      )}
    </div>
    </DashboardLayout>
  );
}

export default SpeciesTrend;