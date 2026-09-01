const API_BASE = "http://127.0.0.1:8000";

const memoryCache = new Map();

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function getCached(key) {
  if (memoryCache.has(key)) return memoryCache.get(key);
  try {
    const stored = sessionStorage.getItem(`cache_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch (e) {}
  return null;
}

function setCache(key, data) {
  memoryCache.set(key, data);
  try {
    sessionStorage.setItem(`cache_${key}`, JSON.stringify(data));
  } catch (e) {}
}

export function getCachedPopulationOverview(species = "", siteId = null, months = 12) {
  const key = `pop_${species}_${siteId}_${months}`;
  return getCached(key);
}

export function getCachedBiodiversityAnalytics(siteId = null) {
  const key = `bio_${siteId}`;
  return getCached(key);
}

export async function fetchPopulationOverview(species = "", siteId = null, months = 12) {
  const key = `pop_${species}_${siteId}_${months}`;
  const params = new URLSearchParams();
  if (species && species !== "All Species") params.append("species", species);
  if (siteId) params.append("site_id", siteId);
  if (months) params.append("months", months);

  const res = await fetch(`${API_BASE}/api/v1/intelligence/population/overview?${params.toString()}`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch population overview");
  const json = await res.json();
  setCache(key, json);
  return json;
}

export async function fetchHabitatIntelligence() {
  const key = "hab_overview";
  const res = await fetch(`${API_BASE}/api/v1/intelligence/habitat/overview`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch habitat intelligence");
  const json = await res.json();
  setCache(key, json);
  return json;
}

export async function fetchConservationRecommendations() {
  const key = "cons_recs";
  const res = await fetch(`${API_BASE}/api/v1/intelligence/conservation/recommendations`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch conservation recommendations");
  const json = await res.json();
  setCache(key, json);
  return json;
}

export async function fetchBiodiversityAnalytics(siteId = null) {
  const key = `bio_${siteId}`;
  const params = new URLSearchParams();
  if (siteId) params.append("site_id", siteId);

  const res = await fetch(`${API_BASE}/api/v1/intelligence/analytics/biodiversity?${params.toString()}`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch biodiversity metrics");
  const json = await res.json();
  setCache(key, json);
  return json;
}

export async function fetchReportsSummary() {
  const key = "reports_summary";
  const res = await fetch(`${API_BASE}/api/v1/intelligence/reports/summary`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch reports summary");
  const json = await res.json();
  setCache(key, json);
  return json;
}

export function downloadReport(type = "pdf") {
  const endpoint = type === "pdf" ? "/api/v1/intelligence/reports/export/pdf" : "/api/v1/intelligence/reports/export/csv";
  const url = `${API_BASE}${endpoint}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = type === "pdf" ? "wildlife_monitoring_report.pdf" : "wildlife_monitoring_report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
