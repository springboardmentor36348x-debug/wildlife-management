import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import ConfidenceBadge from "../components/ConfidenceBadge";
import DashboardLayout from "../components/DashboardLayout";

function ImageAnalysis() {
  const [sites, setSites] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [siteId, setSiteId] = useState("");
  const [logObservation, setLogObservation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/monitoring-sites").then((res) => setSites(res.data)).catch(() => {});
    loadHistory();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadHistory = () => {
    api.get("/image-analysis/").then((res) => setHistory(res.data)).catch(() => {});
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (siteId) formData.append("monitoring_site_id", siteId);
    formData.append("log_as_observation", logObservation);

    try {
      const res = await api.post("/image-analysis/predict", formData);
      setResult(res.data);
      loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Analysis failed. Make sure the image model has been trained (run scripts/train_image_classifier.py)."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Wildlife Image Analysis">
    <div className="panel">
      <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Back
      </button>

      <div className="panel-title">Wildlife Image Analysis</div>
      <p className="panel-subtitle" style={{ marginTop: 0 }}>Upload a camera trap or drone image to identify the species.</p>

      <form onSubmit={handleSubmit} style={{ maxWidth: "420px" }}>
        <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Selected preview"
            style={{ maxWidth: "100%", maxHeight: "260px", borderRadius: "8px", border: "1px solid var(--dl-border)", marginBottom: 14 }}
          />
        )}

        <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
          <option value="">-- Select a monitoring site (required to log this detection) --</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.site_name}</option>
          ))}
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", color: "var(--dl-text)" }}>
          <input type="checkbox" checked={logObservation} onChange={(e) => setLogObservation(e.target.checked)} />
          Auto-log as an observation
        </label>

        <button type="submit" disabled={!file || !siteId || loading}>
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>
      </form>

      {error && <p style={{ color: "var(--dl-red)" }}>{error}</p>}

      {result && (
        <div className="site-detail-card" style={{ marginTop: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Analyzed"
              style={{ width: "140px", height: "140px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
            />
          )}
          <div>
            <div className="panel-title" style={{ marginBottom: 10 }}>Result</div>
            <p><strong>Species:</strong> {result.predicted_species}</p>
            <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</p>
            {result.conservation_status && <p><strong>Conservation status:</strong> {result.conservation_status}</p>}
            {result.is_endangered && <p style={{ color: "var(--dl-red)" }}><strong>⚠ Endangered species detected</strong></p>}
          </div>
        </div>
      )}

      <div className="panel-title" style={{ marginTop: 32 }}>Recent Detections</div>
      <p className="panel-subtitle" style={{ marginTop: -8 }}>Click a row to see full details.</p>
      <table className="dl-table">
        <thead>
          <tr>
            <th>Species</th>
            <th>Confidence</th>
            <th>Endangered</th>
            <th>Detected At</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <React.Fragment key={h.id}>
              <tr
                onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                style={{ cursor: "pointer", background: expandedId === h.id ? "var(--dl-accent-dim)" : "transparent" }}
              >
                <td>{h.predicted_species}</td>
                <td><ConfidenceBadge value={h.confidence} /></td>
                <td>{h.is_endangered ? "Yes" : "No"}</td>
                <td>{new Date(h.created_at).toLocaleString()}</td>
              </tr>
              {expandedId === h.id && (
                <tr>
                  <td colSpan={4} style={{ background: "var(--dl-panel-alt)", padding: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                      <div><strong>Taxonomic group:</strong> {h.taxonomic_group || "-"}</div>
                      <div><strong>Conservation status:</strong> {h.conservation_status || "-"}</div>
                      <div><strong>Monitoring site:</strong> {h.monitoring_site_id || "-"}</div>
                      <div><strong>Model:</strong> {h.model_name}</div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
    </DashboardLayout>
  );
}

export default ImageAnalysis;