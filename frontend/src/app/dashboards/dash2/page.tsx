"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

/* ============================================================
   Types
   ============================================================ */

type Role =
  | "Wildlife Researcher"
  | "Conservation Officer"
  | "Forest Department Officer"
  | "Administrator";

type Site = {
  id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  habitat_type?: string;
  protected_area?: string;
};

type Survey = {
  id: number;
  site_id: number;
  survey_date: string;
  status: string;
  notes?: string;
};

type Device = {
  id: number;
  site_id: number;
  device_type: string;
  serial_number: string;
};

type Observation = {
  id: number;
  survey_id: number;
  file_type: string; // "image" | "audio" | ...
  uploaded_at: string;
  processing_status: string;
};

type TabKey =
  | "dashboard"
  | "sites"
  | "surveys"
  | "devices"
  | "observations"
  | "administration"
  | "forest"
  | "conservation";

/* ============================================================
   Role permissions
   NOTE: this only controls what's *shown*. The backend must still
   enforce real authorization on every endpoint — never rely on the
   UI alone to protect writes/reads.
   ============================================================ */

const CAN_MANAGE_ROLES: Role[] = ["Wildlife Researcher", "Administrator"];

function canManage(role?: string) {
  return CAN_MANAGE_ROLES.includes(role as Role);
}

/* ============================================================
   Small shared UI primitives
   ============================================================ */

const inputClass =
  "w-full px-4 py-2 text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPending = status === "pending";
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
        isPending ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
      <p className={`text-4xl font-bold mt-3 ${colorClass}`}>{value}</p>
    </div>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8 text-center text-slate-500">
        {text}
      </td>
    </tr>
  );
}

/* ============================================================
   Main component
   ============================================================ */

