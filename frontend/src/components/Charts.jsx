import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function SpeciesDistributionBarChart({ data = [] }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const labels = data.map((d) => d.species.charAt(0).toUpperCase() + d.species.slice(1));
    const counts = data.map((d) => d.count);

    chartInstanceRef.current = new ChartJS(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Confirmed Observations",
            data: counts,
            backgroundColor: "rgba(45, 106, 79, 0.85)",
            hoverBackgroundColor: "rgba(27, 67, 50, 1)",
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1b4332",
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: "Inter", size: 11 }, color: "#4a5568" },
          },
          y: {
            beginAtZero: true,
            grid: { color: "#e2e8f0" },
            ticks: { font: { family: "Inter", size: 11 }, color: "#4a5568", stepSize: 1 },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [data]);

  return (
    <div className="w-full h-64">
      {data.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-xs text-canopy-600">
          No species detection data available
        </div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
}

export function PopulationTrendLineChart({ trendData = [], speciesLabel = "Species" }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const labels = trendData.map((d) => d.date);
    const counts = trendData.map((d) => d.count);

    chartInstanceRef.current = new ChartJS(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${speciesLabel} Daily Detections`,
            data: counts,
            borderColor: "#d97706",
            backgroundColor: "rgba(217, 119, 6, 0.15)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#b45309",
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: { font: { family: "Inter", size: 11, weight: "600" }, color: "#1e293b" },
          },
          tooltip: {
            backgroundColor: "#1b4332",
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: "Inter", size: 10 }, color: "#64748b" },
          },
          y: {
            beginAtZero: true,
            grid: { color: "#e2e8f0" },
            ticks: { stepSize: 1, font: { family: "Inter", size: 10 }, color: "#64748b" },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [trendData, speciesLabel]);

  return (
    <div className="w-full h-64">
      {trendData.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-xs text-canopy-600">
          Not enough longitudinal telemetry data to render trend curve
        </div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
}

export function BiodiversityRadarChart({ components = {} }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const labels = [
      "Species Diversity (30%)",
      "Population Stability (25%)",
      "Habitat Quality (20%)",
      "Endangered Status (15%)",
      "Environment (10%)",
    ];

    const values = [
      components?.species_diversity?.score ?? 50,
      components?.population_stability?.score ?? 50,
      components?.habitat_quality?.score ?? 50,
      components?.endangered_species_status?.score ?? 50,
      components?.environmental_conditions?.score ?? 50,
    ];

    chartInstanceRef.current = new ChartJS(canvasRef.current, {
      type: "radar",
      data: {
        labels,
        datasets: [
          {
            label: "Score (0-100)",
            data: values,
            backgroundColor: "rgba(16, 185, 129, 0.25)",
            borderColor: "#10b981",
            borderWidth: 2,
            pointBackgroundColor: "#047857",
            pointBorderColor: "#fff",
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20, font: { size: 9 }, backdropColor: "transparent" },
            pointLabels: { font: { family: "Inter", size: 10, weight: "500" }, color: "#334155" },
            grid: { color: "#cbd5e1" },
            angleLines: { color: "#e2e8f0" },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [components]);

  return (
    <div className="w-full h-64">
      <canvas ref={canvasRef} />
    </div>
  );
}

export function DeviceStatusDoughnutChart({ summary = { online: 0, low_battery: 0, offline: 0 } }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const data = [summary.online || 0, summary.low_battery || 0, summary.offline || 0];

    chartInstanceRef.current = new ChartJS(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Online", "Low Battery", "Offline"],
        datasets: [
          {
            data,
            backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
            hoverBackgroundColor: ["#059669", "#d97706", "#dc2626"],
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { family: "Inter", size: 11 }, padding: 12, boxWidth: 12 },
          },
          tooltip: {
            backgroundColor: "#1b4332",
            padding: 8,
            cornerRadius: 6,
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [summary]);

  return (
    <div className="w-full h-52">
      <canvas ref={canvasRef} />
    </div>
  );
}
