import client from "./client";

export const runHabitatAssessment = (siteId) =>
  client.post(`/api/v1/habitat/assess/${siteId}`);

export const getLatestHabitatAssessment = (siteId) =>
  client.get(`/api/v1/habitat/${siteId}/latest`);

export const getHabitatHistory = (siteId) =>
  client.get(`/api/v1/habitat/${siteId}/history`);
