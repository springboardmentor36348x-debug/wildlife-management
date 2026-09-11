import { useState, useRef, useEffect } from "react";
import { api, getToken } from "../api/client";

export default function SpeciesRecognitionPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState("image"); // "image" or "audio"

  useEffect(() => {
    api.listAllSites().then(setSites).catch(() => {});
  }, []);

  function handleFileSelect(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
    if (f.type.startsWith("image/")) {
      setMode("image");
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else if (f.type.startsWith("audio/")) {
      setMode("audio");
      setPreview(URL.createObjectURL(f));
    } else {
      setError("Please select an image or audio file.");
      setFile(null);
      setPreview(null);
    }
  }

  async function handleUploadAndDetect() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      let obs;
      if (mode === "image") {
        obs = await api.uploadObservationImage(file, { siteId, notes });
        const res = await api.detectSpecies(obs.id);
        setResult({ observation: obs, detection: res, type: "image" });
      } else {
        obs = await api.uploadObservationAudio(file, { siteId, notes });
        const res = await api.detectSound(obs.id);
        setResult({ observation: obs, detection: res, type: "audio" });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>📸 Species Recognition Engine</h1>
        <p>Upload a camera trap image or audio recording for AI-powered species detection.</p>
      </div>

      <div className="grid grid-2">
        {/* Upload Zone */}
        <div className="card">
          <h3 className="section-title">Upload Capture</h3>
          <div className="form-group">
            <label className="form-label">Link to Monitoring Site (Optional)</label>
            <select className="form-select" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="">-- No site (Test Mode) --</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Field Notes</label>
            <input className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="E.g. Found near watering hole" />
          </div>

          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*,audio/*" onChange={handleFileSelect} />
          <div className="upload-zone" onClick={() => fileInputRef.current?.click()} style={{ marginTop: "1rem" }}>
            <div className="upload-icon">📷</div>
            <p>Click to select image or audio file</p>
            <p className="upload-hint">JPEG, PNG, WAV, MP3 up to 25MB</p>
          </div>

          {file && (
            <div style={{ marginTop: "1rem" }}>
              <p className="text-sm font-semibold mb-2">Selected: {file.name}</p>
              <button className="btn btn-primary w-full" onClick={handleUploadAndDetect} disabled={loading}>
                {loading ? "Processing AI Detection…" : "Run Detection Engine"}
              </button>
            </div>
          )}
          {error && <div className="auth-error mt-4">{error}</div>}
        </div>

        {/* Results Area */}
        <div className="card">
          <h3 className="section-title">Detection Results</h3>
          {!preview && !result && <div className="empty-state" style={{ padding: "1rem" }}><p>Upload a file to see results.</p></div>}
          
          {preview && mode === "image" && (
            <div style={{ position: "relative", marginBottom: "1rem", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <img src={preview} alt="Upload preview" style={{ width: "100%", display: "block" }} />
              {result?.type === "image" && result.detection?.detections.map((d, i) => (
                <div key={i} style={{ position: "absolute", border: "2px solid var(--accent-cyan)", left: d.bbox.x, top: d.bbox.y, width: d.bbox.width, height: d.bbox.height }}>
                  <span style={{ position: "absolute", top: -20, left: -2, background: "var(--accent-cyan)", color: "#000", fontSize: "0.65rem", fontWeight: "bold", padding: "2px 4px", whiteSpace: "nowrap" }}>
                    {d.label} ({(d.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          )}

          {preview && mode === "audio" && (
            <div style={{ marginBottom: "1rem" }}>
              <audio controls src={preview} style={{ width: "100%" }} />
            </div>
          )}

          {result && (
            <div style={{ padding: "1rem", background: "rgba(124,58,237,0.08)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-active)" }}>
              {result.detection.detected ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-emerald">Positive Match</span>
                    <span className="font-bold text-lg" style={{ textTransform: "capitalize" }}>{result.detection.top_label || result.detection.label}</span>
                  </div>
                  <p className="font-mono text-sm">Confidence: <span style={{ color: "var(--accent-cyan-light)" }}>{((result.detection.top_confidence || result.detection.confidence) * 100).toFixed(1)}%</span></p>
                  {result.type === "image" && <p className="text-sm mt-1">Total individuals detected: <strong>{result.detection.count}</strong></p>}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="badge badge-amber">No wildlife detected</span>
                  <p className="text-sm">The AI did not detect any known animal classes.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
