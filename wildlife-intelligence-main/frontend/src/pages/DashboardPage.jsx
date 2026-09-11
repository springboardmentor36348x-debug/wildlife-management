import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const ROLE_GREETING = {
  administrator: { emoji: "⚙️", title: "System Administration", sub: "Platform overview & management" },
  researcher: { emoji: "🔬", title: "Research Hub", sub: "Species analytics & field data" },
  conservation_officer: { emoji: "🛡️", title: "Conservation Command", sub: "Threat monitoring & protection" },
  forest_department: { emoji: "🌲", title: "Forest Operations", sub: "Field operations & incident tracking" },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [threats, setThreats] = useState([]);
  const [health, setHealth] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const greeting = ROLE_GREETING[user?.role] || ROLE_GREETING.researcher;

  useEffect(() => {
    api.getReportSummary().then(setSummary).catch(() => {});
    api.getThreats().then(setThreats).catch(() => {});
    api.getHealthScore().then(setHealth).catch(() => {});
    api.listIncidents().then(setIncidents).catch(() => {});
    if (user?.role === "administrator") {
      api.getPlatformAnalytics().then(setAnalytics).catch(() => {});
    }
  }, [user]);

  return (
    <div>
      <div className="page-header">
        <h1>{greeting.emoji} {greeting.title}</h1>
        <p>Welcome back, {user?.full_name}. {greeting.sub}.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon purple">📷</div>
          <div>
            <div className="stat-value">{summary?.images_analyzed ?? "—"}</div>
            <div className="stat-label">Images Analyzed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">🎙️</div>
          <div>
            <div className="stat-value">{summary?.audio_clips ?? "—"}</div>
            <div className="stat-label">Audio Clips</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon emerald">🦁</div>
          <div>
            <div className="stat-value">{summary?.species_confirmed ?? "—"}</div>
            <div className="stat-label">Species Confirmed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">📍</div>
          <div>
            <div className="stat-value">{summary?.total_monitoring_sites ?? "—"}</div>
            <div className="stat-label">Monitoring Sites</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Ecosystem Health */}
        <div className="card">
          <h3 className="section-title">🌿 Ecosystem Health</h3>
          {health ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <div className="stat-value" style={{ fontSize: "2.5rem", color: health.ecosystem_health_score >= 70 ? "var(--accent-emerald)" : health.ecosystem_health_score >= 40 ? "var(--accent-amber)" : "var(--accent-rose)" }}>
                  {Math.round(health.ecosystem_health_score)}
                </div>
                <div>
                  <span className={`badge ${health.ecosystem_health_score >= 70 ? "badge-emerald" : health.ecosystem_health_score >= 40 ? "badge-amber" : "badge-rose"}`}>
                    {health.conservation_status || "Unknown"}
                  </span>
                  <p className="text-muted text-xs mt-1">Overall ecosystem score</p>
                </div>
              </div>
              {health.components && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {Object.entries(health.components).map(([key, val]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--border-default)" }}>
                      <span className="text-xs text-muted" style={{ textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                      <span className="text-xs font-mono font-bold">{typeof val === "number" ? Math.round(val) : Math.round(val?.score || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted text-sm">Loading health data…</p>
          )}
        </div>

        {/* Threat Alerts */}
        <div className="card">
          <h3 className="section-title">⚠️ Active Threats ({threats.length})</h3>
          {threats.length > 0 ? (
            <div style={{ maxHeight: 250, overflowY: "auto" }}>
              {threats.slice(0, 6).map((t, i) => (
                <div key={i} style={{ padding: "0.6rem 0", borderBottom: "1px solid var(--border-default)" }}>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${t.severity === "critical" ? "badge-rose" : t.severity === "high" ? "badge-amber" : "badge-slate"}`}>
                      {t.severity || t.threat_level || "info"}
                    </span>
                    <span className="text-sm font-semibold">{t.title || t.species || "Alert"}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">{t.description || t.recommendation || ""}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No active threats detected.</p>
          )}
        </div>
      </div>

      {/* Species Breakdown */}
      {summary?.species_breakdown?.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3 className="section-title">🧬 Species Breakdown</h3>
          <div className="grid grid-3">
            {summary.species_breakdown.map((s) => (
              <div key={s.species} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "rgba(124,58,237,0.04)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
                <span className="text-sm font-semibold" style={{ textTransform: "capitalize" }}>{s.species}</span>
                <span className="font-mono font-bold text-sm" style={{ color: "var(--accent-cyan-light)" }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      {incidents.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3 className="section-title">🚨 Recent Incidents</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.slice(0, 5).map((inc) => (
                  <tr key={inc.id}>
                    <td className="font-semibold">{inc.title}</td>
                    <td><span className="badge badge-slate">{inc.incident_type?.replace(/_/g, " ")}</span></td>
                    <td><span className={`badge ${inc.severity === "critical" ? "badge-rose" : inc.severity === "high" ? "badge-amber" : "badge-slate"}`}>{inc.severity}</span></td>
                    <td><span className={`badge ${inc.status === "resolved" ? "badge-emerald" : inc.status === "open" ? "badge-rose" : "badge-amber"}`}>{inc.status?.replace(/_/g, " ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Platform Analytics */}
      {user?.role === "administrator" && analytics && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3 className="section-title">📊 Platform Analytics</h3>
          <div className="grid grid-4">
            {[
              { label: "Total Users", value: analytics.total_users, color: "purple" },
              { label: "Active Users", value: analytics.active_users, color: "emerald" },
              { label: "Observations", value: analytics.total_observations_logged, color: "cyan" },
              { label: "Detection Rate", value: `${analytics.detection_success_rate_pct}%`, color: "amber" },
              { label: "Open Incidents", value: analytics.open_incidents, color: "rose" },
              { label: "Reports Generated", value: analytics.reports_generated, color: "purple" },
              { label: "Storage Used", value: `${analytics.storage_used_mb} MB`, color: "cyan" },
              { label: "System Status", value: analytics.system_status, color: "emerald" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", background: "var(--glass-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
                <span className="text-xs text-muted">{item.label}</span>
                <span className="font-mono font-bold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
