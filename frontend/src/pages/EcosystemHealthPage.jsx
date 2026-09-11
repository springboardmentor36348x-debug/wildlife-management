import { useEffect, useState } from "react";
import { api } from "../api/client";
import EcosystemHealthBadge from "../components/EcosystemHealthBadge";

const COMPONENT_LABELS = {
  species_diversity: "Species Diversity",
  population_stability: "Population Stability",
  habitat_quality: "Habitat Quality",
  endangered_species_status: "Endangered Species Status",
  environmental_conditions: "Environmental Conditions",
};

export default function EcosystemHealthPage() {
  const [sites, setSites] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([api.listAllSites(), api.getHealthScoreAllSites()])
      .then(([s, h]) => {
        setSites(s || []);
        const sorted = [...(h || [])].sort((a, b) => a.ecosystem_health_score - b.ecosystem_health_score);
        setScores(sorted);
        if (sorted.length) setSelectedSiteId(sorted[0].site_id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const siteNameById = Object.fromEntries(sites.map((s) => [s.id, s.site_name]));
  const selected = scores.find((s) => s.site_id === selectedSiteId);
  const avg = scores.length
    ? Math.round((scores.reduce((sum, s) => sum + s.ecosystem_health_score, 0) / scores.length) * 10) / 10
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-bark-900">Ecosystem Health Scoring</h1>
        <p className="text-canopy-700 text-sm mt-1">
          The spec's exact weighted formula — Species Diversity 30% + Population Stability 25% + Habitat Quality
          20% + Endangered Species Status 15% + Environmental Conditions 10% (Milestone 3, Feature E).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Sites Scored</p>
          <p className="font-display text-3xl font-semibold text-bark-900 mt-2">{loading ? "…" : scores.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Average Score</p>
          <p className="font-display text-3xl font-semibold text-bark-900 mt-2">{loading ? "…" : avg ?? "—"}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Vulnerable / Critical</p>
          <p className="font-display text-3xl font-semibold text-bark-900 mt-2">
            {loading
              ? "…"
              : scores.filter((s) => s.conservation_status === "Vulnerable" || s.conservation_status === "Critical")
                  .length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Excellent / Healthy</p>
          <p className="font-display text-3xl font-semibold text-bark-900 mt-2">
            {loading
              ? "…"
              : scores.filter((s) => s.conservation_status === "Excellent" || s.conservation_status === "Healthy")
                  .length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-display font-semibold text-bark-900 mb-1">All Sites — Worst to Best</h2>
          <p className="text-xs text-canopy-600 mb-3">Click a site to see its component breakdown.</p>
          {!loading && scores.length === 0 && (
            <p className="text-sm text-canopy-600">No monitoring sites to score yet.</p>
          )}
          <div className="divide-y divide-canopy-100 max-h-[28rem] overflow-y-auto">
            {scores.map((s) => (
              <button
                key={s.site_id}
                onClick={() => setSelectedSiteId(s.site_id)}
                className={`w-full text-left py-3 px-2 rounded-lg flex items-center justify-between transition-colors ${
                  s.site_id === selectedSiteId ? "bg-canopy-50" : "hover:bg-canopy-50"
                }`}
              >
                <span className="text-sm font-medium text-bark-900">
                  {siteNameById[s.site_id] || s.site_id.slice(0, 8)}
                </span>
                <EcosystemHealthBadge score={s.ecosystem_health_score} status={s.conservation_status} size="sm" />
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-bark-900 mb-1">
            {selected ? siteNameById[selected.site_id] || "Component Breakdown" : "Component Breakdown"}
          </h2>
          {!selected && <p className="text-sm text-canopy-600">Select a site to see its score breakdown.</p>}
          {selected && (
            <div className="space-y-4 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-canopy-700">Overall Ecosystem Health Score</span>
                <EcosystemHealthBadge score={selected.ecosystem_health_score} status={selected.conservation_status} />
              </div>
              {Object.entries(selected.components).map(([key, comp]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-bark-900 font-medium">
                      {COMPONENT_LABELS[key] || key} <span className="text-canopy-500 font-normal">({Math.round(comp.weight * 100)}%)</span>
                    </span>
                    <span className="text-bark-900 font-semibold">{comp.score}</span>
                  </div>
                  <div className="bg-canopy-50 rounded-full h-2 overflow-hidden">
                    <div className="bg-canopy-600 h-full rounded-full" style={{ width: `${comp.score}%` }} />
                  </div>
                  <p className="text-xs text-canopy-600 mt-1">{comp.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
