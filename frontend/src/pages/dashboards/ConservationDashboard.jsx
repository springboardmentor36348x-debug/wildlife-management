import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { PopulationTrendLineChart } from "../../components/Charts";
import EcosystemHealthBadge from "../../components/EcosystemHealthBadge";
import {
  ShieldAlert,
  AlertTriangle,
  ListOrdered,
  TrendingDown,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  Activity,
  Trees,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function ConservationDashboard() {
  const [activeTab, setActiveTab] = useState("threats"); // threats | priorities | trends | restoration

  const [threatAlerts, setThreatAlerts] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [speciesCounts, setSpeciesCounts] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState("elephant");
  const [trendData, setTrendData] = useState([]);
  const [sites, setSites] = useState([]);
  const [restorationActionsBySite, setRestorationActionsBySite] = useState({});
  const [updatingActionId, setUpdatingActionId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([
      api.getThreats().catch(() => []),
      api.getConservationPriorities().catch(() => []),
      api.getPopulationCounts().catch(() => []),
      api.listAllSites().catch(() => []),
    ])
      .then(([threats, prio, counts, st]) => {
        setThreatAlerts(threats || []);
        setPriorities(prio || []);
        setSpeciesCounts(counts || []);
        setSites(st || []);

        if (counts && counts.length > 0) {
          const firstSp = counts[0].species;
          setSelectedSpecies(firstSp);
          api.getPopulationTrend(firstSp, { windowDays: 60 }).then(setTrendData).catch(() => {});
        }

        // Fetch restoration actions for all sites
        if (st && st.length > 0) {
          Promise.all(
            st.map((s) =>
              api
                .getConservationRestoration(s.id)
                .then((actions) => [s.id, actions || []])
                .catch(() => [s.id, []])
            )
          ).then((pairs) => setRestorationActionsBySite(Object.fromEntries(pairs)));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSpeciesSelect = (sp) => {
    setSelectedSpecies(sp);
    api.getPopulationTrend(sp, { windowDays: 60 }).then(setTrendData).catch(() => {});
  };

  const handleUpdateActionStatus = async (siteId, actionId, newStatus) => {
    setUpdatingActionId(actionId);
    try {
      const updated = await api.updateRestorationStatus(actionId, { status: newStatus });
      setRestorationActionsBySite((prev) => {
        const siteActions = prev[siteId] || [];
        const nextSiteActions = siteActions.map((a) => (a.id === actionId ? updated : a));
        return { ...prev, [siteId]: nextSiteActions };
      });
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingActionId(null);
    }
  };

  const criticalThreats = threatAlerts.filter((t) => t.severity === "critical").length;
  const highPriorities = priorities.filter((p) => p.priority === "high").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-canopy-900 to-canopy-800 p-6 rounded-2xl text-white shadow-sm border border-emerald-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight">Conservation Officer Dashboard</h1>
          </div>
          <p className="text-canopy-200 text-sm mt-1 max-w-2xl">
            Real-time threat detection, prioritized site risk matrix, longitudinal trend forecasting, and habitat restoration management.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap items-center bg-canopy-950/70 p-1.5 rounded-xl border border-canopy-700/60 self-start md:self-auto">
          {[
            { key: "threats", label: "Threat Monitoring", icon: ShieldAlert, badge: threatAlerts.length },
            { key: "priorities", label: "Conservation Priorities", icon: ListOrdered, badge: highPriorities },
            { key: "trends", label: "Species Trend Analysis", icon: TrendingDown },
            { key: "restoration", label: "Restoration Actions", icon: Wrench },
          ].map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === key
                  ? "bg-emerald-500 text-white shadow-md"
                  : "text-canopy-200 hover:text-white hover:bg-canopy-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {badge !== undefined && badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === key ? "bg-white text-emerald-800" : "bg-red-500 text-white"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-700 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Active Threats</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{threatAlerts.length}</p>
            <p className="text-[11px] text-red-600 font-semibold">{criticalThreats} critical severity</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-ochre-400/20 text-ochre-600 rounded-xl">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">High Risk Sites</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{highPriorities}</p>
            <p className="text-[11px] text-canopy-700">Out of {priorities.length} monitored sites</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Restoration Tasks</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">
              {Object.values(restorationActionsBySite).reduce((sum, list) => sum + list.length, 0)}
            </p>
            <p className="text-[11px] text-emerald-700">Tracked across sites</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Species Tracked</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{speciesCounts.length}</p>
            <p className="text-[11px] text-blue-700">Active telemetry data</p>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: THREAT MONITORING ================= */}
      {activeTab === "threats" && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-canopy-100">
              <div>
                <h2 className="font-display font-bold text-bark-900 text-lg">Active Environmental Threat Alerts</h2>
                <p className="text-xs text-canopy-600">
                  Real-time algorithmic threat escalation from bioacoustics, camera traps, and habitat degradation models.
                </p>
              </div>
            </div>

            {threatAlerts.length === 0 && !loading && (
              <div className="py-12 text-center text-sm text-canopy-600">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                No active critical threats flagged across monitored sites.
              </div>
            )}

            <div className="space-y-3.5">
              {threatAlerts.map((alert) => {
                const isCrit = alert.severity === "critical";
                const isHigh = alert.severity === "high";

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all ${
                      isCrit
                        ? "bg-red-50/80 border-red-200"
                        : isHigh
                        ? "bg-amber-50/80 border-amber-200"
                        : "bg-canopy-50/80 border-canopy-200"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isCrit
                            ? "bg-red-500 text-white"
                            : isHigh
                            ? "bg-amber-500 text-white"
                            : "bg-canopy-700 text-white"
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display font-bold text-bark-900 text-sm">{alert.title}</h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isCrit
                                ? "bg-red-200 text-red-900"
                                : isHigh
                                ? "bg-amber-200 text-amber-900"
                                : "bg-canopy-200 text-canopy-900"
                            }`}
                          >
                            {alert.severity} severity
                          </span>
                          <span className="text-xs text-canopy-500 font-mono">#{alert.id}</span>
                        </div>
                        <p className="text-xs text-bark-700 mt-1">{alert.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs font-medium text-canopy-800 bg-white/80 px-3 py-1.5 rounded-lg border border-canopy-100 w-fit">
                          <span className="text-ochre-600 font-bold">Recommended Action:</span>
                          <span>{alert.recommended_action}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs text-canopy-600 shrink-0">
                      <p className="font-semibold text-bark-900">{alert.site_name}</p>
                      <p className="text-[11px] mt-0.5">{alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "Real-time"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: CONSERVATION PRIORITIES ================= */}
      {activeTab === "priorities" && (
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-display font-bold text-bark-900 text-lg mb-1">Ranked Site Conservation Priorities</h2>
            <p className="text-xs text-canopy-600 mb-4">
              Rule-based conservation risk ranking synthesized from species diversity counts and habitat degradation status.
            </p>

            <div className="divide-y divide-canopy-100">
              {priorities.map((p) => {
                const isHigh = p.priority === "high";
                const isMed = p.priority === "medium";

                return (
                  <div key={p.site_id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-display font-bold text-bark-900 text-base">{p.site_name}</span>
                        <span
                          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            isHigh
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : isMed
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {p.priority} Priority
                        </span>
                      </div>
                      <p className="text-xs text-canopy-700 mt-1 max-w-3xl leading-relaxed">{p.reasoning}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveTab("restoration")}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>View Restoration</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: SPECIES TREND ANALYSIS ================= */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-canopy-100">
              <div>
                <h2 className="font-display font-bold text-bark-900 text-lg">Species Longitudinal Population Trends</h2>
                <p className="text-xs text-canopy-600">
                  Analyze daily detection patterns and growth trajectories per monitored species.
                </p>
              </div>

              {/* Species selector pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {speciesCounts.map((s) => (
                  <button
                    key={s.species}
                    onClick={() => handleSpeciesSelect(s.species)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      selectedSpecies === s.species
                        ? "bg-canopy-800 text-white shadow-xs"
                        : "bg-canopy-100 text-canopy-700 hover:bg-canopy-200"
                    }`}
                  >
                    {s.species} ({s.count})
                  </button>
                ))}
              </div>
            </div>

            <PopulationTrendLineChart trendData={trendData} speciesLabel={selectedSpecies.toUpperCase()} />
          </div>
        </div>
      )}

      {/* ================= VIEW 4: RESTORATION RECOMMENDATIONS ================= */}
      {activeTab === "restoration" && (
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-display font-bold text-bark-900 text-lg mb-1">Habitat Restoration Action Tracking</h2>
            <p className="text-xs text-canopy-600 mb-4">
              Actionable site restoration suggestions with live workflow status updates (Open &rarr; In Progress &rarr; Completed).
            </p>

            <div className="space-y-6">
              {sites.map((site) => {
                const actions = restorationActionsBySite[site.id] || [];
                if (actions.length === 0) return null;

                return (
                  <div key={site.id} className="p-4 bg-canopy-50/50 rounded-xl border border-canopy-200">
                    <div className="flex items-center justify-between mb-3 border-b border-canopy-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Trees className="w-4 h-4 text-canopy-700" />
                        <h3 className="font-display font-bold text-bark-900 text-sm">{site.site_name}</h3>
                        <span className="text-xs text-canopy-600 capitalize">({site.habitat_type})</span>
                      </div>
                      <span className="text-xs text-canopy-600">{actions.length} Action(s)</span>
                    </div>

                    <div className="space-y-2.5">
                      {actions.map((act) => {
                        const isOpen = act.status === "open";
                        const isInProg = act.status === "in_progress";
                        const isDone = act.status === "completed";

                        return (
                          <div
                            key={act.id}
                            className="p-3 bg-white rounded-lg border border-canopy-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`mt-0.5 p-1 rounded-full ${
                                  isDone
                                    ? "bg-emerald-100 text-emerald-700"
                                    : isInProg
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-canopy-100 text-canopy-600"
                                }`}
                              >
                                {isDone ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              </span>
                              <div>
                                <p className={`text-xs font-medium ${isDone ? "line-through text-canopy-500" : "text-bark-900"}`}>
                                  {act.action_text}
                                </p>
                                <p className="text-[10px] text-canopy-500 mt-0.5">
                                  Updated: {new Date(act.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {/* Status toggle buttons */}
                            <div className="flex items-center gap-1.5 self-end md:self-auto">
                              {["open", "in_progress", "completed"].map((st) => (
                                <button
                                  key={st}
                                  disabled={updatingActionId === act.id}
                                  onClick={() => handleUpdateActionStatus(site.id, act.id, st)}
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${
                                    act.status === st
                                      ? st === "completed"
                                        ? "bg-emerald-600 text-white"
                                        : st === "in_progress"
                                        ? "bg-amber-600 text-white"
                                        : "bg-canopy-800 text-white"
                                      : "bg-canopy-100 text-canopy-700 hover:bg-canopy-200"
                                  }`}
                                >
                                  {st === "in_progress" ? "In Progress" : st.charAt(0).toUpperCase() + st.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
