import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import GisMap from "../../components/GisMap";
import {
  SpeciesDistributionBarChart,
  PopulationTrendLineChart,
  BiodiversityRadarChart,
} from "../../components/Charts";
import EcosystemHealthBadge from "../../components/EcosystemHealthBadge";
import {
  Search,
  Filter,
  PawPrint,
  TrendingUp,
  Layers,
  Trees,
  Compass,
  FileText,
  Volume2,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function ResearcherDashboard() {
  const [activeTab, setActiveTab] = useState("observations"); // observations | population | biodiversity | habitat

  // Live data states
  const [observations, setObservations] = useState([]);
  const [populationCounts, setPopulationCounts] = useState([]);
  const [densityData, setDensityData] = useState([]);
  const [healthScores, setHealthScores] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState("elephant");
  const [trendData, setTrendData] = useState([]);
  const [suitabilityData, setSuitabilityData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Observations filter state
  const [obsFilterType, setObsFilterType] = useState("all");
  const [obsSearch, setObsSearch] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([
      api.listObservations(),
      api.getPopulationCounts(),
      api.getPopulationDensity(),
      api.getHealthScoreAllSites(),
      api.listSurveys(),
      api.listAllSites(),
    ])
      .then(([obs, pop, density, health, surv, st]) => {
        setObservations(obs || []);
        setPopulationCounts(pop || []);
        setDensityData(density || []);
        setHealthScores(health || []);
        setSurveys(surv || []);
        setSites(st || []);

        if (pop && pop.length > 0) {
          const topSp = pop[0].species;
          setSelectedSpecies(topSp);
          api.getPopulationTrend(topSp, { windowDays: 60 }).then(setTrendData).catch(() => {});
        }

        // Preload suitability for sites
        if (st && st.length > 0) {
          Promise.all(
            st.slice(0, 6).map((site) =>
              api
                .getHabitatSuitability(site.id, "elephant")
                .then((res) => [site.id, res])
                .catch(() => [site.id, null])
            )
          ).then((pairs) => setSuitabilityData(Object.fromEntries(pairs)));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSpeciesChange = (species) => {
    setSelectedSpecies(species);
    api.getPopulationTrend(species, { windowDays: 60 }).then(setTrendData).catch(() => {});
  };

  // Filtered observations
  const filteredObservations = observations.filter((obs) => {
    if (obsFilterType !== "all" && obs.observation_type !== obsFilterType) return false;
    if (selectedSiteId && obs.site_id !== selectedSiteId) return false;
    if (obsSearch) {
      const matchLabel = obs.species_label && obs.species_label.toLowerCase().includes(obsSearch.toLowerCase());
      const matchNotes = obs.notes && obs.notes.toLowerCase().includes(obsSearch.toLowerCase());
      const matchId = obs.id.includes(obsSearch);
      if (!matchLabel && !matchNotes && !matchId) return false;
    }
    return true;
  });

  const confirmedCount = observations.filter((o) => o.species_label).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-canopy-900 via-canopy-800 to-canopy-900 p-6 rounded-2xl text-white shadow-sm border border-canopy-700">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-ochre-400/20 text-ochre-300 rounded-lg">
              <PawPrint className="w-5 h-5" />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight">Wildlife Researcher Dashboard</h1>
          </div>
          <p className="text-canopy-200 text-sm mt-1 max-w-2xl">
            Multi-modal observation telemetry, bioacoustic classifications, longitudinal population modeling, and habitat insights.
          </p>
        </div>

        {/* View switcher tabs */}
        <div className="flex flex-wrap items-center bg-canopy-950/60 p-1.5 rounded-xl border border-canopy-700/60 self-start md:self-auto">
          {[
            { key: "observations", label: "Species Observations", icon: PawPrint },
            { key: "population", label: "Population Analytics", icon: TrendingUp },
            { key: "biodiversity", label: "Biodiversity Reports", icon: Sparkles },
            { key: "habitat", label: "Habitat Insights", icon: Trees },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === key
                  ? "bg-ochre-400 text-bark-950 shadow-md"
                  : "text-canopy-200 hover:text-white hover:bg-canopy-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-canopy-100 text-canopy-800 rounded-xl">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Observations</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{observations.length}</p>
            <p className="text-[11px] text-canopy-700">{confirmedCount} AI confirmed</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-ochre-400/20 text-ochre-600 rounded-xl">
            <PawPrint className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Species Detected</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{populationCounts.length}</p>
            <p className="text-[11px] text-canopy-700">Across {sites.length} sites</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Health Index</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">
              {healthScores.length
                ? Math.round(
                    (healthScores.reduce((sum, h) => sum + (h.ecosystem_health_score || 0), 0) /
                      healthScores.length) *
                      10
                  ) / 10
                : "—"}
            </p>
            <p className="text-[11px] text-emerald-700">Average ecosystem score</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Active Surveys</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">
              {surveys.filter((s) => s.status === "active").length}
            </p>
            <p className="text-[11px] text-blue-700">{surveys.length} registered total</p>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: SPECIES OBSERVATIONS ================= */}
      {activeTab === "observations" && (
        <div className="space-y-6">
          <div className="card p-5">
            {/* Filter toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-canopy-100">
              <div>
                <h2 className="font-display font-bold text-bark-900 text-lg">Confirmed Species Detections</h2>
                <p className="text-xs text-canopy-600">
                  Filterable timeline of detections from YOLOv8 vision and YAMNet bioacoustic models.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-canopy-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={obsSearch}
                    onChange={(e) => setObsSearch(e.target.value)}
                    placeholder="Search species or ID..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-canopy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-canopy-500 w-48"
                  />
                </div>

                {/* Type Filter */}
                <select
                  value={obsFilterType}
                  onChange={(e) => setObsFilterType(e.target.value)}
                  className="text-xs bg-white border border-canopy-200 rounded-lg px-2.5 py-1.5 text-bark-800"
                >
                  <option value="all">All Media Types</option>
                  <option value="image">Camera Trap Photos</option>
                  <option value="audio">Bioacoustic Recordings</option>
                </select>

                {/* Site Filter */}
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="text-xs bg-white border border-canopy-200 rounded-lg px-2.5 py-1.5 text-bark-800 max-w-xs truncate"
                >
                  <option value="">All Monitoring Sites</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.site_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Observations Table / Feed */}
            {filteredObservations.length === 0 && !loading && (
              <div className="py-12 text-center text-sm text-canopy-600">
                No observations match the selected filters.
              </div>
            )}

            <div className="divide-y divide-canopy-100 mt-2">
              {filteredObservations.map((obs) => {
                const isImage = obs.observation_type === "image";
                const isAudio = obs.observation_type === "audio";
                const siteName = sites.find((s) => s.id === obs.site_id)?.site_name || "Unassigned Site";

                return (
                  <div key={obs.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-canopy-50/50 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3.5">
                      {/* Media Icon Preview / Thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-canopy-100 border border-canopy-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {isImage ? (
                          <span className="text-xl">📷</span>
                        ) : isAudio ? (
                          <span className="text-xl">🔊</span>
                        ) : (
                          <span className="text-xl">📡</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold text-bark-900 capitalize text-sm">
                            {obs.species_label || "Unclassified Detection"}
                          </span>
                          {obs.confidence_score && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {Math.round(obs.confidence_score * 100)}% confidence
                            </span>
                          )}
                          <span className="text-xs text-canopy-500 font-mono">#{obs.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-xs text-canopy-600 mt-0.5">
                          {siteName} · Captured {new Date(obs.captured_at).toLocaleString()}
                        </p>
                        {obs.notes && <p className="text-xs text-bark-700 italic mt-0.5">"{obs.notes}"</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-canopy-200 text-bark-800 uppercase tracking-wider text-[10px]">
                        {obs.observation_type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: POPULATION ANALYTICS ================= */}
      {activeTab === "population" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Species Count Bar Chart */}
            <div className="card p-5">
              <h2 className="font-display font-bold text-bark-900 text-base mb-1">Confirmed Species Population Distribution</h2>
              <p className="text-xs text-canopy-600 mb-4">Total observation counts per species across all active survey sites.</p>
              <SpeciesDistributionBarChart data={populationCounts} />
            </div>

            {/* Longitudinal Trend Chart */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="font-display font-bold text-bark-900 text-base">Longitudinal Population Trend</h2>
                  <p className="text-xs text-canopy-600">Trailing daily detection frequency for selected species.</p>
                </div>
                <select
                  value={selectedSpecies}
                  onChange={(e) => handleSpeciesChange(e.target.value)}
                  className="bg-white border border-canopy-200 rounded-lg px-2.5 py-1 text-xs capitalize text-bark-900 font-semibold"
                >
                  {populationCounts.map((p) => (
                    <option key={p.species} value={p.species} className="capitalize">
                      {p.species}
                    </option>
                  ))}
                </select>
              </div>
              <PopulationTrendLineChart trendData={trendData} speciesLabel={selectedSpecies.toUpperCase()} />
            </div>
          </div>

          {/* Density Proxy Table */}
          <div className="card p-5">
            <h2 className="font-display font-bold text-bark-900 text-base mb-1">Per-Site Relative Density Proxy</h2>
            <p className="text-xs text-canopy-600 mb-4">Spatial distribution of observed species counts across monitoring sites.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left uppercase text-canopy-600 border-b border-canopy-100 pb-2">
                    <th className="py-2">Monitoring Site</th>
                    <th className="py-2">Species</th>
                    <th className="py-2">Observation Count</th>
                    <th className="py-2">Relative Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canopy-100">
                  {densityData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-canopy-50/50">
                      <td className="py-2.5 font-medium text-bark-900">{row.site_name}</td>
                      <td className="py-2.5 capitalize text-bark-700 font-semibold">{row.species}</td>
                      <td className="py-2.5 text-bark-900 font-bold">{row.count}</td>
                      <td className="py-2.5">
                        <div className="w-32 bg-canopy-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-ochre-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, row.count * 20)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: BIODIVERSITY REPORTS ================= */}
      {activeTab === "biodiversity" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Components Radar Chart */}
            <div className="card p-5 lg:col-span-1">
              <h2 className="font-display font-bold text-bark-900 text-base mb-1">Ecosystem Balance Radar</h2>
              <p className="text-xs text-canopy-600 mb-3">Multi-factor weighted biodiversity dimensions.</p>
              <BiodiversityRadarChart components={healthScores[0]?.components || {}} />
            </div>

            {/* Health Scores by Site */}
            <div className="card p-5 lg:col-span-2">
              <h2 className="font-display font-bold text-bark-900 text-base mb-1">Site Biodiversity & Health Index</h2>
              <p className="text-xs text-canopy-600 mb-4">Calculated ecosystem health status and component scores per site.</p>
              <div className="space-y-3">
                {healthScores.map((h) => {
                  const site = sites.find((s) => s.id === h.site_id);
                  return (
                    <div
                      key={h.site_id}
                      className="p-3.5 bg-canopy-50/60 rounded-xl border border-canopy-100 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-bark-900 text-sm">{site?.site_name || h.site_id.slice(0, 8)}</span>
                          <span className="text-xs text-canopy-600">· {site?.habitat_type || "Habitat"}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-canopy-700">
                          <span>Diversity: <strong>{h.components?.species_diversity?.score ?? "—"}/100</strong></span>
                          <span>Stability: <strong>{h.components?.population_stability?.score ?? "—"}/100</strong></span>
                          <span>Habitat: <strong>{h.components?.habitat_quality?.score ?? "—"}/100</strong></span>
                        </div>
                      </div>

                      <EcosystemHealthBadge
                        score={h.ecosystem_health_score}
                        status={h.conservation_status}
                        size="md"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: HABITAT INSIGHTS ================= */}
      {activeTab === "habitat" && (
        <div className="space-y-6">
          {/* Embedded GIS Map */}
          <GisMap
            height="460px"
            title="Habitat Classification & Spatial Intelligence"
            subtitle="Explore habitat vegetation zones, degradation warnings, and site coverage."
          />

          {/* Habitat Suitability Modeling Cards */}
          <div className="card p-5">
            <h2 className="font-display font-bold text-bark-900 text-base mb-1">Species Habitat Suitability Modeling</h2>
            <p className="text-xs text-canopy-600 mb-4">
              Cross-site correlation between habitat types and verified species occurrences.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sites.slice(0, 6).map((site) => {
                const suit = suitabilityData[site.id];
                const score = suit?.suitability_score ?? 50;
                return (
                  <div key={site.id} className="p-4 bg-white border border-canopy-200 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-bark-900 text-sm truncate">{site.site_name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-canopy-100 text-canopy-800 capitalize">
                        {site.habitat_type}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold font-display text-bark-900">{score}</span>
                      <span className="text-xs text-canopy-600">/100 Suitability Index</span>
                    </div>
                    <div className="w-full bg-canopy-100 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-2 rounded-full ${
                          score >= 70 ? "bg-emerald-600" : score >= 40 ? "bg-ochre-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-canopy-700 leading-tight">
                      {suit?.reasoning || "Predicted compatibility based on habitat classification."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
