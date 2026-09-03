import client from "./client";

// Wildlife Image Analysis Engine
export const uploadImage = (file, monitoringSiteId, surveyId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("monitoring_site_id", monitoringSiteId);
  if (surveyId) formData.append("survey_id", surveyId);

  return client.post("/api/v1/images/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const listImages = () => client.get("/api/v1/images/");
export const getImageDetections = (mediaAssetId) =>
  client.get(`/api/v1/images/${mediaAssetId}/detections`);

// Bioacoustic Recognition Engine
export const uploadAudio = (file, monitoringSiteId, surveyId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("monitoring_site_id", monitoringSiteId);
  if (surveyId) formData.append("survey_id", surveyId);

  return client.post("/api/v1/audio/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const listAudio = () => client.get("/api/v1/audio/");
