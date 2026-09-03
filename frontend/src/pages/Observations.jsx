import React, { useState, useEffect } from 'react';
import { Eye, MapPin, Clock, Camera, Volume2, Search, Filter, Plus, X, CheckCircle2, AlertCircle, Sparkles, User, Tag } from 'lucide-react';

const STATUS_BADGES = {
  verified: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Stage 4: Verified' },
  pending: { bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Stage 2: Under Review' },
  ai_processed: { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Stage 1: AI Classified' },
  rejected: { bg: 'bg-red-100 text-red-800 border-red-200', label: 'Flagged / Invalid' },
};

const STAGE_OPTIONS = [
  'All Stages',
  'Stage 1: AI Classified',
  'Stage 2: Under Review',
  'Stage 4: Verified'
];

const TYPE_ICONS = {
  camera_trap: { icon: Camera, label: 'Camera Trap', color: 'text-blue-600 bg-blue-50' },
  acoustic: { icon: Volume2, label: 'Bioacoustic Array', color: 'text-purple-600 bg-purple-50' },
  visual: { icon: Eye, label: 'Visual Transect', color: 'text-emerald-600 bg-emerald-50' },
  drone: { icon: Sparkles, label: 'Aerial Drone Survey', color: 'text-amber-600 bg-amber-50' }
};

export default function Observations() {
  const [observations, setObservations] = useState([]);
  const [sites, setSites] = useState([]);
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Add Observation Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpeciesId, setNewSpeciesId] = useState('');
  const [newSiteId, setNewSiteId] = useState('');
  const [newCount, setNewCount] = useState(1);
  const [newType, setNewType] = useState('camera_trap');
  const [newLifeStage, setNewLifeStage] = useState('Adult');
  const [newSex, setNewSex] = useState('Unknown');
  const [newBehavior, setNewBehavior] = useState('Foraging / Grazing');
  const [newLat, setNewLat] = useState('16.2541');
  const [newLon, setNewLon] = useState('79.0125');
  const [newStatus, setNewStatus] = useState('verified');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resObs, resSites, resSpecies] = await Promise.all([
        fetch('/api/v1/observations?limit=300', { headers }),
        fetch('/api/v1/monitoring-sites', { headers }),
        fetch('/api/v1/species', { headers })
      ]);

      if (resObs.ok) setObservations(await resObs.json());
      if (resSites.ok) {
        const sData = await resSites.json();
        setSites(sData);
        if (sData.length > 0) setNewSiteId(sData[0].id);
      }
      if (resSpecies.ok) {
        const spData = await resSpecies.json();
        setSpeciesCatalog(spData);
        if (spData.length > 0) setNewSpeciesId(spData[0].id);
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

  const handleAddObservation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const selectedSpecies = speciesCatalog.find(s => s.id === parseInt(newSpeciesId));
      const selectedSite = sites.find(s => s.id === parseInt(newSiteId));

      const res = await fetch('/api/v1/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          observation_id: `OBS-${Date.now().toString().slice(-6)}`,
          survey_id: 1, // default survey
          species_id: parseInt(newSpeciesId),
          site_id: parseInt(newSiteId),
          observation_type: newType,
          count: parseInt(newCount) || 1,
          latitude: parseFloat(newLat) || null,
          longitude: parseFloat(newLon) || null,
          confidence_score: 0.95,
          behavior_observed: `${newBehavior} · Stage: ${newLifeStage} · Sex: ${newSex}`,
          notes: `Life Stage: ${newLifeStage}, Sex: ${newSex}, Verification Stage: ${newStatus}`,
          observation_date: new Date().toISOString()
        })
      });

      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Observation for ${selectedSpecies?.common_name || 'Species'} logged successfully!` });
        setShowAddModal(false);
        loadData();
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save observation');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const filtered = observations.filter((obs) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      obs.species_name?.toLowerCase().includes(q) ||
      obs.site_name?.toLowerCase().includes(q) ||
      obs.observer_name?.toLowerCase().includes(q) ||
      obs.behavior_observed?.toLowerCase().includes(q);

    const matchesType = typeFilter === 'all' || obs.observation_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || obs.verification_status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Observation Log & Field Sightings</h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse, filter, and log wildlife records with detection types, life stages, sex classifications, and verification status.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Log New Observation</span>
        </button>
      </div>

      {statusMsg && (
        <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm font-semibold ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{statusMsg.text}</span>
          <button className="ml-auto" onClick={() => setStatusMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search species, reserve, behavior..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-none"
          >
            <option value="all">All Detection Types</option>
            <option value="camera_trap">Camera Trap</option>
            <option value="acoustic">Bioacoustic Array</option>
            <option value="visual">Visual Transect</option>
          </select>

          {/* Status / Stage Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-none"
          >
            <option value="all">All Verification Stages</option>
            <option value="verified">Stage 4: Verified</option>
            <option value="pending">Stage 2: Under Review</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: observations.length, color: 'text-slate-800' },
          { label: 'Verified Observations', value: observations.filter(o => o.verification_status === 'verified').length, color: 'text-emerald-700' },
          { label: 'Under Review', value: observations.filter(o => o.verification_status !== 'verified').length, color: 'text-amber-700' },
          { label: 'Distinct Taxa Logged', value: [...new Set(observations.map(o => o.species_name || o.species_id))].length, color: 'text-blue-700' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm text-center">
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Observations Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading observations...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
          No observations match the selected filters.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Species & Taxa', 'Reserve Site', 'Date / Time', 'Count', 'Detection Type', 'Behavior & Life Stage', 'Verification Stage'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((obs) => {
                    const typeInfo = TYPE_ICONS[obs.observation_type] || TYPE_ICONS.camera_trap;
                    const TypeIcon = typeInfo.icon;
                    const badge = STATUS_BADGES[obs.verification_status] || STATUS_BADGES.pending;

                    return (
                      <tr key={obs.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Species */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{obs.species_name || 'Unidentified Taxa'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {obs.observation_id || `OBS-${obs.id}`}</div>
                        </td>

                        {/* Site */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-slate-600 text-xs">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="font-semibold">{obs.site_name || 'Nagarjuna Sagar'}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-slate-500 text-xs">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            {obs.observation_datetime ? new Date(obs.observation_datetime).toLocaleDateString() : 'Recent'}
                          </div>
                        </td>

                        {/* Count */}
                        <td className="px-4 py-3 font-extrabold text-slate-800 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-xs">
                            {obs.count_individual || obs.count || 1}
                          </span>
                        </td>

                        {/* Detection Type */}
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${typeInfo.color}`}>
                            <TypeIcon className="h-3.5 w-3.5" />
                            <span>{typeInfo.label}</span>
                          </div>
                        </td>

                        {/* Behavior & Life Stage */}
                        <td className="px-4 py-3">
                          <div className="text-xs text-slate-700">{obs.behavior_observed || 'Active in habitat'}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {obs.confidence_score ? `AI Confidence: ${(obs.confidence_score * 100).toFixed(0)}%` : 'Manual Field Log'}
                          </div>
                        </td>

                        {/* Verification Status / Stage */}
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-xs text-slate-500 font-semibold">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ─── ADD OBSERVATION MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 md:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Log Wildlife Observation</h3>
                  <p className="text-xs text-slate-400">Record field sighting with life stage, sex, and detection method.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddObservation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Species */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Observed Species *</label>
                  <select
                    value={newSpeciesId}
                    onChange={(e) => setNewSpeciesId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {speciesCatalog.map((sp) => (
                      <option key={sp.id} value={sp.id}>{sp.common_name} ({sp.scientific_name})</option>
                    ))}
                  </select>
                </div>

                {/* Reserve Site */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Reserve / Sanctuary *</label>
                  <select
                    value={newSiteId}
                    onChange={(e) => setNewSiteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {sites.map((st) => (
                      <option key={st.id} value={st.id}>{st.site_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Individual Count */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Count *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCount}
                    onChange={(e) => setNewCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* Detection Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Detection Type *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="camera_trap">Camera Trap</option>
                    <option value="acoustic">Bioacoustic Array</option>
                    <option value="visual">Visual Sighting</option>
                    <option value="drone">Aerial Drone</option>
                  </select>
                </div>

                {/* Life Stage */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Life Stage *</label>
                  <select
                    value={newLifeStage}
                    onChange={(e) => setNewLifeStage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Adult (Breeding)">Adult (Breeding)</option>
                    <option value="Sub-adult">Sub-adult</option>
                    <option value="Juvenile">Juvenile</option>
                    <option value="Cub / Calf / Infant">Cub / Calf / Infant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sex / Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Sex / Cohort</label>
                  <select
                    value={newSex}
                    onChange={(e) => setNewSex(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Mating Pair">Mating Pair</option>
                    <option value="Family Herd / Pride">Family Herd / Pride</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                {/* Verification Stage */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Verification Stage</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="verified">Stage 4: Field Verified</option>
                    <option value="pending">Stage 2: Under Review</option>
                    <option value="ai_processed">Stage 1: AI Classified</option>
                  </select>
                </div>
              </div>

              {/* Behavior Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Behavior & Activity</label>
                <input
                  type="text"
                  value={newBehavior}
                  onChange={(e) => setNewBehavior(e.target.value)}
                  placeholder="e.g. Drinking at waterhole, territorial scent marking"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Latitude</label>
                  <input
                    type="text"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Longitude</label>
                  <input
                    type="text"
                    value={newLon}
                    onChange={(e) => setNewLon(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving Record...' : 'Save Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
