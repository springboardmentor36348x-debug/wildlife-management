import { useEffect, useState } from "react";
import { api } from "../api/client";

function StatusPill({ status }) {
  const cls = status === "processed" ? "badge-ok" : "badge-med";
  return <span className={`badge ${cls}`}>{status === "processed" ? "Processed" : "Queued"}</span>;
}

function GenerateReportForm({ reportTypes, onGenerated }) {
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("");
  const [region, setRegion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (reportTypes.length && !reportType) setReportType(reportTypes[0].key);
  }, [reportTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !reportType) return;
    setSubmitting(true);
    setError("");
    try {
      const record = await api.generateReport({ title: title.trim(), report_type: reportType, region: region.trim() || null });
      onGenerated(record);
      setTitle("");
      setRegion("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <h2 className="font-display font-semibold text-bark-900">Generate New Monitoring Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="label">Report Title</label>
          <input
            className="input"
            placeholder="e.g. Serengeti Sector 4 Diversity Audit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Report Type</label>
          <select className="input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {reportTypes.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Monitoring Region (optional)</label>
          <input
            className="input"
            placeholder="e.g. Serengeti Reserve Sector 4"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary" type="submit" disabled={submitting || !title.trim()}>
        {submitting ? "Generating…" : "Generate Report"}
      </button>
    </form>
  );
}

function GeneratedReportsArchive({ reports, onDownload }) {
  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-bark-900 mb-1">Generated Wildlife Reports Archive</h2>
      <p className="text-xs text-canopy-600 mb-4">
        Metadata is logged here; the PDF/Excel file itself is always rebuilt live from the current database at
        download time, so a download can never go stale.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-canopy-500 border-b border-canopy-100">
            <th className="py-2">Title</th>
            <th className="py-2">Report Type</th>
            <th className="py-2">Author</th>
            <th className="py-2">Summary</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-canopy-100">
          {reports.map((r) => (
            <tr key={r.id}>
              <td className="py-2 text-bark-900 font-medium">{r.title}</td>
              <td className="py-2">
                <span className="badge badge-low">{r.report_type_label}</span>
              </td>
              <td className="py-2 text-canopy-700">{r.author_name || "—"}</td>
              <td className="py-2 text-canopy-700">{r.summary}</td>
              <td className="py-2">
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs" onClick={() => onDownload(r, "pdf")}>
                    PDF
                  </button>
                  <button className="btn-secondary text-xs" onClick={() => onDownload(r, "excel")}>
                    Excel
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reports.length === 0 && (
        <p className="text-sm text-canopy-600 py-6 text-center">
          No reports generated yet — use the form above to generate your first one.
        </p>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.getReportSummary(),
      api.listReportRecords(30),
      api.listReportTypes(),
      api.listGeneratedReports(),
    ])
      .then(([s, r, types, generated]) => {
        setSummary(s);
        setRecords(r);
        setReportTypes(types);
        setGeneratedReports(generated);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleGenerated(record) {
    setGeneratedReports((prev) => [record, ...prev]);
  }

  async function handleDownload(record, format) {
    const ext = format === "pdf" ? "pdf" : "xlsx";
    try {
      await api.downloadFile(`/reports/export/${record.id}?format=${format}`, `${record.title.replace(/\s+/g, "_")}.${ext}`);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-bark-900">Wildlife Monitoring Reports &amp; Automated PDF Generator</h1>
        <p className="text-canopy-700 text-sm mt-1">
          Live feed of ingested field observations and dataset uploads, plus generated biodiversity reports you
          can download as PDF or Excel (Milestone 4, FR-13).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Images</p>
            <p className="font-display text-2xl font-semibold text-bark-900 mt-1">{summary.images_analyzed}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Audio Clips</p>
            <p className="font-display text-2xl font-semibold text-bark-900 mt-1">{summary.audio_clips}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Species Confirmed</p>
            <p className="font-display text-2xl font-semibold text-bark-900 mt-1">{summary.species_confirmed}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Surveys</p>
            <p className="font-display text-2xl font-semibold text-bark-900 mt-1">{summary.total_surveys}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Sites</p>
            <p className="font-display text-2xl font-semibold text-bark-900 mt-1">{summary.total_monitoring_sites}</p>
          </div>
        </div>
      )}

      {reportTypes.length > 0 && <GenerateReportForm reportTypes={reportTypes} onGenerated={handleGenerated} />}

      <GeneratedReportsArchive reports={generatedReports} onDownload={handleDownload} />

      <div className="card p-5">
        <h2 className="font-display font-semibold text-bark-900 mb-1">Module Records</h2>
        <p className="text-xs text-canopy-600 mb-4">
          A live feed of every observation and dataset file, sourced directly from the database.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-canopy-500 border-b border-canopy-100">
              <th className="py-2">Record ID</th>
              <th className="py-2">Timestamp</th>
              <th className="py-2">Source</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canopy-100">
            {records.map((r) => (
              <tr key={r.record_id + r.timestamp}>
                <td className="py-2 font-mono text-xs text-bark-900">{r.record_id}</td>
                <td className="py-2 text-canopy-700">{new Date(r.timestamp).toLocaleString()}</td>
                <td className="py-2 text-canopy-700">{r.source}</td>
                <td className="py-2"><StatusPill status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && !loading && (
          <p className="text-sm text-canopy-600 py-6 text-center">
            No records yet — create a survey with a monitoring site and log an observation, or upload a
            dataset file, to see it appear here.
          </p>
        )}
      </div>
    </div>
  );
}
