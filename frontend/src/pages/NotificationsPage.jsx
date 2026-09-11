import { useEffect, useState } from "react";
import { api } from "../api/client";

const TYPE_LABELS = {
  endangered_species: "Endangered Species",
  population_decline: "Population Decline",
  habitat_degradation: "Habitat Degradation",
  monitoring_device: "Monitoring Device",
  conservation: "Conservation",
};

function SeverityBadge({ severity }) {
  const cls = severity === "critical" ? "badge-high" : severity === "warning" ? "badge-med" : "badge-low";
  return <span className={`badge ${cls}`}>{severity}</span>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");

  function load() {
    setLoading(true);
    api
      .listNotifications()
      .then(setNotifications)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function markRead(id) {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const visible = notifications.filter((n) => filterType === "all" || n.alert_type === filterType);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-bark-900">Notifications &amp; Alerts</h1>
          <p className="text-canopy-700 text-sm mt-1">
            Endangered species, population decline, habitat degradation, monitoring device, and conservation
            alerts — every one derived live from real survey/observation data (Milestone 4, FR-12).
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary whitespace-nowrap" onClick={markAllRead}>
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="flex flex-wrap gap-2">
        {["all", ...Object.keys(TYPE_LABELS)].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filterType === t
                ? "bg-canopy-800 text-white border-canopy-800"
                : "bg-white text-canopy-700 border-canopy-200 hover:bg-canopy-50"
            }`}
          >
            {t === "all" ? "All" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-canopy-100">
        {loading && <p className="text-sm text-canopy-600 p-6">Scanning for alert conditions…</p>}
        {!loading && visible.length === 0 && (
          <p className="text-sm text-canopy-600 p-6 text-center">
            No alerts of this type right now — that's a good sign.
          </p>
        )}
        {visible.map((n) => (
          <div key={n.id} className={`p-4 flex items-start justify-between gap-4 ${n.is_read ? "opacity-60" : ""}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={n.severity} />
                <span className="badge badge-low">{TYPE_LABELS[n.alert_type] || n.alert_type}</span>
                <p className="font-semibold text-bark-900 text-sm">{n.title}</p>
              </div>
              <p className="text-sm text-canopy-700 mt-1">{n.message}</p>
              <p className="text-xs text-canopy-500 mt-1">
                {n.site_name ? `${n.site_name} · ` : ""}
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
            {!n.is_read && (
              <button className="btn-secondary text-xs whitespace-nowrap" onClick={() => markRead(n.id)}>
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