export default function UnifiedDashboard() {
  const { user, logout } = useAuth();
  const role = user?.role as Role | undefined;

  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  // Data
  const [sites, setSites] = useState<Site[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);

  // Forms
  const [siteForm, setSiteForm] = useState({
    location_name: "",
    latitude: "",
    longitude: "",
    habitat_type: "",
    protected_area: "",
  });

  const [surveyForm, setSurveyForm] = useState({
    site_id: "",
    survey_date: "",
    notes: "",
  });

  const [deviceForm, setDeviceForm] = useState({
    site_id: "",
    device_type: "camera_trap",
    serial_number: "",
  });

  const [uploadForm, setUploadForm] = useState<{ survey_id: string; file: File | null }>({
    survey_id: "",
    file: null,
  });

  /* ---------- Data loading ---------- */

  const fetchData = useCallback(async () => {
    try {
      const [sitesRes, surveysRes, devicesRes, obsRes] = await Promise.all([
        api.get("/monitoring/sites"),
        api.get("/monitoring/surveys"),
        api.get("/monitoring/devices"),
        api.get("/observations"),
      ]);
      setSites(sitesRes.data);
      setSurveys(surveysRes.data);
      setDevices(devicesRes.data);
      setObservations(obsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      showMessage("error", "Failed to load dashboard data.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-dismiss toast messages
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
  }

  /* ---------- Lookups ---------- */

  const siteNameById = (id: number) => sites.find((s) => s.id === id)?.location_name ?? `#${id}`;

  const deviceInfoForSurvey = (surveyId: number) => {
    const survey = surveys.find((s) => s.id === surveyId);
    if (!survey) return null;
    return devices.find((d) => d.site_id === survey.site_id) ?? null;
  };

  /* ---------- Mutations ---------- */

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(siteForm.latitude);
    const lng = parseFloat(siteForm.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      showMessage("error", "Latitude and longitude must be valid numbers.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/monitoring/sites", {
        ...siteForm,
        latitude: lat,
        longitude: lng,
      });
      showMessage("success", "Monitoring site created.");
      setSiteForm({
        location_name: "",
        latitude: "",
        longitude: "",
        habitat_type: "",
        protected_area: "",
      });
      await fetchData();
    } catch (err) {
      console.error(err);
      showMessage("error", "Unable to create site.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyForm.site_id) {
      showMessage("error", "Please select a site.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/monitoring/surveys", {
        ...surveyForm,
        site_id: Number(surveyForm.site_id),
      });
      showMessage("success", "Survey registered.");
      setSurveyForm({ site_id: "", survey_date: "", notes: "" });
      await fetchData();
    } catch (err) {
      console.error(err);
      showMessage("error", "Unable to register survey.");
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceForm.site_id || !deviceForm.serial_number.trim()) {
      showMessage("error", "Please select a site and enter a serial number.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/monitoring/devices", {
        ...deviceForm,
        site_id: Number(deviceForm.site_id),
      });
      showMessage("success", "Device registered.");
      setDeviceForm({ site_id: "", device_type: "camera_trap", serial_number: "" });
      await fetchData();
    } catch (err) {
      console.error(err);
      showMessage("error", "Unable to register device (serial number may already exist).");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.survey_id) {
      showMessage("error", "Please select a survey and a file.");
      return;
    }

    const formData = new FormData();
    formData.append("survey_id", uploadForm.survey_id);
    formData.append("file", uploadForm.file);

    setSaving(true);
    try {
      await api.post("/observations/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showMessage("success", "Observation uploaded.");
      setUploadForm({ survey_id: "", file: null });
      await fetchData();
    } catch (err) {
      console.error(err);
      showMessage("error", "Upload failed (check file format/size).");
    } finally {
      setSaving(false);
    }
  };

  const handleViewFile = async (obsId: number, fileType: string) => {
    try {
      const response = await api.get(`/observations/${obsId}/file`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));

      if (fileType === "image") {
        setViewingFileUrl(url);
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `observation_${obsId}`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to access file", err);
      showMessage("error", "Failed to access file. You may not have permission.");
    }
  };

  /* ---------- Menu (role-aware) ---------- */

  const menuItems: { key: TabKey; label: string }[] = [
    { key: "dashboard", label: "🏠 Dashboard" },
    { key: "sites", label: "📍 Monitoring Sites" },
    { key: "surveys", label: "📝 Surveys" },
    { key: "devices", label: "📷 Devices" },
    { key: "observations", label: "🦁 Observations" },
    ...(role === "Administrator" ? [{ key: "administration" as TabKey, label: "👤 Administration" }] : []),
    ...(role === "Forest Department Officer"
      ? [{ key: "forest" as TabKey, label: "🌳 Forest Officer" }]
      : []),
    ...(role === "Conservation Officer"
      ? [{ key: "conservation" as TabKey, label: "🌿 Conservation Officer" }]
      : []),
  ];

  /* ---------- Tab content ---------- */

  function renderDashboard() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Monitoring Sites" value={sites.length} colorClass="text-green-700" />
        <StatCard label="Surveys" value={surveys.length} colorClass="text-blue-700" />
        <StatCard label="Devices" value={devices.length} colorClass="text-orange-600" />
        <StatCard label="Observations" value={observations.length} colorClass="text-purple-700" />
      </div>
    );
  }

  function renderSites() {
    const canWrite = canManage(role);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
        {canWrite && (
          <>
            <h2 className="text-xl font-bold text-slate-800">Create Monitoring Site</h2>
            <form onSubmit={handleCreateSite} className="grid md:grid-cols-2 gap-4">
              <Field label="Location Name">
                <input
                  required
                  className={inputClass}
                  value={siteForm.location_name}
                  onChange={(e) => setSiteForm({ ...siteForm, location_name: e.target.value })}
                />
              </Field>
              <Field label="Habitat Type">
                <input
                  className={inputClass}
                  value={siteForm.habitat_type}
                  onChange={(e) => setSiteForm({ ...siteForm, habitat_type: e.target.value })}
                />
              </Field>
              <Field label="Latitude">
                <input
                  required
                  type="number"
                  step="any"
                  className={inputClass}
                  value={siteForm.latitude}
                  onChange={(e) => setSiteForm({ ...siteForm, latitude: e.target.value })}
                />
              </Field>
              <Field label="Longitude">
                <input
                  required
                  type="number"
                  step="any"
                  className={inputClass}
                  value={siteForm.longitude}
                  onChange={(e) => setSiteForm({ ...siteForm, longitude: e.target.value })}
                />
              </Field>
              <Field label="Protected Area">
                <input
                  className={inputClass}
                  value={siteForm.protected_area}
                  onChange={(e) => setSiteForm({ ...siteForm, protected_area: e.target.value })}
                />
              </Field>
              <div className="flex items-end">
                <button
                  disabled={saving}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg p-3 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Site"}
                </button>
              </div>
            </form>
            <hr className="border-slate-100" />
          </>
        )}

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Monitoring Sites</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-sm">
                  <th className="py-3 px-4 font-medium">Location</th>
                  <th className="py-3 px-4 font-medium">Habitat</th>
                  <th className="py-3 px-4 font-medium">Protected Area</th>
                  <th className="py-3 px-4 font-medium">Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-900">{site.location_name}</td>
                    <td className="py-3 px-4 text-slate-600 text-sm">{site.habitat_type || "—"}</td>
                    <td className="py-3 px-4 text-slate-600 text-sm">{site.protected_area || "—"}</td>
                    <td className="py-3 px-4 text-slate-600 text-sm">
                      {site.latitude}, {site.longitude}
                    </td>
                  </tr>
                ))}
                {sites.length === 0 && <EmptyRow colSpan={4} text="No monitoring sites yet." />}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderSurveys() {
    const canWrite = canManage(role);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
        {canWrite && (
          <>
            <h2 className="text-xl font-bold text-slate-800">Register Survey</h2>
            <form onSubmit={handleCreateSurvey} className="grid md:grid-cols-2 gap-4">
              <Field label="Site">
                <select
                  required
                  className={inputClass}
                  value={surveyForm.site_id}
                  onChange={(e) => setSurveyForm({ ...surveyForm, site_id: e.target.value })}
                >
                  <option value="">Select Site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.location_name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Survey Date">
                <input
                  required
                  type="date"
                  className={inputClass}
                  value={surveyForm.survey_date}
                  onChange={(e) => setSurveyForm({ ...surveyForm, survey_date: e.target.value })}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Notes">
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={surveyForm.notes}
                    onChange={(e) => setSurveyForm({ ...surveyForm, notes: e.target.value })}
                  />
                </Field>
              </div>
              <button
                disabled={saving}
                className="md:col-span-2 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg p-3 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Register Survey"}
              </button>
            </form>
            <hr className="border-slate-100" />
          </>
        )}

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Surveys</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-sm">
                  <th className="py-3 px-4 font-medium">Site</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-900 font-medium">{siteNameById(s.site_id)}</td>
                    <td className="py-3 px-4 text-slate-600 text-sm">{s.survey_date}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
                {surveys.length === 0 && <EmptyRow colSpan={3} text="No surveys registered yet." />}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderDevices() {
    const canWrite = canManage(role);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
        {canWrite && (
          <>
            <h2 className="text-xl font-bold text-slate-800">Register Device</h2>
            <form onSubmit={handleRegisterDevice} className="grid md:grid-cols-2 gap-4">
              <Field label="Site">
                <select
                  required
                  className={inputClass}
                  value={deviceForm.site_id}
                  onChange={(e) => setDeviceForm({ ...deviceForm, site_id: e.target.value })}
                >
                  <option value="">Select Site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.location_name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Device Type">
                <select
                  className={inputClass}
                  value={deviceForm.device_type}
                  onChange={(e) => setDeviceForm({ ...deviceForm, device_type: e.target.value })}
                >
                  <option value="camera_trap">Camera Trap</option>
                  <option value="audio_recorder">Audio Recorder</option>
                  <option value="drone">Drone</option>
                  <option value="satellite">Satellite</option>
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Serial Number">
                  <input
                    required
                    className={inputClass}
                    value={deviceForm.serial_number}
                    onChange={(e) => setDeviceForm({ ...deviceForm, serial_number: e.target.value })}
                  />
                </Field>
              </div>
              <button
                disabled={saving}
                className="md:col-span-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg p-3 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Register Device"}
              </button>
            </form>
            <hr className="border-slate-100" />
          </>
        )}

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Devices</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-sm">
                  <th className="py-3 px-4 font-medium">Site</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Serial</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-900 font-medium">{siteNameById(device.site_id)}</td>
                    <td className="py-3 px-4 text-slate-600 text-sm capitalize">
                      {device.device_type.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-sm font-mono">{device.serial_number}</td>
                  </tr>
                ))}
                {devices.length === 0 && <EmptyRow colSpan={3} text="No devices registered yet." />}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderObservations() {
    const canWrite = canManage(role);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
        {canWrite && (
          <>
            <h2 className="text-xl font-bold text-slate-800">Upload Observation</h2>
            <form onSubmit={handleUpload} className="grid md:grid-cols-2 gap-4">
              <Field label="Survey">
                <select
                  required
                  className={inputClass}
                  value={uploadForm.survey_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, survey_id: e.target.value })}
                >
                  <option value="">Select Survey</option>
                  {surveys.map((survey) => (
                    <option key={survey.id} value={survey.id}>
                      Survey #{survey.id} · {siteNameById(survey.site_id)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="File (image/audio, max 50MB)">
                <input
                  required
                  type="file"
                  accept="image/*,audio/*"
                  className={`${inputClass} file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100`}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, file: e.target.files?.[0] ?? null })
                  }
                />
              </Field>
              <button
                disabled={saving}
                className="md:col-span-2 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-lg p-3 transition-colors disabled:opacity-50"
              >
                {saving ? "Uploading..." : "Upload Observation"}
              </button>
            </form>
            <hr className="border-slate-100" />
          </>
        )}

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Observation History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-sm">
                  <th className="py-3 px-4 font-medium">Survey</th>
                  <th className="py-3 px-4 font-medium">Device</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Uploaded</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((obs) => {
                  const device = deviceInfoForSurvey(obs.survey_id);
                  return (
                    <tr key={obs.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        Survey #{obs.survey_id} · {siteNameById(surveys.find((s) => s.id === obs.survey_id)?.site_id ?? -1)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        {device ? (
                          <>
                            <span className="capitalize block">{device.device_type.replace("_", " ")}</span>
                            <span className="text-xs text-slate-400 font-mono">{device.serial_number}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm capitalize">{obs.file_type}</td>
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        {new Date(obs.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={obs.processing_status} />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewFile(obs.id, obs.file_type)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {obs.file_type === "image" ? "View" : "Download"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {observations.length === 0 && <EmptyRow colSpan={6} text="No observations uploaded yet." />}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderAdministration() {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Administrator Panel</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-slate-600 text-sm font-medium">Total Users</h3>
            <p className="text-4xl font-bold mt-3 text-blue-700">24</p>
          </div>
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-slate-600 text-sm font-medium">Researchers</h3>
            <p className="text-4xl font-bold mt-3 text-green-700">10</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6">
            <h3 className="text-slate-600 text-sm font-medium">Forest Officers</h3>
            <p className="text-4xl font-bold mt-3 text-yellow-700">8</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-6">
            <h3 className="text-slate-600 text-sm font-medium">Conservation Officers</h3>
            <p className="text-4xl font-bold mt-3 text-purple-700">6</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          These figures are placeholders — wire this panel up to a real{" "}
          <code className="font-mono">/admin/user-stats</code> endpoint when available.
        </p>
      </div>
    );
  }

  function renderForestOfficer() {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Forest Department Officer</h2>
        <ul className="list-disc ml-6 space-y-2 text-slate-700">
          <li>Assigned Monitoring Sites</li>
          <li>Forest Patrol Records</li>
          <li>Incident Reports</li>
          <li>Camera Trap Status</li>
          <li>Protected Area Monitoring</li>
        </ul>
      </div>
    );
  }

  function renderConservationOfficer() {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Conservation Officer</h2>
        <ul className="list-disc ml-6 space-y-2 text-slate-700">
          <li>Habitat Health Overview</li>
          <li>Biodiversity Trends</li>
          <li>Species Distribution</li>
          <li>Conservation Alerts</li>
          <li>Population Monitoring Summary</li>
        </ul>
      </div>
    );
  }

  function renderContent() {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "sites":
        return renderSites();
      case "surveys":
        return renderSurveys();
      case "devices":
        return renderDevices();
      case "observations":
        return renderObservations();
      case "administration":
        return renderAdministration();
      case "forest":
        return renderForestOfficer();
      case "conservation":
        return renderConservationOfficer();
      default:
        return null;
    }
  }

  /* ---------- Layout ---------- */

  return (
    <ProtectedRoute
      allowedRoles={[
        "Wildlife Researcher",
        "Conservation Officer",
        "Forest Department Officer",
        "Administrator",
      ]}
    >
      <div className="min-h-screen flex bg-slate-50 font-sans">
        {/* Sidebar */}
        <aside className="w-72 bg-green-900 text-white flex-shrink-0">
          <div className="p-6 border-b border-green-700">
            <h1 className="text-xl font-bold leading-tight">Wildlife Population Intelligence System</h1>
            <p className="text-green-200 mt-3">{user?.name}</p>
            <p className="text-sm text-green-300">{role}</p>
          </div>

          <nav className="p-4">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full text-left px-5 py-3 rounded-lg mb-2 transition-colors ${
                  activeTab === item.key ? "bg-green-600" : "hover:bg-green-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <header className="bg-white shadow-sm px-8 py-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Biodiversity Monitoring Dashboard</h2>
              <p className="text-slate-500 mt-1">Unified view for all roles</p>
            </div>
            <button
              onClick={logout}
              className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-medium transition-colors"
            >
              Sign Out
            </button>
          </header>

          <main className="p-8 space-y-6">
            {message && (
              <div
                role="status"
                className={`rounded-xl p-4 border font-medium ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                {message.text}
              </div>
            )}

            {initialLoading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500">
                Loading dashboard…
              </div>
            ) : (
              renderContent()
            )}
          </main>
        </div>

        {/* Image viewer modal */}
        {viewingFileUrl && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative bg-white p-4 rounded-xl max-w-4xl max-h-screen">
              <button
                onClick={() => {
                  window.URL.revokeObjectURL(viewingFileUrl);
                  setViewingFileUrl(null);
                }}
                className="absolute -top-4 -right-4 bg-rose-500 text-white rounded-full p-2 hover:bg-rose-600 font-bold w-9 h-9 flex items-center justify-center"
                aria-label="Close"
              >
                ✕
              </button>
              <img src={viewingFileUrl} alt="Observation" className="max-w-full max-h-[80vh] rounded-lg" />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}