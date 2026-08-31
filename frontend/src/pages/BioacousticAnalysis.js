import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import ConfidenceBadge from "../components/ConfidenceBadge";
import DashboardLayout from "../components/DashboardLayout";

function BioacousticAnalysis() {
  const [sites, setSites] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [siteId, setSiteId] = useState("");
  const [callType, setCallType] = useState("");
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
    api.get("/bioacoustics/").then((res) => setHistory(res.data)).catch(() => {});
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
    if (callType) formData.append("call_type", callType);
    formData.append("log_as_observation", logObservation);

    try {
      const res = await api.post("/bioacoustics/predict", formData);
      setResult(res.data);
      loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Analysis failed. Make sure the audio model has been trained (run scripts/train_audio_classifier.py)."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Bioacoustic Analysis">
    <div className="panel">
      <button type="button" className="secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Back
      </button>

      <div className="panel-title">Bioacoustic Recognition</div>
      <p className="panel-subtitle" style={{ marginTop: 0 }}>Upload an audio recording to identify the species by its call.</p>

      <form onSubmit={handleSubmit} style={{ maxWidth: "420px" }}>
        <input type="file" accept=".wav,.mp3,.flac,.ogg" onChange={handleFileChange} />

        {previewUrl && (
          <audio controls src={previewUrl} style={{ width: "100%", marginBottom: 14 }} />
        )}

        <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
          <option value="">-- Select a monitoring site (required to log this detection) --</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.site_name}</option>
          ))}
        </select>

        <select value={callType} onChange={(e) => setCallType(e.target.value)}>
          <option value="">-- Call type (auto-detected — override if needed) --</option>
          <option value="bird_call">Bird Call</option>
          <option value="mammal_vocalization">Mammal Vocalization</option>
          <option value="amphibian_call">Amphibian Call</option>
          <option value="insect_sound">Insect Sound</option>
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", color: "var(--dl-text)" }}>
          <input type="checkbox" checked={logObservation} onChange={(e) => setLogObservation(e.target.checked)} />
          Auto-log as an observation
        </label>

        <button type="submit" disabled={!file || !siteId || loading}>
          {loading ? "Analyzing..." : "Analyze Audio"}
        </button>
      </form>

      {error && <p style={{ color: "var(--dl-red)" }}>{error}</p>}

      {result && (
        <div className="site-detail-card" style={{ marginTop: 20 }}>
          <div className="panel-title" style={{ marginBottom: 10 }}>Result</div>
          {previewUrl && <audio controls src={previewUrl} style={{ width: "100%", marginBottom: "12px" }} />}
          <p><strong>Species:</strong> {result.predicted_species}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</p>
          {result.call_type && <p><strong>Call type:</strong> {result.call_type}</p>}
        </div>
      )}

      <div className="panel-title" style={{ marginTop: 32 }}>Recent Detections</div>
      <p className="panel-subtitle" style={{ marginTop: -8 }}>Click a row to see full details.</p>
      <table className="dl-table">
        <thead>
          <tr>
            <th>Species</th>
            <th>Confidence</th>
            <th>Call Type</th>
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
                <td>{h.call_type || "-"}</td>
                <td>{new Date(h.created_at).toLocaleString()}</td>
              </tr>
              {expandedId === h.id && (
                <tr>
                  <td colSpan={4} style={{ background: "var(--dl-panel-alt)", padding: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                      <div><strong>Conservation status:</strong> {h.conservation_status || "-"}</div>
                      <div><strong>Monitoring site:</strong> {h.monitoring_site_id || "-"}</div>
                      <div><strong>Audio sensor:</strong> {h.audio_sensor_id || "-"}</div>
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

export default BioacousticAnalysis;