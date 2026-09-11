import { useEffect, useState } from "react";
import { api } from "../api/client";

function Card({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-bark-900">{title}</h2>
      {subtitle && <p className="text-xs text-canopy-600 mt-0.5 mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const cls = priority === "high" ? "badge-high" : priority === "medium" ? "badge-med" : "badge-low";
  return <span className={`badge ${cls} capitalize`}>{priority}</span>;
}

export default function ConservationPage() {
  const [priorities, setPriorities] = useState([]);
  const [optimization, setOptimization] = useState([]);
  const [allocation, setAllocation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [restoration, setRestoration] = useState(null);
  const [protection, setProtection] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.getConservationPriorities(),
      api.getMonitoringOptimization(),
      api.getResourceAllocation(),
    ])
      .then(([p, o, a]) => {
        setPriorities(p || []);
        setOptimization(o || []);
        setAllocation(a || []);
        if (p && p.length) setSelectedSiteId(p[0].site_id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSiteId) return;
    setDetailLoading(true);
    Promise.all([
      api.getConservationRestoration(selectedSiteId),
      api.getConservationProtection(selectedSiteId),
    ])
      .then(([r, pr]) => {
        setRestoration(r || []);
        setProtection(pr || []);
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [selectedSiteId]);

  const selectedSite = priorities.find((p) => p.site_id === selectedSiteId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-bark-900">Conservation Recommendations</h1>
        <p className="text-canopy-700 text-sm mt-1">
          Rule-based conservation priority, restoration, protection, and resource-allocation recommendations,
          computed from real population &amp; habitat signals (Milestone 3, Feature D).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <Card title="Conservation Priority Ranking" subtitle="Every monitoring site, ranked by combined risk. Click a row to see recommendations.">
        {!loading && priorities.length === 0 && <p className="text-sm text-canopy-600">No sites to prioritize yet.</p>}
        <div className="divide-y divide-canopy-100">
          {priorities.map((p) => (
            <button
              key={p.site_id}
              onClick={() => setSelectedSiteId(p.site_id)}
              className={`w-full text-left py-3 px-2 rounded-lg transition-colors ${
                p.site_id === selectedSiteId ? "bg-canopy-50" : "hover:bg-canopy-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-bark-900">{p.site_name}</span>
                <PriorityBadge priority={p.priority} />
              </div>
              <p className="text-xs text-canopy-600 mt-1">{p.reasoning}</p>
            </button>
          ))}
        </div>
      </Card>

      {selectedSite && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title={`Habitat Restoration Suggestions — ${selectedSite.site_name}`}>
            {detailLoading ? (
              <p className="text-sm text-canopy-600">Loading…</p>
            ) : restoration && restoration.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-canopy-800 space-y-1.5">
                {restoration.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-canopy-600">
                No restoration action triggered — this site's habitat proxy isn't flagged 'declining'.
              </p>
            )}
          </Card>

          <Card title={`Wildlife Protection Strategies — ${selectedSite.site_name}`}>
            {detailLoading ? (
              <p className="text-sm text-canopy-600">Loading…</p>
            ) : protection && protection.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-canopy-800 space-y-1.5">
                {protection.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-canopy-600">No rare/vulnerable species flagged at this site right now.</p>
            )}
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Monitoring Optimization" subtitle="Sensor / camera-trap reallocation suggestions by relative traffic.">
          {!loading && optimization.length === 0 && <p className="text-sm text-canopy-600">No data yet.</p>}
          <ul className="divide-y divide-canopy-100">
            {optimization.map((o) => (
              <li key={o.site_id} className="py-2 text-sm">
                <p className="text-bark-900">{o.site_name}</p>
                <p className="text-xs text-canopy-600">{o.suggestion}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Resource Allocation Recommendations" subtitle="Priority + monitoring signal combined into one action per site.">
          {!loading && allocation.length === 0 && <p className="text-sm text-canopy-600">No data yet.</p>}
          <ul className="divide-y divide-canopy-100">
            {allocation.map((a) => (
              <li key={a.site_id} className="py-2 text-sm">
                <p className="text-bark-900">{a.site_name}</p>
                <p className="text-xs text-canopy-600">{a.recommended_action}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
