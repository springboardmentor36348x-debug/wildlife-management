import client from "./client";

export const generateRecommendations = (siteId) =>
  client.post(`/api/v1/conservation/generate/${siteId}`);

export const listRecommendations = (siteId) =>
  client.get(`/api/v1/conservation/${siteId}`);

export const updateRecommendationStatus = (recommendationId, statusValue) =>
  client.patch(`/api/v1/conservation/${recommendationId}/status`, { status: statusValue });
