import React, { useEffect, useState } from "react";
import { listMonitoringSites } from "../api/surveys";
import { runPopulationAssessment, getLatestPopulationEstimates } from "../api/population";
import { runHabitatAssessment, getLatestHabitatAssessment } from "../api/habitat";

const TREND_STYLES = {
  increasing: "bg-green-100 text-green-700",
  stable: "bg-blue-100 text-blue-700",
  declining: "bg-red-100 text-red-700",
  insufficient_data: "bg-gray-100 text-gray-600",
};

const DEGRADATION_STYLES = {
  stable: "bg-green-100 text-green-700",
  at_risk: "bg-yellow-100 text-yellow-700",
  degrading: "bg-red-100 text-red-700",
  unknown: "bg-gray-100 text-gray-600",
};

export default function PopulationHabitat() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [areaSqKm, setAreaSqKm] = useState("");
  const [populationEstimates, setPopulationEstimates] = useState([]);
  const [habitatAssessment, setHabitatAssessment] = useState(null);
  const [loadingPop, setLoadingPop] = useState(false);
  const [loadingHabitat, setLoadingHabitat] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listMonitoringSites().then((res) => setSites(res.data));
  }, []);

  const loadForSite = async (siteId) => {
    try {
      const res = await getLatestPopulationEstimates(siteId);
      setPopulationEstimates(res.data);
    } catch {
      setPopulationEstimates([]);
    }
    try {
      const res = await getLatestHabitatAssessment(siteId);
      setHabitatAssessment(res.data);
    } catch {
      setHabitatAssessment(null);
    }
  };

  const handleSiteChange = async (siteId) => {
    setSelectedSite(siteId);
    setError("");
    if (siteId) await loadForSite(siteId);
  };

  const handleRunPopulation = async () => {
    if (!selectedSite) return;
    setLoadingPop(true);
    setError("");
    try {
      const res = await runPopulationAssessment(selectedSite, areaSqKm ? parseFloat(areaSqKm) : undefined);
      setPopulationEstimates(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to run population assessment.");
    } finally {
      setLoadingPop(false);
    }
  };

  const handleRunHabitat = async () => {
    if (!selectedSite) return;
    setLoadingHabitat(true);
    setError("");
    try {
      const res = await runHabitatAssessment(selectedSite);
      setHabitatAssessment(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to run habitat assessment.");
    } finally {
      setLoadingHabitat(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Population & Habitat Intelligence</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Population Estimation Engine (species counts, density, trend) and Habitat
        Intelligence Engine (vegetation, degradation risk, suitability) — Milestone 3.
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
        <div className="w-full sm:w-40">
          <label className="block text-sm font-medium mb-1">Area (sq km, optional)</label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 12.5"
            className="w-full border rounded px-3 py-2 text-sm"
            value={areaSqKm}
            onChange={(e) => setAreaSqKm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Population Estimation */}
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Population Estimates</h2>
            <button
              onClick={handleRunPopulation}
              disabled={!selectedSite || loadingPop}
              className="bg-forest-600 hover:bg-forest-700 text-white text-sm px-3 py-1.5 rounded font-medium transition disabled:opacity-50"
            >
              {loadingPop ? "Running..." : "Run Assessment"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Derived from observed individual counts — a directional proxy, not a
            mark-recapture estimate. See docs for details.
          </p>
          {populationEstimates.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">
              No population estimates yet for this site.
            </p>
          ) : (
            <div className="space-y-2">
              {populationEstimates.map((p) => (
                <div key={p.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{p.species_common_name}</p>
                      <p className="text-xs text-gray-400 italic">{p.species_scientific_name}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        TREND_STYLES[p.trend_label] || TREND_STYLES.insufficient_data
                      }`}
                    >
                      {p.trend_label.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Est. size: <strong className="text-gray-700">{p.estimated_population_size}</strong></span>
                    {p.population_density != null && (
                      <span>Density: <strong className="text-gray-700">{p.population_density}/km²</strong></span>
                    )}
                    {p.growth_rate_percent != null && (
                      <span>Growth: <strong className="text-gray-700">{p.growth_rate_percent}%</strong></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habitat Intelligence */}
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Habitat Assessment</h2>
            <button
              onClick={handleRunHabitat}
              disabled={!selectedSite || loadingHabitat}
              className="bg-forest-600 hover:bg-forest-700 text-white text-sm px-3 py-1.5 rounded font-medium transition disabled:opacity-50"
            >
              {loadingHabitat ? "Running..." : "Run Assessment"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Proxy-based scoring pending satellite/NDVI integration — see docs for details.
          </p>
          {!habitatAssessment ? (
            <p className="text-gray-400 text-sm py-6 text-center">
              No habitat assessment yet for this site.
            </p>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Degradation Status</span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    DEGRADATION_STYLES[habitatAssessment.degradation_status_label] || DEGRADATION_STYLES.unknown
                  }`}
                >
                  {habitatAssessment.degradation_status_label.replaceAll("_", " ")}
                </span>
              </div>
              <ul className="text-sm space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-500">Habitat Quality Score</span>
                  <span className="font-medium">{habitatAssessment.habitat_quality_score.toFixed(1)}/100</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Vegetation Index (proxy)</span>
                  <span className="font-medium">{habitatAssessment.vegetation_index_proxy.toFixed(1)}/100</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Degradation Risk</span>
                  <span className="font-medium">{habitatAssessment.degradation_risk_score.toFixed(1)}/100</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Habitat Suitability</span>
                  <span className="font-medium">{habitatAssessment.habitat_suitability_score.toFixed(1)}/100</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
