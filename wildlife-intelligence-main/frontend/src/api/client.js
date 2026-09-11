let API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
if (API_BASE && !API_BASE.endsWith("/api/v1")) {
  API_BASE = API_BASE.replace(/\/+$/, "") + "/api/v1";
}

function getToken() {
  return localStorage.getItem("wpis_token");
}
function getRefreshToken() {
  return localStorage.getItem("wpis_refresh_token");
}
function setTokens(accessToken, refreshToken) {
  localStorage.setItem("wpis_token", accessToken);
  if (refreshToken) localStorage.setItem("wpis_refresh_token", refreshToken);
}
function clearTokens() {
  localStorage.removeItem("wpis_token");
  localStorage.removeItem("wpis_refresh_token");
}

let refreshInFlight = null;

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) { clearTokens(); return null; }
      const data = await res.json();
      localStorage.setItem("wpis_token", data.access_token);
      return data.access_token;
    })
    .finally(() => { refreshInFlight = null; });

  return refreshInFlight;
}

async function request(path, { method = "GET", body, auth = true, _retried = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !_retried && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) return request(path, { method, body, auth, _retried: true });
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.detail || `Request failed with status ${res.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

export const api = {
  // Auth
  login: async (email, password) => {
    const data = await request("/auth/login", { method: "POST", body: { email, password }, auth: false });
    setTokens(data.access_token, data.refresh_token);
    return data;
  },
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  logout: () => clearTokens(),

  // Users (admin)
  listUsers: () => request("/users/"),
  deactivateUser: (id) => request(`/users/${id}/deactivate`, { method: "PATCH" }),

  // Surveys & sites
  listSurveys: () => request("/surveys/"),
  createSurvey: (payload) => request("/surveys/", { method: "POST", body: payload }),
  updateSurvey: (id, payload) => request(`/surveys/${id}`, { method: "PATCH", body: payload }),
  deleteSurvey: (id) => request(`/surveys/${id}`, { method: "DELETE" }),
  listAllSites: () => request("/surveys/sites/all"),
  createSite: (payload) => request("/surveys/sites", { method: "POST", body: payload }),
  listSitesForSurvey: (surveyId) => request(`/surveys/${surveyId}/sites`),

  // Observations
  listObservations: (siteId) => request(`/observations/${siteId ? `?site_id=${siteId}` : ""}`),
  createObservation: (payload) => request("/observations/", { method: "POST", body: payload }),

  // Datasets
  listDatasets: () => request("/datasets/"),
  createDataset: (payload) => request("/datasets/", { method: "POST", body: payload }),
  deleteDataset: (id) => request(`/datasets/${id}`, { method: "DELETE" }),

  // Dataset files
  listDatasetFiles: (datasetId) => request(`/datasets/${datasetId}/files`),
  uploadDatasetFiles: async (datasetId, fileList) => {
    const formData = new FormData();
    for (const file of fileList) formData.append("files", file);
    const token = getToken();
    const res = await fetch(`${API_BASE}/datasets/${datasetId}/files`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = data?.detail || `Upload failed with status ${res.status}`;
      throw new Error(typeof message === "string" ? message : JSON.stringify(message));
    }
    return data;
  },
  deleteDatasetFile: (fileId) => request(`/datasets/files/${fileId}`, { method: "DELETE" }),
  fileUrl: (relativeUrl) => `${API_BASE.replace(/\/api\/v1$/, "")}${relativeUrl}`,

  // Species Recognition
  uploadObservationImage: async (file, { siteId, notes } = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (siteId) formData.append("site_id", siteId);
    if (notes) formData.append("notes", notes);
    const token = getToken();
    const res = await fetch(`${API_BASE}/observations/upload-image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.detail || `Upload failed`);
    return data;
  },
  detectSpecies: (observationId) => request(`/observations/${observationId}/detect`, { method: "POST" }),
  getObservation: (observationId) => request(`/observations/${observationId}`),
  getObservationDetections: (observationId) => request(`/observations/${observationId}/detections`),

  // Bioacoustic Sound Detection
  uploadObservationAudio: async (file, { siteId, notes } = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (siteId) formData.append("site_id", siteId);
    if (notes) formData.append("notes", notes);
    const token = getToken();
    const res = await fetch(`${API_BASE}/observations/upload-audio`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.detail || `Upload failed`);
    return data;
  },
  detectSound: (observationId) => request(`/observations/${observationId}/detect-sound`, { method: "POST" }),

  // Population Intelligence
  getPopulationCounts: (surveyId) => request(`/population/counts${surveyId ? `?survey_id=${surveyId}` : ""}`),
  getPopulationDensity: (surveyId) => request(`/population/density?survey_id=${surveyId}`),
  getPopulationMovement: (species) => request(`/population/movement?species=${encodeURIComponent(species)}`),
  getPopulationTrend: (species, { surveyId, windowDays = 30 } = {}) =>
    request(`/population/trend?species=${encodeURIComponent(species)}&window_days=${windowDays}${surveyId ? `&survey_id=${surveyId}` : ""}`),
  getPopulationDistribution: (surveyId) => request(`/population/distribution${surveyId ? `?survey_id=${surveyId}` : ""}`),

  // Habitat Intelligence
  getHabitatSuitability: (siteId) => request(`/habitat/suitability${siteId ? `?site_id=${siteId}` : ""}`),
  getHabitatClassification: (siteId) => request(`/habitat/sites/${siteId}/classification`),
  getHabitatDegradation: (siteId) => request(`/habitat/sites/${siteId}/degradation`),

  // Conservation
  getThreats: () => request("/conservation/threats"),
  getConservationPriorities: () => request("/conservation/priorities"),
  getMonitoringOptimization: () => request("/conservation/optimization"),
  getResourceAllocation: () => request("/conservation/resources"),
  getConservationRestoration: () => request("/conservation/restoration"),
  updateRestorationStatus: (id, payload) => request(`/conservation/restoration/${id}`, { method: "PATCH", body: payload }),

  // Ecosystem Health
  getHealthScore: ({ siteId, surveyId } = {}) => {
    const params = [];
    if (siteId) params.push(`site_id=${siteId}`);
    if (surveyId) params.push(`survey_id=${surveyId}`);
    return request(`/health/score${params.length ? `?${params.join("&")}` : ""}`);
  },
  getHealthScoreAllSites: () => request("/health/score/all-sites"),

  // Incidents
  listIncidents: ({ siteId, surveyId, incidentType, severity, status } = {}) => {
    const params = [];
    if (siteId) params.push(`site_id=${siteId}`);
    if (surveyId) params.push(`survey_id=${surveyId}`);
    if (incidentType) params.push(`incident_type=${incidentType}`);
    if (severity) params.push(`severity=${severity}`);
    if (status) params.push(`incident_status=${status}`);
    return request(`/incidents/${params.length ? `?${params.join("&")}` : ""}`);
  },
  createIncident: (payload) => request("/incidents/", { method: "POST", body: payload }),
  updateIncident: (incidentId, payload) => request(`/incidents/${incidentId}`, { method: "PATCH", body: payload }),

  // GIS
  getGisSensors: (surveyId) => request(`/gis/sensors${surveyId ? `?survey_id=${surveyId}` : ""}`),
  getGisAllLayers: () => request("/gis/all-layers"),

  // Reports
  getReportSummary: () => request("/reports/summary"),
  listReportRecords: (limit = 25) => request(`/reports/records?limit=${limit}`),
  getReportTypes: () => request("/reports/types"),
  generateReport: (payload) => request("/reports/generate", { method: "POST", body: payload }),
  listReportHistory: (limit = 50) => request(`/reports/history?limit=${limit}`),
  triggerReportDownload: async (reportId, filename = "report") => {
    const token = getToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/reports/${reportId}/download`, { headers });
    if (!res.ok) throw new Error(`Download failed with status ${res.status}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const disposition = res.headers.get("content-disposition");
    let fname = filename;
    if (disposition && disposition.includes("filename=")) {
      fname = disposition.split("filename=")[1].replace(/["']/g, "").trim();
    }
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Admin
  getPlatformAnalytics: () => request("/admin/analytics"),
  getDeviceManagement: () => request("/admin/devices"),
  adminCreateUser: (payload) => request("/admin/users", { method: "POST", body: payload }),
  adminUpdateUser: (userId, payload) => {
    const params = new URLSearchParams();
    if (payload.full_name !== undefined) params.append("full_name", payload.full_name);
    if (payload.role !== undefined) params.append("role", payload.role);
    if (payload.organization !== undefined) params.append("organization", payload.organization);
    if (payload.is_active !== undefined) params.append("is_active", payload.is_active);
    return request(`/admin/users/${userId}?${params.toString()}`, { method: "PATCH" });
  },
};

export { getToken };
