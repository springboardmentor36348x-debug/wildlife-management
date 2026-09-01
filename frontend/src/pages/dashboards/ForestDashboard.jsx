import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import GisMap from "../../components/GisMap";
import EcosystemHealthBadge from "../../components/EcosystemHealthBadge";
import {
  Trees,
  Shield,
  Compass,
  AlertOctagon,
  Plus,
  Radio,
  MapPin,
  Clock,
  CheckCircle,
  X,
  Navigation,
  FileWarning,
} from "lucide-react";

export default function ForestDashboard() {
  const [activeTab, setActiveTab] = useState("protected_areas"); // protected_areas | movement | patrol | incidents

  const [sites, setSites] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [healthScores, setHealthScores] = useState([]);
  const [monitoringOpt, setMonitoringOpt] = useState([]);
  const [movementData, setMovementData] = useState([]);
  const [speciesCounts, setSpeciesCounts] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState("elephant");
  const [incidents, setIncidents] = useState([]);

  // Incident modal
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    incident_type: "poaching",
    severity: "medium",
    status: "open",
    site_id: "",
    actions_taken: "",
  });
  const [creatingIncident, setCreatingIncident] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([
      api.listAllSites().catch(() => []),
      api.listSurveys().catch(() => []),
      api.getHealthScoreAllSites().catch(() => []),
      api.getMonitoringOptimization().catch(() => []),
      api.getPopulationCounts().catch(() => []),
      api.listIncidents().catch(() => []),
    ])
      .then(([st, surv, health, opt, counts, inc]) => {
        setSites(st || []);
        setSurveys(surv || []);
        setHealthScores(health || []);
        setMonitoringOpt(opt || []);
        setSpeciesCounts(counts || []);
        setIncidents(inc || []);

        if (counts && counts.length > 0) {
          const firstSp = counts[0].species;
          setSelectedSpecies(firstSp);
          api.getPopulationMovement(firstSp).then(setMovementData).catch(() => {});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSpeciesMovementSelect = (sp) => {
    setSelectedSpecies(sp);
    api.getPopulationMovement(sp).then(setMovementData).catch(() => {});
  };

  const handleCreateIncidentSubmit = async (e) => {
    e.preventDefault();
    if (!newIncident.title) return;
    setCreatingIncident(true);

    try {
      const created = await api.createIncident({
        ...newIncident,
        site_id: newIncident.site_id || undefined,
      });
      setIncidents([created, ...incidents]);
      setShowIncidentModal(false);
      setNewIncident({
        title: "",
        description: "",
        incident_type: "poaching",
        severity: "medium",
        status: "open",
        site_id: "",
        actions_taken: "",
      });
    } catch (err) {
      alert(`Failed to log incident: ${err.message}`);
    } finally {
      setCreatingIncident(false);
    }
  };

  const handleUpdateIncidentStatus = async (id, status) => {
    try {
      const updated = await api.updateIncident(id, { status });
      setIncidents(incidents.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const underCoveredSites = monitoringOpt.filter((m) => m.suggestion.includes("more monitoring"));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-950 via-canopy-900 to-canopy-800 p-6 rounded-2xl text-white shadow-sm border border-teal-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-teal-500/20 text-teal-300 rounded-lg">
              <Trees className="w-5 h-5" />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight">Forest Department Dashboard</h1>
          </div>
          <p className="text-canopy-200 text-sm mt-1 max-w-2xl">
            Protected area zoning, wildlife movement paths, ranger patrol planning optimization, and field incident reporting.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap items-center bg-canopy-950/70 p-1.5 rounded-xl border border-canopy-700/60 self-start md:self-auto">
          {[
            { key: "protected_areas", label: "Protected Areas", icon: Shield },
            { key: "movement", label: "Wildlife Movement", icon: Compass },
            { key: "patrol", label: "Patrol Planning", icon: Navigation, badge: underCoveredSites.length },
            { key: "incidents", label: "Incident Reports", icon: AlertOctagon, badge: incidents.filter((i) => i.status === "open").length },
          ].map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === key
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-canopy-200 hover:text-white hover:bg-canopy-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {badge !== undefined && badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === key ? "bg-white text-teal-800" : "bg-red-500 text-white"
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
          <div className="p-3 bg-teal-100 text-teal-800 rounded-xl">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Monitored Zones</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{sites.length}</p>
            <p className="text-[11px] text-teal-700 font-semibold">{surveys.length} survey zones</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-700 rounded-xl">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Open Incidents</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">
              {incidents.filter((i) => i.status === "open").length}
            </p>
            <p className="text-[11px] text-red-600 font-semibold">{incidents.length} recorded total</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Patrol Priorities</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{underCoveredSites.length}</p>
            <p className="text-[11px] text-amber-700">Sites needing coverage</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Migration Waypoints</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{movementData.length}</p>
            <p className="text-[11px] text-blue-700">For {selectedSpecies}</p>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: PROTECTED AREA MONITORING ================= */}
      {activeTab === "protected_areas" && (
        <div className="space-y-6">
          <GisMap
            height="480px"
            title="Protected Area Coverage & Ecosystem Health Overlays"
            subtitle="Explore color-coded health indicators (Excellent to Critical) across national parks and reserves."
          />

          <div className="card p-5">
            <h2 className="font-display font-bold text-bark-900 text-base mb-1">Protected Area Health Status Summary</h2>
            <p className="text-xs text-canopy-600 mb-4">Ecosystem health score breakdown across regional protected zones.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthScores.map((h) => {
                const site = sites.find((s) => s.id === h.site_id);
                return (
                  <div
                    key={h.site_id}
                    className="p-4 bg-white border border-canopy-200 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold text-bark-900 text-sm">{site?.site_name || h.site_id.slice(0, 8)}</p>
                      <p className="text-xs text-canopy-600">
                        {site?.protected_area || "Protected Zone"} · {site?.habitat_type || "Habitat"}
                      </p>
                      <p className="text-[11px] text-canopy-500 mt-1">
                        GPS: {site?.latitude?.toFixed(4)}, {site?.longitude?.toFixed(4)}
                      </p>
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
      )}

      {/* ================= VIEW 2: WILDLIFE MOVEMENT ================= */}
      {activeTab === "movement" && (
        <div className="space-y-6">
          <GisMap
            height="460px"
            selectedSpecies={selectedSpecies}
            title="Chronological Migration & Corridor Tracking"
            subtitle={`Visualizing chronological movement paths across camera traps for ${selectedSpecies.toUpperCase()}.`}
          />

          <div className="card p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-canopy-100">
              <div>
                <h2 className="font-display font-bold text-bark-900 text-base">Observed Sequential Movement Waypoints</h2>
                <p className="text-xs text-canopy-600">Chronological telemetry timeline of species detection sites.</p>
              </div>

              {/* Species selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-canopy-700">Select Species:</span>
                <select
                  value={selectedSpecies}
                  onChange={(e) => handleSpeciesMovementSelect(e.target.value)}
                  className="bg-white border border-canopy-200 rounded-lg px-3 py-1 text-xs capitalize text-bark-900 font-bold"
                >
                  {speciesCounts.map((s) => (
                    <option key={s.species} value={s.species} className="capitalize">
                      {s.species} ({s.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {movementData.length === 0 ? (
              <p className="text-sm text-canopy-600 py-6 text-center">No sequential movement waypoints recorded for this species yet.</p>
            ) : (
              <div className="space-y-3">
                {movementData.map((m, idx) => (
                  <div key={idx} className="p-3.5 bg-canopy-50/60 rounded-xl border border-canopy-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-bark-900 text-sm">{m.site_name}</p>
                        <p className="text-xs text-canopy-600">
                          First recorded observation: {new Date(m.first_observed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <span className="bg-white font-bold px-2.5 py-1 rounded-md border border-canopy-200 text-bark-800">
                        {m.observation_count} observation(s)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 3: PATROL PLANNING ================= */}
      {activeTab === "patrol" && (
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-display font-bold text-bark-900 text-lg mb-1">Ranger Patrol Priority & Optimization Plan</h2>
            <p className="text-xs text-canopy-600 mb-4">
              Monitoring optimization engine recommendations to balance ranger surveillance and sensor coverage.
            </p>

            <div className="divide-y divide-canopy-100">
              {monitoringOpt.map((m) => {
                const isUnder = m.suggestion.includes("more monitoring");
                const isWell = m.suggestion.includes("Well-monitored");

                return (
                  <div key={m.site_id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-bark-900 text-sm">{m.site_name}</span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isUnder
                              ? "bg-red-100 text-red-800"
                              : isWell
                              ? "bg-blue-100 text-blue-800"
                              : "bg-canopy-100 text-canopy-700"
                          }`}
                        >
                          {isUnder ? "High Patrol Priority" : isWell ? "Sufficient Coverage" : "Standard Patrol"}
                        </span>
                      </div>
                      <p className="text-xs text-canopy-700 mt-1">{m.suggestion}</p>
                    </div>

                    <div className="shrink-0">
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-canopy-50 border border-canopy-200 text-canopy-800">
                        {isUnder ? "Deploy Rangers & Sensors" : "Routine Check"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: INCIDENT REPORTS ================= */}
      {activeTab === "incidents" && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-canopy-100">
              <div>
                <h2 className="font-display font-bold text-bark-900 text-lg">Field Incident Log & Security Registry</h2>
                <p className="text-xs text-canopy-600">
                  Track poaching encounters, human-wildlife conflict events, device tampering, and fire alerts.
                </p>
              </div>

              <button
                onClick={() => setShowIncidentModal(true)}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Incident</span>
              </button>
            </div>

            {incidents.length === 0 && !loading && (
              <p className="text-sm text-canopy-600 py-10 text-center">No field incidents reported yet.</p>
            )}

            <div className="divide-y divide-canopy-100">
              {incidents.map((inc) => {
                const isCrit = inc.severity === "critical";
                const isHigh = inc.severity === "high";
                const isOpen = inc.status === "open";
                const isInProg = inc.status === "in_progress";

                return (
                  <div key={inc.id} className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-canopy-50/40 px-2 rounded-lg transition-colors">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                          isCrit ? "bg-red-500 text-white" : isHigh ? "bg-amber-500 text-white" : "bg-teal-700 text-white"
                        }`}
                      >
                        <FileWarning className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-bark-900 text-sm">{inc.title}</h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isCrit ? "bg-red-100 text-red-800" : isHigh ? "bg-amber-100 text-amber-800" : "bg-canopy-100 text-canopy-700"
                            }`}
                          >
                            {inc.severity}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-canopy-200 text-bark-700">
                            {inc.incident_type.replace("_", " ")}
                          </span>
                        </div>

                        {inc.description && <p className="text-xs text-bark-700 mt-1">{inc.description}</p>}
                        {inc.actions_taken && (
                          <p className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md mt-1.5 border border-emerald-100">
                            <strong>Actions Taken:</strong> {inc.actions_taken}
                          </p>
                        )}

                        <p className="text-[11px] text-canopy-500 mt-1.5">
                          {inc.site_name || "Regional Area"} · Reported by {inc.reporter_name || "Field Officer"} on{" "}
                          {new Date(inc.reported_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Status updater */}
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      <select
                        value={inc.status}
                        onChange={(e) => handleUpdateIncidentStatus(inc.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none ${
                          isOpen
                            ? "bg-red-50 text-red-700 border-red-200"
                            : isInProg
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: LOG NEW INCIDENT ================= */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-bark-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card max-w-lg w-full p-6 shadow-xl relative bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-canopy-100">
              <h3 className="font-display font-bold text-bark-900 text-lg">Log Field Security Incident</h3>
              <button onClick={() => setShowIncidentModal(false)} className="text-canopy-500 hover:text-bark-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncidentSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="label">Incident Title *</label>
                <input
                  type="text"
                  required
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  placeholder="e.g. Wire snare discovered at perimeter fence"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Incident Type</label>
                  <select
                    value={newIncident.incident_type}
                    onChange={(e) => setNewIncident({ ...newIncident, incident_type: e.target.value })}
                    className="input capitalize"
                  >
                    <option value="poaching">Poaching</option>
                    <option value="human_wildlife_conflict">Human-Wildlife Conflict</option>
                    <option value="device_tampering">Device Tampering</option>
                    <option value="illegal_logging">Illegal Logging</option>
                    <option value="forest_fire">Forest Fire</option>
                    <option value="invasive_species">Invasive Species</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label">Severity Level</label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                    className="input capitalize"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Associated Monitoring Site (Optional)</label>
                <select
                  value={newIncident.site_id}
                  onChange={(e) => setNewIncident({ ...newIncident, site_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select Monitoring Site</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.site_name} ({s.protected_area || "General Area"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Description & Observations</label>
                <textarea
                  rows={3}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Details of tracks, confiscated equipment, animal casualties, or perimeter breaches..."
                  className="input"
                />
              </div>

              <div>
                <label className="label">Initial Actions Taken / Dispatch</label>
                <input
                  type="text"
                  value={newIncident.actions_taken}
                  onChange={(e) => setNewIncident({ ...newIncident, actions_taken: e.target.value })}
                  placeholder="e.g. Deployed quick-response ranger patrol; chili smoke deployed."
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-canopy-100">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingIncident}
                  className="btn-primary text-xs"
                >
                  {creatingIncident ? "Logging Incident..." : "Submit Incident Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
