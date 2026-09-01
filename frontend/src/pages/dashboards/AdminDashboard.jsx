import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { DeviceStatusDoughnutChart } from "../../components/Charts";
import { RoleBadge } from "../../components/Badges";
import {
  Users,
  BarChart3,
  Cpu,
  FileSpreadsheet,
  UserPlus,
  ShieldCheck,
  Radio,
  BatteryCharging,
  HardDrive,
  Download,
  CheckCircle,
  AlertCircle,
  Activity,
  Layers,
  FileText,
  Clock,
  X,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users"); // users | analytics | devices | reports

  // State
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [deviceData, setDeviceData] = useState({ summary: {}, devices: [] });
  const [reportHistory, setReportHistory] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);

  // Create User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "researcher",
    organization: "Wildlife Population Intelligence System",
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Generate Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportGenConfig, setReportGenConfig] = useState({
    title: "",
    report_type: "wildlife_survey",
    format: "pdf",
  });
  const [generatingReport, setGeneratingReport] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAllAdminData = () => {
    setLoading(true);
    setError("");

    Promise.all([
      api.listUsers().catch(() => []),
      api.getPlatformAnalytics().catch(() => null),
      api.getDeviceManagement().catch(() => ({ summary: {}, devices: [] })),
      api.listReportHistory(20).catch(() => []),
      api.getReportTypes().catch(() => []),
    ])
      .then(([u, a, d, r, t]) => {
        setUsers(u || []);
        setAnalytics(a);
        setDeviceData(d || { summary: {}, devices: [] });
        setReportHistory(r || []);
        setReportTypes(t || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await api.deactivateUser(userId);
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: false } : u)));
    } catch (err) {
      alert(`Deactivation failed: ${err.message}`);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const created = await api.adminCreateUser(newUser);
      setUsers([created, ...users]);
      setShowUserModal(false);
      setNewUser({
        full_name: "",
        email: "",
        password: "",
        role: "researcher",
        organization: "Wildlife Population Intelligence System",
      });
    } catch (err) {
      alert(`User creation failed: ${err.message}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleGenerateReportSubmit = async (e) => {
    e.preventDefault();
    setGeneratingReport(true);
    try {
      const generated = await api.generateReport({
        title: reportGenConfig.title || undefined,
        report_type: reportGenConfig.report_type,
        format: reportGenConfig.format,
      });
      setReportHistory([generated, ...reportHistory]);
      setShowReportModal(false);
      // Auto trigger download
      await api.triggerReportDownload(generated.id, `${generated.title}.${generated.file_format === "pdf" ? "pdf" : "xlsx"}`);
    } catch (err) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-canopy-950 to-canopy-900 p-6 rounded-2xl text-white shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-ochre-400/20 text-ochre-300 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight">Platform Administration Console</h1>
          </div>
          <p className="text-canopy-200 text-sm mt-1 max-w-2xl">
            Centralized RBAC authorization, telemetry stream throughput, IoT sensor fleet health, and compliance report generation.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center bg-black/40 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          {[
            { key: "users", label: "User Management", icon: Users, badge: users.length },
            { key: "analytics", label: "Platform Analytics", icon: BarChart3 },
            { key: "devices", label: "Hardware Nodes", icon: Cpu, badge: deviceData.summary?.online },
            { key: "reports", label: "Report Generator", icon: FileSpreadsheet },
          ].map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === key
                  ? "bg-ochre-400 text-bark-950 shadow-md"
                  : "text-canopy-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === key ? "bg-bark-900 text-white" : "bg-canopy-800 text-canopy-200"
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

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-canopy-100 text-canopy-800 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Active Users</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{analytics?.active_users ?? users.length}</p>
            <p className="text-[11px] text-canopy-700">{users.length} total registered</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-ochre-400/20 text-ochre-600 rounded-xl">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Hardware Online</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">
              {deviceData.summary?.online ?? 0}
            </p>
            <p className="text-[11px] text-canopy-700">Out of {deviceData.summary?.total ?? 0} sensor nodes</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">AI Detections</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{analytics?.detections_processed ?? 0}</p>
            <p className="text-[11px] text-emerald-700">{analytics?.detection_success_rate_pct ?? 100}% verified rate</p>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-canopy-600 tracking-wider">Storage Volume</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-0.5">{analytics?.storage_used_mb ?? 0} MB</p>
            <p className="text-[11px] text-blue-700">Datasets &amp; telemetry</p>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: USER MANAGEMENT ================= */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-canopy-100">
              <div>
                <h2 className="font-display font-bold text-bark-900 text-lg">System User Directory &amp; RBAC Roles</h2>
                <p className="text-xs text-canopy-600">
                  Provision new personnel, manage organizational access, and modify role permissions.
                </p>
              </div>

              <button
                onClick={() => setShowUserModal(true)}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provision New User</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left uppercase text-canopy-600 border-b border-canopy-100 pb-2">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Role</th>
                    <th className="py-2.5">Organization</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canopy-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-canopy-50/50">
                      <td className="py-3 font-semibold text-bark-900">{u.full_name}</td>
                      <td className="py-3 text-canopy-700 font-mono">{u.email}</td>
                      <td className="py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="py-3 text-canopy-600">{u.organization || "—"}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.is_active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {u.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {u.is_active && (
                          <button
                            onClick={() => handleDeactivateUser(u.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: PLATFORM ANALYTICS ================= */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-5">
              <h3 className="font-display font-bold text-bark-900 text-base mb-3">System Health &amp; Gateway</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-canopy-100">
                  <span className="text-canopy-600">Core Services Status</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online &amp; Operational
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-canopy-100">
                  <span className="text-canopy-600">API Gateway Uptime</span>
                  <span className="font-bold text-bark-900">{analytics?.api_gateway_uptime_pct ?? 99.98}%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-canopy-100">
                  <span className="text-canopy-600">Total Observations Ingested</span>
                  <span className="font-bold text-bark-900">{analytics?.total_observations_logged ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-canopy-100">
                  <span className="text-canopy-600">External Datasets Registered</span>
                  <span className="font-bold text-bark-900">{analytics?.dataset_files_uploaded ?? 0} files</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-canopy-600">Generated Reports Archived</span>
                  <span className="font-bold text-bark-900">{analytics?.reports_generated ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display font-bold text-bark-900 text-base mb-3">User Role Distribution</h3>
              <div className="space-y-2.5 text-xs">
                {Object.entries(analytics?.role_distribution || {}).map(([roleKey, count]) => (
                  <div key={roleKey} className="flex items-center justify-between p-2 rounded-lg bg-canopy-50/60">
                    <span className="capitalize font-semibold text-bark-800">{roleKey.replace("_", " ")}</span>
                    <span className="font-bold text-canopy-800 bg-white px-2 py-0.5 rounded-md border border-canopy-200">
                      {count} user(s)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display font-bold text-bark-900 text-base mb-1">Hardware Sensor Fleet Status</h3>
              <p className="text-xs text-canopy-600 mb-2">Real-time status of all camera and acoustic units.</p>
              <DeviceStatusDoughnutChart summary={deviceData.summary || {}} />
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: HARDWARE MONITORING ================= */}
      {activeTab === "devices" && (
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-display font-bold text-bark-900 text-lg mb-1">Monitoring Hardware Sensor Fleet</h2>
            <p className="text-xs text-canopy-600 mb-4">
              Real-time operational status, battery voltage telemetry, and collected observation counts per node.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deviceData.devices.map((dev) => {
                const isOnline = dev.status === "online";
                const isLow = dev.status === "low_battery";

                return (
                  <div
                    key={dev.site_id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isOnline
                        ? "bg-white border-canopy-200"
                        : isLow
                        ? "bg-amber-50/60 border-amber-200"
                        : "bg-red-50/60 border-red-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-bark-900 text-sm truncate">{dev.site_name}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isOnline
                              ? "bg-emerald-100 text-emerald-800"
                              : isLow
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {dev.status.replace("_", " ")}
                        </span>
                      </div>

                      <p className="text-xs text-canopy-600">{dev.survey_name || "General Survey"}</p>
                      <p className="text-[11px] text-canopy-500 uppercase font-semibold mt-1">
                        Type: {dev.device_type.replace("_", " ")}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-canopy-600 flex items-center gap-1">
                          <BatteryCharging className="w-3.5 h-3.5" /> Battery:
                        </span>
                        <span className="font-bold text-bark-900">{dev.battery_pct}%</span>
                      </div>
                      <div className="w-full bg-canopy-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            dev.battery_pct > 50 ? "bg-emerald-500" : dev.battery_pct > 20 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${dev.battery_pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-canopy-100 flex items-center justify-between text-[11px] text-canopy-500">
                      <span>Obs Collected: {dev.observations_collected}</span>
                      <span>Slot: {dev.storage_slot}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: REPORT GENERATOR ================= */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-canopy-100">
              <div>
                <h2 className="font-display font-bold text-bark-900 text-lg">Official Conservation Report Generator</h2>
                <p className="text-xs text-canopy-600">
                  Generate and download audit-ready PDF and Excel multi-sheet reports from live engine data.
                </p>
              </div>

              <button
                onClick={() => setShowReportModal(true)}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Generate New Report</span>
              </button>
            </div>

            {/* Supported Report Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {reportTypes.map((rt) => (
                <div key={rt.type} className="p-4 bg-canopy-50/50 rounded-xl border border-canopy-200 flex flex-col justify-between">
                  <div>
                    <span className="text-xs uppercase font-bold text-ochre-700">{rt.type.replace("_", " ")}</span>
                    <h3 className="font-display font-bold text-bark-900 text-sm mt-0.5">{rt.name}</h3>
                    <p className="text-xs text-canopy-700 mt-1">{rt.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setReportGenConfig({ title: "", report_type: rt.type, format: "pdf" });
                      setShowReportModal(true);
                    }}
                    className="mt-3 text-xs text-canopy-800 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Generate this report</span> &rarr;
                  </button>
                </div>
              ))}
            </div>

            {/* Generated Reports History */}
            <h3 className="font-display font-bold text-bark-900 text-base mb-2">Past Generated Reports</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left uppercase text-canopy-600 border-b border-canopy-100 pb-2">
                    <th className="py-2.5">Report Title</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Format</th>
                    <th className="py-2.5">Generated At</th>
                    <th className="py-2.5">Downloads</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canopy-100">
                  {reportHistory.map((r) => (
                    <tr key={r.id} className="hover:bg-canopy-50/50">
                      <td className="py-3 font-semibold text-bark-900">{r.title}</td>
                      <td className="py-3 uppercase text-canopy-700">{r.report_type.replace("_", " ")}</td>
                      <td className="py-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md uppercase text-[10px] ${
                            r.file_format === "pdf" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {r.file_format}
                        </span>
                      </td>
                      <td className="py-3 text-canopy-600">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="py-3 text-bark-800 font-bold">{r.download_count}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() =>
                            api.triggerReportDownload(r.id, `${r.title}.${r.file_format === "pdf" ? "pdf" : "xlsx"}`)
                          }
                          className="btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PROVISION USER ================= */}
      {showUserModal && (
        <div className="fixed inset-0 bg-bark-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card max-w-md w-full p-6 shadow-xl relative bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-canopy-100">
              <h3 className="font-display font-bold text-bark-900 text-lg">Provision New User Account</h3>
              <button onClick={() => setShowUserModal(false)} className="text-canopy-500 hover:text-bark-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="e.g. Dr. Jane Doe"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. jane.doe@wildlife.org"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Assigned RBAC Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="input"
                >
                  <option value="researcher">Wildlife Researcher</option>
                  <option value="conservation_officer">Conservation Officer</option>
                  <option value="forest_department">Forest Department Officer</option>
                  <option value="administrator">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="label">Organization</label>
                <input
                  type="text"
                  value={newUser.organization}
                  onChange={(e) => setNewUser({ ...newUser, organization: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-canopy-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" disabled={creatingUser} className="btn-primary text-xs">
                  {creatingUser ? "Creating Account..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GENERATE REPORT ================= */}
      {showReportModal && (
        <div className="fixed inset-0 bg-bark-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card max-w-md w-full p-6 shadow-xl relative bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-canopy-100">
              <h3 className="font-display font-bold text-bark-900 text-lg">Generate Structured Export Report</h3>
              <button onClick={() => setShowReportModal(false)} className="text-canopy-500 hover:text-bark-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateReportSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="label">Report Title (Optional)</label>
                <input
                  type="text"
                  value={reportGenConfig.title}
                  onChange={(e) => setReportGenConfig({ ...reportGenConfig, title: e.target.value })}
                  placeholder="Custom title or leave blank for automatic naming"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Report Type *</label>
                <select
                  value={reportGenConfig.report_type}
                  onChange={(e) => setReportGenConfig({ ...reportGenConfig, report_type: e.target.value })}
                  className="input font-semibold"
                >
                  <option value="wildlife_survey">Wildlife Survey Report</option>
                  <option value="species_population">Species Population Report</option>
                  <option value="biodiversity">Biodiversity Assessment Report</option>
                  <option value="habitat_assessment">Habitat Assessment Report</option>
                  <option value="conservation">Conservation Priorities &amp; Action Report</option>
                </select>
              </div>

              <div>
                <label className="label">Export File Format *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
                      reportGenConfig.format === "pdf"
                        ? "bg-red-50/70 border-red-300 text-red-900 font-bold"
                        : "bg-white border-canopy-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={reportGenConfig.format === "pdf"}
                      onChange={() => setReportGenConfig({ ...reportGenConfig, format: "pdf" })}
                    />
                    <span>PDF Document</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
                      reportGenConfig.format === "excel"
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold"
                        : "bg-white border-canopy-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value="excel"
                      checked={reportGenConfig.format === "excel"}
                      onChange={() => setReportGenConfig({ ...reportGenConfig, format: "excel" })}
                    />
                    <span>Excel Workbook (.xlsx)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-canopy-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" disabled={generatingReport} className="btn-primary text-xs">
                  {generatingReport ? "Generating Document..." : "Generate & Download"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
