import { useEffect, useState } from "react";
import { api } from "../api/client";

const SOURCES = [
  { value: "snapshot_serengeti", label: "Snapshot Serengeti" },
  { value: "inaturalist", label: "iNaturalist" },
  { value: "birdclef", label: "BirdCLEF" },
  { value: "gbif", label: "GBIF" },
  { value: "animal_kingdom", label: "Animal Kingdom" },
  { value: "custom_upload", label: "Custom Upload" },
];

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", source: "custom_upload", purpose: "", record_count: 0 });
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => { load(); }, []);
  function load() { api.listDatasets().then(setDatasets).catch(() => {}); }

  async function createDataset(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createDataset({ ...form, record_count: parseInt(form.record_count, 10) || 0 });
      setShowForm(false);
      setForm({ name: "", source: "custom_upload", purpose: "", record_count: 0 });
      load();
    } catch (err) { setError(err.message); }
  }

  async function toggleExpand(id) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!files[id]) {
      try {
        const f = await api.listDatasetFiles(id);
        setFiles((prev) => ({ ...prev, [id]: f }));
      } catch { setFiles((prev) => ({ ...prev, [id]: [] })); }
    }
  }

  async function handleUpload(datasetId, fileList) {
    if (!fileList.length) return;
    setUploading(true);
    try {
      const uploaded = await api.uploadDatasetFiles(datasetId, fileList);
      setFiles((prev) => ({ ...prev, [datasetId]: [...(prev[datasetId] || []), ...uploaded] }));
    } catch (err) { setError(err.message); }
    setUploading(false);
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>📦 Dataset Pipeline</h1>
          <p>Register, upload, and manage wildlife datasets.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Register Dataset</button>
      </div>

      {error && <div className="auth-error mb-4">{error}</div>}

      {showForm && (
        <div className="card mb-4">
          <h3 className="section-title">Register Dataset</h3>
          <form onSubmit={createDataset} className="grid grid-2">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Source</label>
              <select className="form-select" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Purpose</label><input className="form-input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Record Count</label><input type="number" className="form-input" value={form.record_count} onChange={(e) => setForm({ ...form, record_count: e.target.value })} /></div>
            <div style={{ gridColumn: "span 2" }}><button type="submit" className="btn btn-primary">Register</button></div>
          </form>
        </div>
      )}

      <div className="grid" style={{ gap: "0.75rem" }}>
        {datasets.map((ds) => (
          <div key={ds.id} className="card card-compact" style={{ cursor: "pointer" }} onClick={() => toggleExpand(ds.id)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{ds.name}</span>
                  <span className={`badge ${ds.status === "ready" ? "badge-emerald" : ds.status === "failed" ? "badge-rose" : "badge-amber"}`}>{ds.status}</span>
                </div>
                <p className="text-xs text-muted mt-1">{ds.purpose || "No description"}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge badge-slate">{ds.source?.replace(/_/g, " ")}</span>
                <span className="font-mono text-sm">{ds.record_count?.toLocaleString()} records</span>
              </div>
            </div>

            {expandedId === ds.id && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-default)", paddingTop: "1rem" }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted">UPLOADED FILES</span>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                    {uploading ? "Uploading…" : "📎 Upload Files"}
                    <input type="file" multiple style={{ display: "none" }} onChange={(e) => handleUpload(ds.id, Array.from(e.target.files))} />
                  </label>
                </div>
                {(files[ds.id] || []).length > 0 ? (
                  <div className="table-container">
                    <table>
                      <thead><tr><th>Filename</th><th>Type</th><th>Size</th><th>Uploaded</th></tr></thead>
                      <tbody>
                        {files[ds.id].map((f) => (
                          <tr key={f.id}>
                            <td className="font-semibold">{f.original_filename}</td>
                            <td className="text-xs text-muted">{f.content_type}</td>
                            <td className="font-mono text-xs">{(f.file_size_bytes / 1024).toFixed(1)} KB</td>
                            <td className="font-mono text-xs">{new Date(f.uploaded_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted text-center p-3">No files uploaded yet.</p>
                )}
              </div>
            )}
          </div>
        ))}
        {datasets.length === 0 && <div className="empty-state"><div className="empty-icon">📦</div><h3>No Datasets</h3><p>Register your first dataset above.</p></div>}
      </div>
    </div>
  );
}
