import { useEffect, Fragment, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { StatusBadge } from "../components/Badges";
import EcosystemHealthBadge from "../components/EcosystemHealthBadge";

const HABITAT_TYPES = ["forest", "grassland", "wetland", "riverine", "mountain", "marine", "other"];
const DEVICE_TYPES = ["camera_trap", "drone", "audio_sensor", "satellite", "manual_survey"];

const CAN_MANAGE = ["administrator", "researcher", "forest_department"];

export default function SurveysPage() {
  const { user } = useAuth();
  const canManage = CAN_MANAGE.includes(user.role);

  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [siteHealth, setSiteHealth] = useState({});
  const [surveyRecommendation, setSurveyRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState("");

  const [surveyForm, setSurveyForm] = useState({
    name: "",
    protected_area: "",
    description: "",
    start_date: "",
  });
  const [siteForm, setSiteForm] = useState({
    survey_id: "",
    site_name: "",
    latitude: "",
    longitude: "",
    habitat_type: "forest",
    monitoring_device: "camera_trap",
    protected_area: "",
  });

  async function refresh() {
    setLoading(true);
    try {
      const [s, m, health] = await Promise.all([
        api.listSurveys(),
        api.listAllSites(),
        api.getHealthScoreAllSites().catch(() => []),
      ]);
      setSurveys(s);
      setSites(m);
      setSiteHealth(Object.fromEntries((health || []).map((h) => [h.site_id, h])));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedSurvey) {
      setSurveyRecommendation(null);
      return;
    }
    const surveySites = sites.filter((s) => s.survey_id === selectedSurvey);
    if (surveySites.length === 0) {
      setSurveyRecommendation(null);
      return;
    }
    api
      .getResourceAllocation()
      .then((rows) => {
        const match = rows.find((r) => surveySites.some((s) => s.id === r.site_id));
        setSurveyRecommendation(match || null);
      })
      .catch(() => setSurveyRecommendation(null));
  }, [selectedSurvey, sites]);

  async function handleCreateSurvey(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createSurvey({
        ...surveyForm,
        start_date: new Date(surveyForm.start_date).toISOString(),
      });
      setSurveyForm({ name: "", protected_area: "", description: "", start_date: "" });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreateSite(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createSite({
        ...siteForm,
        latitude: parseFloat(siteForm.latitude),
        longitude: parseFloat(siteForm.longitude),
      });
      setSiteForm({
        survey_id: siteForm.survey_id,
        site_name: "",
        latitude: "",
        longitude: "",
        habitat_type: "forest",
        monitoring_device: "camera_trap",
        protected_area: "",
      });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  const filteredSites = selectedSurvey
    ? sites.filter((s) => s.survey_id === selectedSurvey)
    : sites;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-bark-900">Surveys &amp; Monitoring Sites</h1>
        <p className="text-canopy-700 text-sm mt-1">
          Multi-zone monitoring surveys with GPS-tagged camera, drone, and audio nodes.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateSurvey} className="card p-5 space-y-3">
            <h2 className="font-display font-semibold text-bark-900">Register a New Survey</h2>
            <div>
              <label className="label">Survey name</label>
              <input
                className="input"
                required
                value={surveyForm.name}
                onChange={(e) => setSurveyForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Kaziranga Rhino Census 2026"
              />
            </div>
            <div>
              <label className="label">Protected area</label>
              <input
                className="input"
                value={surveyForm.protected_area}
                onChange={(e) => setSurveyForm((f) => ({ ...f, protected_area: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Start date</label>
              <input
                type="date"
                required
                className="input"
                value={surveyForm.start_date}
                onChange={(e) => setSurveyForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={2}
                value={surveyForm.description}
                onChange={(e) => setSurveyForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <button className="btn-primary w-full">Create survey</button>
          </form>

          <form onSubmit={handleCreateSite} className="card p-5 space-y-3">
            <h2 className="font-display font-semibold text-bark-900">Register a Monitoring Site</h2>
            <div>
              <label className="label">Parent survey</label>
              <select
                className="input"
                required
                value={siteForm.survey_id}
                onChange={(e) => setSiteForm((f) => ({ ...f, survey_id: e.target.value }))}
              >
                <option value="">Select a survey…</option>
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Site name</label>
              <input
                className="input"
                required
                value={siteForm.site_name}
                onChange={(e) => setSiteForm((f) => ({ ...f, site_name: e.target.value }))}
                placeholder="e.g. North Camera Node 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Latitude</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  required
                  value={siteForm.latitude}
                  onChange={(e) => setSiteForm((f) => ({ ...f, latitude: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  required
                  value={siteForm.longitude}
                  onChange={(e) => setSiteForm((f) => ({ ...f, longitude: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Habitat type</label>
                <select
                  className="input"
                  value={siteForm.habitat_type}
                  onChange={(e) => setSiteForm((f) => ({ ...f, habitat_type: e.target.value }))}
                >
                  {HABITAT_TYPES.map((h) => (
                    <option key={h} value={h}>{h.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Monitoring device</label>
                <select
                  className="input"
                  value={siteForm.monitoring_device}
                  onChange={(e) => setSiteForm((f) => ({ ...f, monitoring_device: e.target.value }))}
                >
                  {DEVICE_TYPES.map((d) => (
                    <option key={d} value={d}>{d.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn-primary w-full">Register site</button>
          </form>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-bark-900">All Surveys</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-canopy-500 border-b border-canopy-100">
              <th className="py-2">Name</th>
              <th className="py-2">Protected Area</th>
              <th className="py-2">Status</th>
              <th className="py-2">Start Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canopy-100">
            {surveys.map((s) => (
              <Fragment key={s.id}>
                <tr
                  key={s.id}
                  className={`cursor-pointer hover:bg-canopy-50 ${selectedSurvey === s.id ? "bg-canopy-50" : ""}`}
                  onClick={() => setSelectedSurvey(selectedSurvey === s.id ? "" : s.id)}
                >
                  <td className="py-2 font-medium text-bark-900">{s.name}</td>
                  <td className="py-2 text-canopy-700">{s.protected_area || "—"}</td>
                  <td className="py-2"><StatusBadge status={s.status} /></td>
                  <td className="py-2 text-canopy-700">{new Date(s.start_date).toLocaleDateString()}</td>
                </tr>
                {selectedSurvey === s.id && surveyRecommendation && (
                  <tr key={`${s.id}-detail`} className="bg-canopy-50/60">
                    <td colSpan={4} className="py-3 px-2">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-medium text-bark-900">Ecosystem health snapshot:</span>
                        {(() => {
                          const health = siteHealth[surveyRecommendation.site_id];
                          return health ? (
                            <EcosystemHealthBadge score={health.ecosystem_health_score} status={health.conservation_status} size="sm" />
                          ) : (
                            <span className="text-canopy-600">No score yet</span>
                          );
                        })()}
                        <span className="text-canopy-700">
                          Top recommendation: {surveyRecommendation.recommended_action}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {surveys.length === 0 && !loading && (
          <p className="text-sm text-canopy-600 py-4">No surveys registered yet.</p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-bark-900 mb-4">
          Monitoring Sites {selectedSurvey && "(filtered by selected survey)"}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-canopy-500 border-b border-canopy-100">
              <th className="py-2">Site</th>
              <th className="py-2">Habitat</th>
              <th className="py-2">Device</th>
              <th className="py-2">Coordinates</th>
              <th className="py-2">Ecosystem Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canopy-100">
            {filteredSites.map((site) => (
              <tr key={site.id}>
                <td className="py-2 font-medium text-bark-900">{site.site_name}</td>
                <td className="py-2 text-canopy-700 capitalize">{site.habitat_type.replace("_", " ")}</td>
                <td className="py-2 text-canopy-700 capitalize">{site.monitoring_device.replace("_", " ")}</td>
                <td className="py-2 text-canopy-700">
                  {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                </td>
                <td className="py-2">
                  {siteHealth[site.id] ? (
                    <EcosystemHealthBadge
                      score={siteHealth[site.id].ecosystem_health_score}
                      status={siteHealth[site.id].conservation_status}
                      size="sm"
                    />
                  ) : (
                    <span className="text-xs text-canopy-500">No score yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSites.length === 0 && !loading && (
          <p className="text-sm text-canopy-600 py-4">No monitoring sites registered yet.</p>
        )}
      </div>
    </div>
  );
}
