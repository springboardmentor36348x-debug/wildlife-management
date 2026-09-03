import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CloudSun, FileText, Layers, CheckCircle2, Search, X, Sparkles, MapPin } from 'lucide-react';

const SURVEY_STAGES = [
  { id: 'stage_1', label: 'Stage 1: Planning', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'stage_2', label: 'Stage 2: Active Field Deployment', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'stage_3', label: 'Stage 3: AI Sensor Processing', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'stage_4', label: 'Stage 4: Verified & Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
];

const SURVEY_TYPES = [
  'Camera Trap Grid Census',
  'Bioacoustic Sensor Array',
  'Line Transect Distance Sampling',
  'Waterhole Dawn-Dusk Count',
  'Aerial Drone Canopy Survey'
];

export default function Surveys() {
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form State
  const [surveyId, setSurveyId] = useState('');
  const [surveyName, setSurveyName] = useState('');
  const [siteId, setSiteId] = useState('');
  const [surveyType, setSurveyType] = useState(SURVEY_TYPES[0]);
  const [surveyStage, setSurveyStage] = useState('Stage 2: Active Field Deployment');
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationHours, setDurationHours] = useState(48);
  const [weather, setWeather] = useState('Clear / Dry');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load sites
      const resSites = await fetch('/api/v1/monitoring-sites', { headers });
      if (resSites.ok) {
        const siteData = await resSites.json();
        setSites(siteData);
        if (siteData.length > 0 && !siteId) setSiteId(siteData[0].id);
      }

      // Load surveys
      const resSurveys = await fetch('/api/v1/surveys', { headers });
      if (resSurveys.ok) {
        const surveyData = await resSurveys.json();
        setSurveys(surveyData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const genId = surveyId.trim() || `SRV-${Date.now().toString().slice(-6)}`;
      const res = await fetch('/api/v1/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          survey_id: genId,
          survey_name: `${surveyName} [${surveyType}]`,
          monitoring_site_id: parseInt(siteId),
          survey_date: new Date(surveyDate).toISOString(),
          survey_duration_hours: parseFloat(durationHours),
          weather_conditions: `${weather} · ${surveyStage}`,
          notes: `${notes} | Methodology: ${surveyType} | Stage: ${surveyStage}`
        })
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
        // Reset form
        setSurveyId('');
        setSurveyName('');
        setNotes('');
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Failed to create survey');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSurveys = surveys.filter(s =>
    !search ||
    s.survey_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.monitoring_site_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.survey_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Wildlife Census Surveys</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track seasonal census campaigns, survey lifecycle stages, and sensor deployment timelines.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule New Survey</span>
        </button>
      </div>

      {/* Stage Flow Guide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SURVEY_STAGES.map((stg, i) => (
          <div key={stg.id} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0">
              {i + 1}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{stg.label}</p>
              <p className="text-[10px] text-slate-400">Census Pipeline Phase</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search survey title, site, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filteredSurveys.length} surveys logged</span>
      </div>

      {/* Surveys Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading census records...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                  <th className="p-4">Survey Name & ID</th>
                  <th className="p-4">Reserve Site</th>
                  <th className="p-4">Deployment Date</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Status & Stage</th>
                  <th className="p-4 text-center">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredSurveys.map((s, idx) => {
                  const stageBadge = SURVEY_STAGES[idx % SURVEY_STAGES.length];
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{s.survey_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.survey_id}</p>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{s.monitoring_site_name || 'Nagarjuna Sagar'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{new Date(s.survey_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{s.survey_duration_hours || 48} hrs</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${stageBadge.color}`}>
                          {stageBadge.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-extrabold text-emerald-700 px-2.5 py-1 bg-emerald-50 rounded-xl text-xs">
                          {s.observation_count || 12} logged
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── CREATE SURVEY MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 md:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Schedule Wildlife Census Survey</h3>
                  <p className="text-xs text-slate-400">Configure census parameters, methodology type, and deployment timeline.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Survey Campaign Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nagarjuna Summer Tiger Census"
                    value={surveyName}
                    onChange={(e) => setSurveyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Custom Survey ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={surveyId}
                    onChange={(e) => setSurveyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Reserve Site *</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {sites.map((st) => (
                      <option key={st.id} value={st.id}>{st.site_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Methodology Type *</label>
                  <select
                    value={surveyType}
                    onChange={(e) => setSurveyType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {SURVEY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Deployment Date *</label>
                  <input
                    type="date"
                    required
                    value={surveyDate}
                    onChange={(e) => setSurveyDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Duration (Hours) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Census Pipeline Stage</label>
                  <select
                    value={surveyStage}
                    onChange={(e) => setSurveyStage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {SURVEY_STAGES.map((s) => (
                      <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Weather / Seasonal Conditions</label>
                <input
                  type="text"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  placeholder="e.g. Dry Season / Pre-monsoon clear skies"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Field Notes & Grid Coordinates</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Target grid blocks, team deployment logistics..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors"
                >
                  Schedule Survey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
