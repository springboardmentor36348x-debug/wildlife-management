import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle, Lightbulb, Plus, Filter } from 'lucide-react';

export default function ConservationHub() {
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [actions, setActions] = useState([]);
  const [siteId, setSiteId] = useState('');
  const [sites, setSites] = useState([]);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSites() {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/v1/monitoring-sites', { headers });
        if (res.ok) setSites(await res.json());
      } catch (err) { console.error(err); }
    }
    loadSites();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const siteParam = siteId ? `?site_id=${siteId}` : '';

      const [resAlerts, resRecs, resActions] = await Promise.all([
        fetch(`/api/v1/conservation/alerts${siteParam}`, { headers }),
        fetch(`/api/v1/conservation/recommendations${siteParam}`, { headers }),
        fetch(`/api/v1/conservation/actions${siteParam}`, { headers })
      ]);

      if (resAlerts.ok) setAlerts(await resAlerts.json());
      if (resRecs.ok) setRecommendations(await resRecs.json());
      if (resActions.ok) setActions(await resActions.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [siteId]);

  const resolveAlert = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/conservation/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  };

  const severityColor = (s) => {
    if (s === 'critical') return 'bg-red-100 text-red-800 border-red-200';
    if (s === 'high' || s === 'warning') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (s === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const priorityColor = (p) => {
    if (p === 'Critical') return 'text-red-700 bg-red-50 border-red-100';
    if (p === 'High') return 'text-orange-700 bg-orange-50 border-orange-100';
    return 'text-amber-700 bg-amber-50 border-amber-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-col md:flex-row gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Conservation Intelligence Hub</h2>
          <p className="text-sm text-slate-500 mt-1">AI-generated wildlife protection recommendations, alert management, and field action tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">All Sites</option>
            {sites.map((st) => (
              <option key={st.id} value={st.id}>{st.site_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {[
          { key: 'recommendations', label: 'AI Recommendations', icon: Lightbulb },
          { key: 'alerts', label: `Active Alerts (${alerts.filter(a => a.is_active).length})`, icon: ShieldAlert },
          { key: 'actions', label: 'Actions Logged', icon: CheckCircle }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === key
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Generating intelligence reports...</div>
      ) : (
        <div className="space-y-4">
          {/* AI Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No strategic recommendations currently flagged for this site.</div>
              ) : (
                recommendations.map((rec) => (
                  <div key={rec.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-800">{rec.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">{rec.recommendation_type}</p>
                      </div>
                      <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full border ${priorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <p className="font-semibold text-slate-500">Evidence Base:</p>
                      <p className="italic">{rec.evidence}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                      <p className="font-semibold text-slate-500 mb-1">Recommended Action Plan:</p>
                      {rec.description}
                    </div>
                    {rec.site_name && (
                      <p className="text-[10px] text-slate-400">Reserve: <b>{rec.site_name}</b></p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No alerts logged for this site.</div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex justify-between items-start gap-4 ${!alert.is_active ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3 flex-1">
                      <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'warning' ? 'text-orange-500' : 'text-amber-500'
                      }`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-400">Type: {alert.alert_type}</span>
                          {alert.site_name && <span className="text-[10px] text-slate-400">Reserve: {alert.site_name}</span>}
                          {alert.species_name && <span className="text-[10px] text-slate-400">Species: {alert.species_name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full border ${severityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      {alert.is_active && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold"
                        >
                          Resolve →
                        </button>
                      )}
                      {!alert.is_active && (
                        <span className="text-[10px] text-slate-400 font-semibold">Resolved</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              {actions.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No conservation actions logged yet for this site.</div>
              ) : (
                actions.map((action) => (
                  <div key={action.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-slate-800">{action.action_type}</h3>
                      <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full border ${
                        action.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        action.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {action.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{action.description}</p>
                    {action.outcome && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        Outcome: {action.outcome}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Start: {new Date(action.start_date).toLocaleDateString()}</span>
                      {action.responsible_party && <span>Team: {action.responsible_party}</span>}
                      {action.site_name && <span>Reserve: {action.site_name}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
