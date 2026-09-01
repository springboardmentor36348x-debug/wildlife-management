const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
      : detail || "Request failed";
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.append(k, v);
  });
  const str = q.toString();
  return str ? `?${str}` : "";
}

function makeResource(path) {
  return {
    list: (token, params) =>
      fetch(`${API_BASE_URL}/${path}${buildQuery(params)}`, { headers: authHeaders(token) }).then(handleResponse),
    get: (token, id) =>
      fetch(`${API_BASE_URL}/${path}/${id}`, { headers: authHeaders(token) }).then(handleResponse),
    create: (token, data) =>
      fetch(`${API_BASE_URL}/${path}`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (token, id, data) =>
      fetch(`${API_BASE_URL}/${path}/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      }).then(handleResponse),
    remove: (token, id) =>
      fetch(`${API_BASE_URL}/${path}/${id}`, { method: "DELETE", headers: authHeaders(token) }).then(handleResponse),
  };
}

export const monitoringSitesApi = makeResource("monitoring-sites");
export const cameraTrapsApi = makeResource("camera-traps");
export const audioSensorsApi = makeResource("audio-sensors");
export const surveysApi = makeResource("surveys");
export const observationsApi = makeResource("observations");

export async function getMonitoringStats(token) {
  const res = await fetch(`${API_BASE_URL}/monitoring/stats`, { headers: authHeaders(token) });
  return handleResponse(res);
}
