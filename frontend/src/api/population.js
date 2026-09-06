import client from "./client";

export const runPopulationAssessment = (siteId, areaSqKm) =>
  client.post(`/api/v1/population/assess/${siteId}`, null, {
    params: areaSqKm ? { area_sq_km: areaSqKm } : {},
  });

export const getLatestPopulationEstimates = (siteId) =>
  client.get(`/api/v1/population/${siteId}/latest`);

export const getPopulationHistory = (siteId, speciesCommonName) =>
  client.get(`/api/v1/population/${siteId}/history`, {
    params: speciesCommonName ? { species_common_name: speciesCommonName } : {},
  });

export const getSpeciesDistribution = (speciesCommonName) =>
  client.get("/api/v1/population/distribution", {
    params: { species_common_name: speciesCommonName },
  });
