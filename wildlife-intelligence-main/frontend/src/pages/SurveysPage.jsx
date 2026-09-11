import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function SurveysPage() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [surveyForm, setSurveyForm] = useState({ name: "", description: "", protected_area: "", start_date: "" });
  const [siteForm, setSiteForm] = useState({ survey_id: "", site_name: "", latitude: "", longitude: "", habitat_type: "other", monitoring_device: "camera_trap", protected_area: "" });
  const [error, setError] = useState("");
  const canManage = ["administrator", "researcher", "forest_department"].includes(user?.role);

  useEffect(() => { load(); }, []);
  function load() {
    api.listSurveys().then(setSurveys).catch(() => {});
    api.listAllSites().then(setSites).catch(() => {});
  }

  async function createSurvey(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createSurvey({ ...surveyForm, start_date: new Date(surveyForm.start_date).toISOString() });
      setShowSurveyForm(false);
      setSurveyForm({ name: "", description: "", protected_area: "", start_date: "" });
      load();
    } catch (err) { setError(err.message); }
  }

  async function createSite(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createSite({ ...siteForm, latitude: parseFloat(siteForm.latitude), longitude: parseFloat(siteForm.longitude) });
      setShowSiteForm(false);
      setSiteForm({ survey_id: "", site_name: "", latitude: "", longitude: "", habitat_type: "other", monitoring_device: "camera_trap", protected_area: "" });
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>📍 Surveys & Monitoring Sites</h1>
          <p>Manage field surveys and their monitoring site networks.</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => setShowSurveyForm(!showSurveyForm)}>+ Survey</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSiteForm(!showSiteForm)}>+ Site</button>
          </div>
        )}
      </div>

      {error && <div className="auth-error mb-4">{error}</div>}

      {/* Survey Creation Form */}
      {showSurveyForm && (
        <div className="card mb-4">
          <h3 className="section-title">New Survey</h3>
          <form onSubmit={createSurvey} className="grid grid-2">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={surveyForm.name} onChange={(e) => setSurveyForm({ ...surveyForm, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Protected Area</label><input className="form-input" value={surveyForm.protected_area} onChange={(e) => setSurveyForm({ ...surveyForm, protected_area: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Start Date</label><input type="datetime-local" className="form-input" value={surveyForm.start_date} onChange={(e) => setSurveyForm({ ...surveyForm, start_date: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={surveyForm.description} onChange={(e) => setSurveyForm({ ...surveyForm, description: e.target.value })} /></div>
            <div style={{ gridColumn: "span 2" }}><button type="submit" className="btn btn-primary">Create Survey</button></div>
          </form>
        </div>
      )}

      {/* Site Creation Form */}
      {showSiteForm && (
        <div className="card mb-4">
          <h3 className="section-title">New Monitoring Site</h3>
          <form onSubmit={createSite} className="grid grid-3">
            <div className="form-group"><label className="form-label">Survey</label>
              <select className="form-select" value={siteForm.survey_id} onChange={(e) => setSiteForm({ ...siteForm, survey_id: e.target.value })} required>
                <option value="">Select survey…</option>
                {surveys.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Site Name</label><input className="form-input" value={siteForm.site_name} onChange={(e) => setSiteForm({ ...siteForm, site_name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Latitude</label><input type="number" step="any" className="form-input" value={siteForm.latitude} onChange={(e) => setSiteForm({ ...siteForm, latitude: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Longitude</label><input type="number" step="any" className="form-input" value={siteForm.longitude} onChange={(e) => setSiteForm({ ...siteForm, longitude: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Habitat Type</label>
              <select className="form-select" value={siteForm.habitat_type} onChange={(e) => setSiteForm({ ...siteForm, habitat_type: e.target.value })}>
                {["forest","grassland","wetland","riverine","mountain","marine","other"].map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Device Type</label>
              <select className="form-select" value={siteForm.monitoring_device} onChange={(e) => setSiteForm({ ...siteForm, monitoring_device: e.target.value })}>
                {["camera_trap","drone","audio_sensor","satellite","manual_survey"].map((d) => <option key={d} value={d}>{d.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "span 3" }}><button type="submit" className="btn btn-primary">Create Site</button></div>
          </form>
        </div>
      )}

      {/* Surveys Table */}
      <div className="card mb-4">
        <h3 className="section-title">🗂️ Surveys ({surveys.length})</h3>
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Protected Area</th><th>Status</th><th>Start Date</th></tr></thead>
            <tbody>
              {surveys.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold">{s.name}</td>
                  <td className="text-muted">{s.protected_area || "—"}</td>
                  <td><span className={`badge ${s.status === "active" ? "badge-emerald" : s.status === "completed" ? "badge-cyan" : "badge-amber"}`}>{s.status}</span></td>
                  <td className="font-mono text-xs">{new Date(s.start_date).toLocaleDateString()}</td>
                </tr>
              ))}
              {surveys.length === 0 && <tr><td colSpan={4} className="text-center text-muted p-4">No surveys yet. Create one above.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sites Table */}
      <div className="card">
        <h3 className="section-title">📡 Monitoring Sites ({sites.length})</h3>
        <div className="table-container">
          <table>
            <thead><tr><th>Site Name</th><th>Habitat</th><th>Device</th><th>Coordinates</th><th>Status</th></tr></thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold">{s.site_name}</td>
                  <td><span className="badge badge-blue">{s.habitat_type}</span></td>
                  <td className="text-muted text-xs">{s.monitoring_device?.replace(/_/g, " ")}</td>
                  <td className="font-mono text-xs">{s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}</td>
                  <td><span className={`badge ${s.is_active === "true" ? "badge-emerald" : "badge-rose"}`}>{s.is_active === "true" ? "Active" : "Inactive"}</span></td>
                </tr>
              ))}
              {sites.length === 0 && <tr><td colSpan={5} className="text-center text-muted p-4">No monitoring sites registered.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
