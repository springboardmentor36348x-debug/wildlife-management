import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { StatusBadge } from "../components/Badges";
import EcosystemHealthBadge from "../components/EcosystemHealthBadge";

function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">{label}</p>
      <p className="font-display text-3xl font-semibold text-bark-900 mt-2">{value}</p>
      {hint && <p className="text-xs text-canopy-600 mt-1">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-bark-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

const ROLE_COPY = {
  administrator: {
    title: "Admin Overview",
    subtitle: "Platform-wide activity, users, and monitoring infrastructure.",
  },
  researcher: {
    title: "Researcher Dashboard",
    subtitle: "Species observations, population analytics, biodiversity, and habitat insights.",
  },
  conservation_officer: {
    title: "Conservation Officer Dashboard",
    subtitle: "Threat monitoring, conservation priorities, and restoration recommendations.",
  },
  forest_department: {
    title: "Forest Department Dashboard",
    subtitle: "Protected area coverage, wildlife movement, and patrol planning.",
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [speciesBreakdown, setSpeciesBreakdown] = useState([]);
  const [healthScores, setHealthScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Role-specific extra data
  const [populationCounts, setPopulationCounts] = useState([]);
  const [conservationPriorities, setConservationPriorities] = useState([]);
  const [monitoringOptimization, setMonitoringOptimization] = useState([]);
  const [movement, setMovement] = useState([]);
  const [trend, setTrend] = useState([]);
  const [restorationBySite, setRestorationBySite] = useState({});
  const [habitatBySite, setHabitatBySite] = useState({});
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.listSurveys(),
      api.listAllSites(),
      user.role === "administrator" || user.role === "researcher" ? api.listDatasets() : Promise.resolve([]),
      api.getReportSummary(),
      api.getHealthScoreAllSites().catch(() => []),
      api.getPopulationCounts().catch(() => []),
    ])
      .then(([s, m, d, summary, health, counts]) => {
        setSurveys(s);
        setSites(m);
        setDatasets(d);
        setSpeciesBreakdown(summary.species_breakdown || []);
        setHealthScores(health || []);
        setPopulationCounts(counts || []);

        const topSpecies = (counts || [])[0]?.species;

        if (user.role === "conservation_officer") {
          api.getConservationPriorities().then(setConservationPriorities).catch(() => {});
          if (topSpecies) {
            api.getPopulationTrend(topSpecies, { windowDays: 30 }).then(setTrend).catch(() => {});
          }
          // Restoration suggestions for any site flagged "high" priority
          Promise.all(
            (health || [])
              .filter((h) => h.conservation_status === "Vulnerable" || h.conservation_status === "Critical")
              .slice(0, 5)
              .map((h) =>
                api
                  .getConservationRestoration(h.site_id)
                  .then((actions) => [h.site_id, actions])
                  .catch(() => [h.site_id, []])
              )
          ).then((pairs) => setRestorationBySite(Object.fromEntries(pairs)));
        }

        if (user.role === "forest_department") {
          api.getMonitoringOptimization().then(setMonitoringOptimization).catch(() => {});
          if (topSpecies) {
            api.getPopulationMovement(topSpecies).then(setMovement).catch(() => {});
          }
        }

        if (user.role === "researcher") {
          const activeSurveys = s.filter((sv) => sv.status === "active");
          const recentSurvey = activeSurveys[0] || s[0];
          if (recentSurvey) {
            const surveySites = m.filter((site) => site.survey_id === recentSurvey.id).slice(0, 4);
            Promise.all(
              surveySites.map((site) =>
                api
                  .getHabitatDegradation(site.id)
                  .then((deg) => [site.id, { site, degradation: deg }])
                  .catch(() => [site.id, { site, degradation: null }])
              )
            ).then((pairs) => setHabitatBySite(Object.fromEntries(pairs)));
          }
        }

        if (user.role === "forest_department" || user.role === "administrator") {
          api.listReportRecords(8).then(setRecentRecords).catch(() => {});
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user.role]);

  const copy = ROLE_COPY[user.role] || ROLE_COPY.researcher;
  const activeSurveys = surveys.filter((s) => s.status === "active").length;

  const avgHealthScore = healthScores.length
    ? Math.round(
        (healthScores.reduce((sum, h) => sum + (h.ecosystem_health_score || 0), 0) / healthScores.length) * 10
      ) / 10
    : null;
  const threatenedSites = healthScores.filter(
    (h) => h.conservation_status === "Vulnerable" || h.conservation_status === "Critical"
  );

  const protectedAreaGroups = sites.reduce((acc, site) => {
    const key = site.protected_area || "Unassigned";
    acc[key] = acc[key] || [];
    acc[key].push(site);
    return acc;
  }, {});

  const siteHealthById = Object.fromEntries(healthScores.map((h) => [h.site_id, h]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-bark-900">{copy.title}</h1>
        <p className="text-canopy-700 text-sm mt-1">{copy.subtitle}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Surveys" value={loading ? "…" : surveys.length} hint={`${activeSurveys} active`} />
        <StatCard label="Monitoring Sites" value={loading ? "…" : sites.length} hint="Camera / drone / audio nodes" />
        <StatCard
          label="Registered Datasets"
          value={loading ? "…" : datasets.length}
          hint="External training sources"
        />
        <StatCard
          label="Avg. Ecosystem Health"
          value={loading ? "…" : avgHealthScore ?? "—"}
          hint={avgHealthScore ? `Across ${healthScores.length} site(s)` : "No scored sites yet"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Recent Surveys">
          {surveys.length === 0 && !loading && <p className="text-sm text-canopy-600">No surveys registered yet.</p>}
          <ul className="divide-y divide-canopy-100">
            {surveys.slice(0, 6).map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-bark-900">{s.name}</p>
                  <p className="text-xs text-canopy-600">{s.protected_area || "No protected area set"}</p>
                </div>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Monitoring Sites">
          {sites.length === 0 && !loading && (
            <p className="text-sm text-canopy-600">No monitoring sites registered yet.</p>
          )}
          <ul className="divide-y divide-canopy-100">
            {sites.slice(0, 6).map((site) => (
              <li key={site.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-bark-900">{site.site_name}</p>
                  <p className="text-xs text-canopy-600">
                    {site.habitat_type.replace("_", " ")} · {site.monitoring_device.replace("_", " ")} ·{" "}
                    {site.latitude.toFixed(3)}, {site.longitude.toFixed(3)}
                  </p>
                </div>
                {siteHealthById[site.id] && (
                  <EcosystemHealthBadge
                    score={siteHealthById[site.id].ecosystem_health_score}
                    status={siteHealthById[site.id].conservation_status}
                    size="sm"
                  />
                )}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Species Detected"
          action={
            <Link to="/species-recognition" className="text-xs text-canopy-700 hover:underline font-medium">
              Run species recognition →
            </Link>
          }
        >
          {speciesBreakdown.length === 0 && !loading && (
            <p className="text-sm text-canopy-600">
              No species detected yet — upload a camera trap image or audio clip on the Species Recognition page to
              get started.
            </p>
          )}
          {speciesBreakdown.length > 0 && (
            <ul className="space-y-2.5">
              {speciesBreakdown.map((item) => {
                const max = speciesBreakdown[0].count || 1;
                const widthPct = Math.max(8, Math.round((item.count / max) * 100));
                return (
                  <li key={item.species} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-sm text-bark-900 capitalize truncate">{item.species}</span>
                    <div className="flex-1 bg-canopy-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-ochre-400 h-3 rounded-full" style={{ width: `${widthPct}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm font-medium text-canopy-700">{item.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* ---- RESEARCHER additions ---- */}
        {user.role === "researcher" && (
          <>
            <SectionCard title="Population Analytics">
              {populationCounts.length === 0 && !loading && (
                <p className="text-sm text-canopy-600">No population data yet.</p>
              )}
              <ul className="divide-y divide-canopy-100">
                {populationCounts.slice(0, 6).map((row) => (
                  <li key={row.species} className="py-2 flex items-center justify-between text-sm">
                    <span className="capitalize text-bark-900">{row.species}</span>
                    <span className="text-canopy-700 font-medium">{row.count} observations</span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Biodiversity Reports">
              {healthScores.length === 0 && !loading && (
                <p className="text-sm text-canopy-600">No biodiversity scores yet.</p>
              )}
              <ul className="space-y-2">
                {healthScores.slice(0, 6).map((h) => (
                  <li key={h.site_id} className="flex items-center justify-between text-sm">
                    <span className="text-bark-900">
                      Species diversity score: {h.components?.species_diversity?.score ?? "—"}
                    </span>
                    <EcosystemHealthBadge score={h.ecosystem_health_score} status={h.conservation_status} size="sm" />
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Habitat Insights" >
              <p className="text-xs text-canopy-600 mb-3">
                Degradation proxy for your most recently active survey's sites.
              </p>
              {Object.keys(habitatBySite).length === 0 && !loading && (
                <p className="text-sm text-canopy-600">No sites to show habitat insights for yet.</p>
              )}
              <ul className="divide-y divide-canopy-100">
                {Object.values(habitatBySite).map(({ site, degradation }) => (
                  <li key={site.id} className="py-2 flex items-center justify-between text-sm">
                    <span className="text-bark-900">{site.site_name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        degradation?.status === "declining"
                          ? "bg-red-100 text-red-700"
                          : degradation?.status === "stable"
                          ? "bg-canopy-100 text-canopy-700"
                          : "bg-canopy-50 text-canopy-500"
                      }`}
                    >
                      {degradation?.status || "insufficient_data"}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </>
        )}

        {/* ---- CONSERVATION OFFICER additions ---- */}
        {user.role === "conservation_officer" && (
          <>
            <SectionCard title="Threat Monitoring">
              {threatenedSites.length === 0 && !loading && (
                <p className="text-sm text-canopy-600">No sites currently flagged Vulnerable or Critical.</p>
              )}
              <ul className="divide-y divide-canopy-100">
                {threatenedSites.map((h) => {
                  const site = sites.find((s) => s.id === h.site_id);
                  return (
                    <li key={h.site_id} className="py-2 flex items-center justify-between text-sm">
                      <span className="text-bark-900">{site?.site_name || h.site_id.slice(0, 8)}</span>
                      <EcosystemHealthBadge score={h.ecosystem_health_score} status={h.conservation_status} size="sm" />
                    </li>
                  );
                })}
              </ul>
            </SectionCard>

            <SectionCard title="Conservation Priorities">
              {conservationPriorities.length === 0 && !loading && (
                <p className="text-sm text-canopy-600">No priority data yet.</p>
              )}
              <ul className="divide-y divide-canopy-100">
                {conservationPriorities.slice(0, 6).map((p) => (
                  <li key={p.site_id} className="py-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-bark-900">{p.site_name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          p.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : p.priority === "medium"
                            ? "bg-ochre-400/20 text-ochre-600"
                            : "bg-canopy-100 text-canopy-700"
                        }`}
                      >
                        {p.priority}
                      </span>
                    </div>
                    <p className="text-xs text-canopy-600 mt-0.5">{p.reasoning}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Species Trend Analysis">
              {trend.length === 0 && !loading && (
                <p className="text-sm text-canopy-600">
                  Not enough time-spread observation data yet to show a real trend.
                </p>
              )}
              {trend.length > 0 && (
                <ul className="space-y-1.5">
                  {trend.map((t) => (
                    <li key={t.date} className="flex items-center justify-between text-sm">
                      <span className="text-canopy-700">{t.date}</span>
                      <span className="text-bark-900 font-medium">{t.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Restoration Recommendations">
              {Object.values(restorationBySite).every((a) => a.length === 0) && !loading && (
                <p className="text-sm text-canopy-600">No restoration actions triggered right now.</p>
              )}
              <ul className="space-y-3">
                {Object.entries(restorationBySite).map(([siteId, actions]) =>
                  actions.length > 0 ? (
                    <li key={siteId}>
                      <p className="text-xs font-medium text-bark-900 mb-1">
                        {sites.find((s) => s.id === siteId)?.site_name || siteId.slice(0, 8)}
                      </p>
                      <ul className="text-xs text-canopy-700 list-disc list-inside space-y-0.5">
                        {actions.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </li>
                  ) : null
                )}
              </ul>
            </SectionCard>
          </>
        )}

        {/* ---- FOREST DEPARTMENT additions ---- */}
        {user.role === "forest_department" && (
          <>
            <SectionCard title="Protected Area Monitoring">
              <ul className="space-y-3">
                {Object.entries(protectedAreaGroups).map(([area, areaSites]) => (
                  <li key={area}>
                    <p className="text-xs font-medium text-bark-900">{area}</p>
                    <p className="text-xs text-canopy-600">{areaSites.length} monitoring site(s)</p>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Wildlife Movement Analysis">
              {movement.length === 0 && !loading && (
                <p className="text-sm text-canopy-600">No cross-site movement proxy data yet.</p>
              )}
              <ul className="divide-y divide-canopy-100">
                {movement.map((m) => (
                  <li key={m.site_id} className="py-2 text-sm">
                    <p className="text-bark-900">{m.site_name}</p>
                    <p className="text-xs text-canopy-600">
                      First observed {m.first_observed_at} · {m.observation_count} observation(s)
                    </p>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Patrol Planning">
              <p className="text-xs text-canopy-600 mb-3">Sites needing more coverage, from the monitoring-optimization engine.</p>
              <ul className="divide-y divide-canopy-100">
                {monitoringOptimization
                  .filter((m) => m.suggestion.includes("more monitoring"))
                  .map((m) => (
                    <li key={m.site_id} className="py-2 text-sm">
                      <p className="text-bark-900">{m.site_name}</p>
                      <p className="text-xs text-canopy-600">{m.suggestion}</p>
                    </li>
                  ))}
                {monitoringOptimization.filter((m) => m.suggestion.includes("more monitoring")).length === 0 &&
                  !loading && <p className="text-sm text-canopy-600">No under-covered sites flagged right now.</p>}
              </ul>
            </SectionCard>

            <SectionCard
              title="Incident Reports"
              action={
                <Link to="/reports" className="text-xs text-canopy-700 hover:underline font-medium">
                  View all →
                </Link>
              }
            >
              {recentRecords.length === 0 && !loading && <p className="text-sm text-canopy-600">No records yet.</p>}
              <ul className="divide-y divide-canopy-100">
                {recentRecords.slice(0, 6).map((r) => (
                  <li key={r.record_id} className="py-2 flex items-center justify-between text-sm">
                    <span className="text-bark-900">
                      {r.record_id} · {r.source}
                    </span>
                    <span className="text-xs text-canopy-600 capitalize">{r.status}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
