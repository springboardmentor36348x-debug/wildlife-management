const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

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

/**
 * Exchanges the stored refresh token for a new access token. Multiple
 * concurrent 401s share a single in-flight refresh call so we don't spam
 * the refresh endpoint if several requests fail at once.
 */
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
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const data = await res.json();
      localStorage.setItem("wpis_token", data.access_token);
      return data.access_token;
    })
    .finally(() => {
      refreshInFlight = null;
    });

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

  // Access token expired mid-session -> silently refresh once, then retry.
  if (res.status === 401 && auth && !_retried && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request(path, { method, body, auth, _retried: true });
    }
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
  register: (payload) =>
    request("/auth/register", { method: "POST", body: payload, auth: false }),
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
  listObservations: (siteId) =>
    request(`/observations/${siteId ? `?site_id=${siteId}` : ""}`),
  createObservation: (payload) => request("/observations/", { method: "POST", body: payload }),

  // Datasets
  listDatasets: () => request("/datasets/"),
  createDataset: (payload) => request("/datasets/", { method: "POST", body: payload }),
  deleteDataset: (id) => request(`/datasets/${id}`, { method: "DELETE" }),

  // Dataset files (real uploads)
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

  // Species Recognition (Milestone 2 workflow)
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
    if (!res.ok) {
      const message = data?.detail || `Upload failed with status ${res.status}`;
      throw new Error(typeof message === "string" ? message : JSON.stringify(message));
    }
    return data;
  },
  detectSpecies: (observationId) => request(`/observations/${observationId}/detect`, { method: "POST" }),
  getObservation: (observationId) => request(`/observations/${observationId}`),
  getObservationDetections: (observationId) => request(`/observations/${observationId}/detections`),

  // Sound Detection (Milestone 3 Feature A - Bioacoustic Recognition)
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
    if (!res.ok) {
      const message = data?.detail || `Upload failed with status ${res.status}`;
      throw new Error(typeof message === "string" ? message : JSON.stringify(message));
    }
    return data;
  },
  detectSound: (observationId) => request(`/observations/${observationId}/detect-sound`, { method: "POST" }),

  // Population Intelligence (Milestone 3 Feature B)
  getPopulationCounts: (surveyId) => request(`/population/counts${surveyId ? `?survey_id=${surveyId}` : ""}`),
  getPopulationDensity: (surveyId) => request(`/population/density?survey_id=${surveyId}`),
  getPopulationTrend: (species, { surveyId, windowDays = 30 } = {}) =>
    request(
      `/population/trend?species=${encodeURIComponent(species)}&window_days=${windowDays}${
        surveyId ? `&survey_id=${surveyId}` : ""
      }`
    ),
  getPopulationDistribution: (surveyId) =>
    request(`/population/distribution${surveyId ? `?survey_id=${surveyId}` : ""}`),
  getPopulationMovement: (species) => request(`/population/movement?species=${encodeURIComponent(species)}`),

  // Habitat Intelligence (Milestone 3 Feature C)
  getHabitatClassification: (siteId) => request(`/habitat/sites/${siteId}/classification`),
  getHabitatDegradation: (siteId, windowDays = 90) =>
    request(`/habitat/sites/${siteId}/degradation?window_days=${windowDays}`),
  getHabitatVegetation: (siteId) => request(`/habitat/sites/${siteId}/vegetation`),
  getHabitatEnvironmental: (siteId) => request(`/habitat/sites/${siteId}/environmental`),
  getHabitatSuitability: (siteId, species) =>
    request(`/habitat/sites/${siteId}/suitability?species=${encodeURIComponent(species)}`),

  // Conservation Recommendations (Milestone 3 Feature D)
  getConservationPriorities: () => request("/conservation/priorities"),
  getConservationRestoration: (siteId) => request(`/conservation/restoration/${siteId}`),
  getConservationProtection: (siteId) => request(`/conservation/protection/${siteId}`),
  getMonitoringOptimization: () => request("/conservation/monitoring-optimization"),
  getResourceAllocation: () => request("/conservation/resource-allocation"),

  // Ecosystem Health Scoring (Milestone 3 Feature E)
  getHealthScore: ({ siteId, surveyId } = {}) => {
    const params = [];
    if (siteId) params.push(`site_id=${siteId}`);
    if (surveyId) params.push(`survey_id=${surveyId}`);
    return request(`/health/score${params.length ? `?${params.join("&")}` : ""}`);
  },
  getHealthScoreAllSites: () => request("/health/score/all-sites"),

  // Reports
  getReportSummary: () => request("/reports/summary"),
  listReportRecords: (limit = 25) => request(`/reports/records?limit=${limit}`),

  // Reports & Export System (Milestone 4)
  listReportTypes: () => request("/reports/types"),
  generateReport: (payload) => request("/reports/generate", { method: "POST", body: payload }),
  listGeneratedReports: () => request("/reports/generated"),
  exportReportUrl: (reportId, format) => {
    const token = getToken();
    return `${API_BASE}/reports/export/${reportId}?format=${format}`;
  },
  exportReportByTypeUrl: (reportType, format) => {
    return `${API_BASE}/reports/export-type/${reportType}?format=${format}`;
  },
  downloadFile: async (path, filename) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.detail || `Download failed with status ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Notification & Alert System (Milestone 4)
  listNotifications: (unreadOnly = false) =>
    request(`/notifications/${unreadOnly ? "?unread_only=true" : ""}`),
  getNotificationSummary: () => request("/notifications/summary"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "PATCH" }),

  // Performance Metrics (Milestone 4)
  getPerformanceMetrics: () => request("/performance/metrics"),
};

export { getToken };
