import React, { useEffect, useState } from "react";
import { listMonitoringSites } from "../api/surveys";
import {
  runBiodiversityAssessment,
  getLatestBiodiversityAssessment,
  getBiodiversityHistory,
} from "../api/biodiversity";

const STATUS_STYLES = {
  Excellent: "bg-green-100 text-green-700",
  Healthy: "bg-lime-100 text-lime-700",
  "Moderate Concern": "bg-yellow-100 text-yellow-700",
  Vulnerable: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

function ScoreBar({ label, value, weightLabel }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>
          {label} <span className="text-gray-400">({weightLabel})</span>
        </span>
        <span className="font-medium text-gray-700">{value.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="bg-forest-500 h-2 rounded-full" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

export default function BiodiversityAnalytics() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [assessment, setAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listMonitoringSites().then((res) => setSites(res.data));
  }, []);

  const loadForSite = async (siteId) => {
    setError("");
    try {
      const latest = await getLatestBiodiversityAssessment(siteId);
      setAssessment(latest.data);
    } catch {
      setAssessment(null);
    }
    const hist = await getBiodiversityHistory(siteId);
    setHistory(hist.data);
  };

  const handleSiteChange = async (siteId) => {
    setSelectedSite(siteId);
    if (siteId) await loadForSite(siteId);
  };

  const handleRunAssessment = async () => {
    if (!selectedSite) return;
    setLoading(true);
    setError("");
    try {
      const res = await runBiodiversityAssessment(selectedSite);
      setAssessment(res.data);
      const hist = await getBiodiversityHistory(selectedSite);
      setHistory(hist.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to run assessment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Biodiversity Intelligence Engine</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Weighted ecosystem health score: Species Diversity (30%) + Population Stability (25%) +
        Habitat Quality (20%) + Endangered Species Status (15%) + Environmental Conditions (10%).
      </p>

      <div className="bg-white rounded-xl shadow p-5 mb-6 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Monitoring Site</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={selectedSite}
            onChange={(e) => handleSiteChange(e.target.value)}
          >
            <option value="">Select a site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleRunAssessment}
          disabled={!selectedSite || loading}
          className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
        >
          {loading ? "Running..." : "Run New Assessment"}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-4">{error}</div>}

      {assessment ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Overall Ecosystem Health</h2>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  STATUS_STYLES[assessment.conservation_status_label] || "bg-gray-100 text-gray-600"
                }`}
              >
                {assessment.conservation_status_label}
              </span>
            </div>
            <p className="text-4xl font-bold text-forest-700 mb-4">
              {assessment.overall_ecosystem_health_score.toFixed(1)}
              <span className="text-lg text-gray-400"> / 100</span>
            </p>
            <ScoreBar label="Species Diversity" value={assessment.species_diversity_score} weightLabel="30%" />
            <ScoreBar label="Population Stability" value={assessment.population_stability_score} weightLabel="25%" />
            <ScoreBar label="Habitat Quality" value={assessment.habitat_quality_score} weightLabel="20%" />
            <ScoreBar label="Endangered Species Status" value={assessment.endangered_species_score} weightLabel="15%" />
            <ScoreBar
              label="Environmental Conditions"
              value={assessment.environmental_conditions_score}
              weightLabel="10%"
            />
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold mb-3">Diversity Metrics</h2>
            <ul className="text-sm space-y-2 mb-6">
              <li className="flex justify-between">
                <span className="text-gray-500">Species Richness</span>
                <span className="font-medium">{assessment.species_richness}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Shannon Diversity Index</span>
                <span className="font-medium">{assessment.shannon_diversity_index}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Simpson Diversity Index</span>
                <span className="font-medium">{assessment.simpson_diversity_index}</span>
              </li>
            </ul>

            <h2 className="font-semibold mb-3">Assessment History ({history.length})</h2>
            {history.length === 0 ? (
              <p className="text-gray-400 text-sm">No prior assessments.</p>
            ) : (
              <ul className="text-sm divide-y">
                {history.map((h) => (
                  <li key={h.id} className="py-2 flex justify-between">
                    <span>{new Date(h.assessed_at).toLocaleString()}</span>
                    <span className="font-medium">{h.overall_ecosystem_health_score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        selectedSite && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            No assessment yet for this site — click "Run New Assessment" to generate one.
          </div>
        )
      )}
    </div>
  );
}
