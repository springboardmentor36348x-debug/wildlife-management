import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import ConfidenceBadge from "../components/ConfidenceBadge";
import DashboardLayout from "../components/DashboardLayout";

function SpeciesDetections() {
  const [images, setImages] = useState([]);
  const [audio, setAudio] = useState([]);
  const [tab, setTab] = useState("images");
  const navigate = useNavigate();

  useEffect(() => {
    loadImages();
    loadAudio();
  }, []);

  const loadImages = () => {
    api.get("/image-analysis/").then((res) => setImages(res.data)).catch(() => {});
  };

  const loadAudio = () => {
    api.get("/bioacoustics/").then((res) => setAudio(res.data)).catch(() => {});
  };

  const handleDeleteImage = (id) => {
    if (!window.confirm("Delete this image detection?")) return;
    api.delete(`/image-analysis/${id}`)
      .then(() => loadImages())
      .catch((err) => alert(err.response?.data?.detail || "Delete failed"));
  };

  const handleDeleteAudio = (id) => {
    if (!window.confirm("Delete this audio detection?")) return;
    api.delete(`/bioacoustics/${id}`)
      .then(() => loadAudio())
      .catch((err) => alert(err.response?.data?.detail || "Delete failed"));
  };

  const endangeredCount =
    images.filter((i) => i.is_endangered).length +
    audio.filter((a) => a.is_endangered).length;

  return (
     <DashboardLayout title="Species Detections">
    <div className="panel">
      <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Back
      </button>

      <div className="panel-title">Species Detections</div>
      <p className="panel-subtitle" style={{ marginTop: 0 }}>Feed of image and audio detections logged across the system. You can delete detections you have permission to remove.</p>

      <div className="stat-grid" style={{ margin: "16px 0" }}>
        <div className="stat-card" style={{ minWidth: "140px" }}>
          <div className="stat-label">Total Detections</div>
          <div className="stat-value">{images.length + audio.length}</div>
        </div>
        <div className="stat-card" style={{ minWidth: "140px" }}>
          <div className="stat-label">Avg. Confidence</div>
          <div className="stat-value">
            {images.length + audio.length > 0
              ? (([...images, ...audio].reduce((s, d) => s + d.confidence, 0) / (images.length + audio.length)) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
      </div>

      {endangeredCount > 0 && (
        <p style={{ color: "var(--dl-red)" }}>
          ⚠ {endangeredCount} endangered-species detection{endangeredCount > 1 ? "s" : ""} flagged below.
        </p>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button type="button" className={tab === "images" ? "" : "secondary"} onClick={() => setTab("images")} disabled={tab === "images"}>
          Image Detections ({images.length})
        </button>
        <button type="button" className={tab === "audio" ? "" : "secondary"} onClick={() => setTab("audio")} disabled={tab === "audio"}>
          Audio Detections ({audio.length})
        </button>
      </div>

      {tab === "images" ? (
        <table className="dl-table">
          <thead>
            <tr>
              <th>Species</th>
              <th>Confidence</th>
              <th>Conservation Status</th>
              <th>Endangered</th>
              <th>Detected At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {images.map((h) => (
              <tr key={h.id} style={h.is_endangered ? { color: "var(--dl-red)" } : {}}>
                <td>{h.predicted_species}</td>
                <td><ConfidenceBadge value={h.confidence} /></td>
                <td>{h.conservation_status || "-"}</td>
                <td>{h.is_endangered ? "⚠ Yes" : "No"}</td>
                <td>{new Date(h.created_at).toLocaleString()}</td>
                <td>
                  <button type="button" className="danger" onClick={() => handleDeleteImage(h.id)} style={{ fontSize: "12px" }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="dl-table">
          <thead>
            <tr>
              <th>Species</th>
              <th>Confidence</th>
              <th>Call Type</th>
              <th>Conservation Status</th>
              <th>Endangered</th>
              <th>Detected At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {audio.map((h) => (
              <tr key={h.id} style={h.is_endangered ? { color: "var(--dl-red)" } : {}}>
                <td>{h.predicted_species}</td>
                <td><ConfidenceBadge value={h.confidence} /></td>
                <td>{h.call_type || "-"}</td>
                <td>{h.conservation_status || "-"}</td>
                <td>{h.is_endangered ? "⚠ Yes" : "No"}</td>
                <td>{new Date(h.created_at).toLocaleString()}</td>
                <td>
                  <button type="button" className="danger" onClick={() => handleDeleteAudio(h.id)} style={{ fontSize: "12px" }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </DashboardLayout>
  );
}

export default SpeciesDetections;