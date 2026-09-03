import React, { useEffect, useState } from "react";
import { listMonitoringSites } from "../api/surveys";
import { generateRecommendations, listRecommendations, updateRecommendationStatus } from "../api/conservation";

const PRIORITY_STYLES = {
  low: "bg-gray-100 text-gray-600 border-gray-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

const CATEGORY_LABELS = {
  patrol_allocation: "Patrol Allocation",
  habitat_restoration: "Habitat Restoration",
  endangered_species_protection: "Endangered Species Protection",
  monitoring_optimization: "Monitoring Optimization",
  resource_allocation: "Resource Allocation",
};

const STATUS_OPTIONS = ["open", "in_progress", "resolved"];

export default function ConservationRecommendations() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listMonitoringSites().then((res) => setSites(res.data));
  }, []);

  const loadRecommendations = async (siteId) => {
    const res = await listRecommendations(siteId);
    setRecommendations(res.data);
  };

  const handleSiteChange = async (siteId) => {
    setSelectedSite(siteId);
    setError("");
    if (siteId) await loadRecommendations(siteId);
  };

  const handleGenerate = async () => {
    if (!selectedSite) return;
    setLoading(true);
    setError("");
    try {
      await generateRecommendations(selectedSite);
      await loadRecommendations(selectedSite);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (recId, newStatus) => {
    try {
      await updateRecommendationStatus(recId, newStatus);
      await loadRecommendations(selectedSite);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update status.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Conservation Recommendation Engine</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Rule-based, auditable recommendations generated from the Biodiversity, Habitat,
        and Population Intelligence Engines' latest outputs for a site.
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
          onClick={handleGenerate}
          disabled={!selectedSite || loading}
          className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Recommendations"}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-4">{error}</div>}

      {recommendations.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
          {selectedSite
            ? 'No recommendations yet — click "Generate Recommendations" above. For best results, run Biodiversity, Habitat, and Population assessments for this site first.'
            : "Select a monitoring site to view or generate recommendations."}
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`bg-white rounded-xl shadow border-l-4 p-5 ${PRIORITY_STYLES[rec.priority]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase ${PRIORITY_STYLES[rec.priority]}`}
                    >
                      {rec.priority}
                    </span>
                    <span className="text-xs text-gray-400">
                      {CATEGORY_LABELS[rec.category] || rec.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{rec.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  {rec.rationale && (
                    <p className="text-xs text-gray-400 mt-2 italic">Why: {rec.rationale}</p>
                  )}
                </div>
                <select
                  className="text-sm border rounded px-2 py-1 shrink-0"
                  value={rec.is_resolved}
                  onChange={(e) => handleStatusChange(rec.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
