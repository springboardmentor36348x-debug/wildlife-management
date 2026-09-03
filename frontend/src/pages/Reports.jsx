import React, { useState, useEffect } from 'react';
import { FileDown, FilePlus, Loader, CheckCircle, AlertTriangle } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'population_report', label: 'Population Intelligence Report', desc: 'Comprehensive population estimates, trends, and growth analysis.' },
  { value: 'biodiversity_report', label: 'Biodiversity Assessment Report', desc: 'Shannon/Simpson indices, species richness, and diversity trends.' },
  { value: 'habitat_report', label: 'Habitat Health Report', desc: 'Field assessment scores, threats, and quality metrics.' },
  { value: 'ecosystem_health_report', label: 'Ecosystem Health Report', desc: 'Weighted 5-component health scores and status assessment.' },
  { value: 'comprehensive_report', label: 'Comprehensive Conservation Report', desc: 'All-in-one integrated intelligence report for this reserve.' },
];

export default function Reports() {
  const [sites, setSites] = useState([]);
  const [reportType, setReportType] = useState('comprehensive_report');
  const [siteId, setSiteId] = useState('');
  const [format, setFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      try {
        const [resSites, resReports] = await Promise.all([
          fetch('/api/v1/monitoring-sites', { headers }),
          fetch('/api/v1/reports', { headers })
        ]);
        if (resSites.ok) setSites(await resSites.json());
        if (resReports.ok) setReports(await resReports.json());
      } catch (err) { console.error(err); }
    }
    loadData();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const token = localStorage.getItem('token');
      const body = { report_type: reportType, format };
      if (siteId) body.site_id = parseInt(siteId);

      const res = await fetch('/api/v1/reports/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const newReport = await res.json();
        setStatus({ type: 'success', message: 'Report generated successfully!' });
        setReports((prev) => [newReport, ...prev]);
      } else {
        const err = await res.json();
        setStatus({ type: 'error', message: err.detail || 'Failed to generate report.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = REPORT_TYPES.find((r) => r.value === reportType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">Intelligence Reports</h2>
        <p className="text-sm text-slate-500 mt-1">Generate downloadable PDF or Excel conservation intelligence reports.</p>
      </div>

      {/* Generator Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <FilePlus className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">Generate New Report</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Report Type */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
            >
              {REPORT_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {selectedType && (
              <p className="text-[11px] text-slate-400 italic">{selectedType.desc}</p>
            )}
          </div>

          {/* Reserve Site */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Reserve / Site</label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
            >
              <option value="">All Sites (Combined)</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.site_name}</option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Export Format</label>
            <div className="flex gap-3">
              {['pdf', 'excel'].map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm font-semibold text-slate-700 uppercase">{f}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {status && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {status.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {status.message}
          </div>
        )}

        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          {loading ? <Loader className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Report History */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Generated Reports</h3>
        {reports.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">No reports generated yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{report.report_name}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>{new Date(report.generated_at).toLocaleString()}</span>
                    <span>·</span>
                    <span className="capitalize">{report.format?.toUpperCase()}</span>
                    {report.file_size_bytes && <span>· {Math.round(report.file_size_bytes / 1024)} KB</span>}
                  </div>
                </div>
                {report.file_path && (
                  <a
                    href={`/uploads/reports/${report.file_path.split('/').pop()}`}
                    download
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
