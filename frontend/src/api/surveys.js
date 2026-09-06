import client from "./client";

// Monitoring sites
export const listMonitoringSites = () => client.get("/api/v1/monitoring-sites/");
export const createMonitoringSite = (payload) => client.post("/api/v1/monitoring-sites/", payload);
export const registerDevice = (payload) => client.post("/api/v1/monitoring-sites/devices", payload);
export const listSiteDevices = (siteId) => client.get(`/api/v1/monitoring-sites/${siteId}/devices`);

// Surveys
export const listSurveys = () => client.get("/api/v1/surveys/");
export const createSurvey = (payload) => client.post("/api/v1/surveys/", payload);
