import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function ReportsPage() {
  const [types, setTypes] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ title: "", report_type: "wildlife_survey", format: "pdf" });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getReportTypes().then(setTypes).catch(() => {});
    loadHistory();
  }, []);

  function loadHistory() {
    api.listReportHistory().then(setHistory).catch(() => {});
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    setError("");
    try {
      await api.generateReport(form);
      setForm({ ...form, title: "" });
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(id, filename) {
    try {
      await api.triggerReportDownload(id, filename);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>📄 Reports & Export System</h1>
        <p>Generate analytical reports for stakeholders in PDF or Excel format.</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="section-title">Generate Report</h3>
          {error && <div className="auth-error mb-3">{error}</div>}
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Report Title</label>
              <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="E.g. Q3 Serengeti Census" required />
            </div>
            <div className="form-group">
              <label className="form-label">Report Type</label>
              <select className="form-select" value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
                {types.map(t => <option key={t.type} value={t.type}>{t.name}</option>)}
              </select>
              <p className="text-xs text-muted mt-1">{types.find(t => t.type === form.report_type)?.description}</p>
            </div>
            <div className="form-group">
              <label className="form-label">Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                  <input type="radio" name="format" value="pdf" checked={form.format === "pdf"} onChange={(e) => setForm({ ...form, format: e.target.value })} />
                  <span className="text-sm font-semibold">PDF Document</span>
                </label>
                <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                  <input type="radio" name="format" value="excel" checked={form.format === "excel"} onChange={(e) => setForm({ ...form, format: e.target.value })} />
                  <span className="text-sm font-semibold">Excel Spreadsheet</span>
                </label>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full mt-2" disabled={generating}>
              {generating ? "Generating…" : "Generate Report"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="section-title">Report History</h3>
          <div className="table-container" style={{ maxHeight: 400, overflowY: "auto" }}>
            <table>
              <thead><tr><th>Title</th><th>Type / Format</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td className="font-semibold">{h.title}</td>
                    <td>
                      <div><span className="badge badge-slate" style={{ fontSize: "0.6rem" }}>{h.report_type.replace(/_/g, " ")}</span></div>
                      <div className="mt-1"><span className={`badge ${h.file_format === "pdf" ? "badge-rose" : "badge-emerald"}`} style={{ fontSize: "0.6rem" }}>{h.file_format.toUpperCase()}</span></div>
                    </td>
                    <td className="font-mono text-xs">{new Date(h.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(h.id, `${h.title.replace(/\s+/g, '_')}.${h.file_format === 'pdf' ? 'pdf' : 'xlsx'}`)}>⬇️ Download</button>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && <tr><td colSpan={4} className="text-center text-muted p-4">No reports generated yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
