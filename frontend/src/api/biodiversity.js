import client from "./client";

// Species Identification Engine
export const listSpeciesObservations = (params = {}) =>
  client.get("/api/v1/species/observations", { params });

export const getSpeciesSummary = () => client.get("/api/v1/species/summary");

// Biodiversity Intelligence Engine
export const runBiodiversityAssessment = (siteId) =>
  client.post(`/api/v1/biodiversity/assess/${siteId}`);

export const getBiodiversityHistory = (siteId) =>
  client.get(`/api/v1/biodiversity/${siteId}/history`);

export const getLatestBiodiversityAssessment = (siteId) =>
  client.get(`/api/v1/biodiversity/${siteId}/latest`);
