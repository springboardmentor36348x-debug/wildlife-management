import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import {
  FileSpreadsheet,
  Download,
  FileText,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  Compass,
  PawPrint,
  Trees,
  Shield,
  Layers,
  Check,
} from "lucide-react";

function StatusPill({ status }) {
  const cls = status === "processed" ? "badge-ok" : "badge-med";
  return <span className={`badge ${cls}`}>{status === "processed" ? "Processed" : "Queued"}</span>;
}

export default function ReportsPage() {
  const [reportTypes, setReportTypes] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);

  // Generation form state
  const [selectedType, setSelectedType] = useState("wildlife_survey");
  const [selectedFormat, setSelectedFormat] = useState("pdf"); // pdf | excel
  const [customTitle, setCustomTitle] = useState("");
  const [filterSurveyId, setFilterSurveyId] = useState("");
  const [filterSiteId, setFilterSiteId] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("");

  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");

    Promise.all([
      api.getReportTypes().catch(() => []),
      api.listReportHistory(50).catch(() => []),
      api.getReportSummary().catch(() => null),
      api.listReportRecords(30).catch(() => []),
      api.listSurveys().catch(() => []),
      api.listAllSites().catch(() => []),
    ])
      .then(([types, history, sum, recs, surv, st]) => {
        setReportTypes(types || []);
        setReportHistory(history || []);
        setSummary(sum);
        setRecords(recs || []);
        setSurveys(surv || []);
        setSites(st || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError("");
    setSuccessMessage("");

    try {
      const generated = await api.generateReport({
        title: customTitle || undefined,
        report_type: selectedType,
        format: selectedFormat,
        filters: {
          survey_id: filterSurveyId || undefined,
          site_id: filterSiteId || undefined,
          species: filterSpecies || undefined,
        },
      });

      setReportHistory([generated, ...reportHistory]);
      setSuccessMessage(`Successfully generated "${generated.title}"! Initiating automatic download...`);
      setCustomTitle("");

      // Trigger download
      await api.triggerReportDownload(
        generated.id,
        `${generated.title}.${generated.file_format === "pdf" ? "pdf" : "xlsx"}`
      );
    } catch (err) {
      setError(`Failed to generate report: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (report) => {
    setDownloadingId(report.id);
    try {
      await api.triggerReportDownload(
        report.id,
        `${report.title}.${report.file_format === "pdf" ? "pdf" : "xlsx"}`
      );
      // update local download count
      setReportHistory(
        reportHistory.map((r) =>
          r.id === report.id ? { ...r, download_count: (r.download_count || 0) + 1 } : r
        )
      );
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const reportTypeIcons = {
    wildlife_survey: Compass,
    species_population: PawPrint,
    biodiversity: Sparkles,
    habitat_assessment: Trees,
    conservation: Shield,
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-canopy-900 via-canopy-800 to-canopy-950 p-6 rounded-2xl text-white shadow-sm border border-canopy-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-ochre-400/20 text-ochre-300 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight">Reports &amp; Export System</h1>
          </div>
          <p className="text-canopy-200 text-sm mt-1 max-w-2xl">
            Generate formal, audit-ready PDF dossiers and multi-sheet Excel workbooks with live data from all intelligence engines.
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 self-start md:self-auto bg-white/10 hover:bg-white/20 text-white border-white/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl p-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Images Processed</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-1">{summary.images_analyzed}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Audio Clips</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-1">{summary.audio_clips}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Species Confirmed</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-1">{summary.species_confirmed}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Active Surveys</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-1">{summary.total_surveys}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">Generated Reports</p>
            <p className="font-display text-2xl font-bold text-bark-900 mt-1">{reportHistory.length}</p>
          </div>
        </div>
      )}

      {/* ================= REPORT GENERATION STUDIO ================= */}
      <div className="card p-6 border-canopy-200">
        <h2 className="font-display font-bold text-bark-900 text-lg mb-1">Generate New Structured Report</h2>
        <p className="text-xs text-canopy-600 mb-6">
          Select a report template, target format, and optional scope filters. Reports compile live data with zero mock placeholders.
        </p>

        <form onSubmit={handleGenerateReport} className="space-y-6">
          {/* Step 1: Select Report Type */}
          <div>
            <label className="label mb-2">1. Select Report Template</label>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { type: "wildlife_survey", name: "Wildlife Survey", desc: "Survey logs & device telemetry", icon: Compass },
                { type: "species_population", name: "Species Population", desc: "Counts, density & trend", icon: PawPrint },
                { type: "biodiversity", name: "Biodiversity Score", desc: "Ecosystem health & richness", icon: Sparkles },
                { type: "habitat_assessment", name: "Habitat Assessment", desc: "Vegetation & degradation", icon: Trees },
                { type: "conservation", name: "Conservation Action", desc: "Priorities & threat alerts", icon: Shield },
              ].map(({ type, name, desc, icon: Icon }) => {
                const isSelected = selectedType === type;
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "bg-canopy-900 text-white border-canopy-900 shadow-md ring-2 ring-ochre-400"
                        : "bg-white text-bark-800 border-canopy-200 hover:border-canopy-400"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`p-1.5 rounded-lg ${isSelected ? "bg-white/20 text-white" : "bg-canopy-100 text-canopy-800"}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-ochre-400" />}
                      </div>
                      <p className="font-display font-bold text-xs leading-snug">{name}</p>
                      <p className={`text-[11px] mt-1 leading-tight ${isSelected ? "text-canopy-200" : "text-canopy-600"}`}>
                        {desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Format & Custom Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">2. Export File Format</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-colors ${
                    selectedFormat === "pdf"
                      ? "bg-red-50/80 border-red-300 text-red-900 ring-1 ring-red-400"
                      : "bg-white border-canopy-200 text-bark-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="report_format"
                    value="pdf"
                    checked={selectedFormat === "pdf"}
                    onChange={() => setSelectedFormat("pdf")}
                  />
                  <span>PDF Document (.pdf)</span>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-colors ${
                    selectedFormat === "excel"
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 ring-1 ring-emerald-400"
                      : "bg-white border-canopy-200 text-bark-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="report_format"
                    value="excel"
                    checked={selectedFormat === "excel"}
                    onChange={() => setSelectedFormat("excel")}
                  />
                  <span>Excel Workbook (.xlsx)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="label">Custom Report Title (Optional)</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Q3 Serengeti Corridor Biodiversity Dossier"
                className="input mt-1"
              />
            </div>
          </div>

          {/* Step 3: Scope Filters */}
          <div>
            <label className="label">3. Scope Filters (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1 text-xs">
              <select
                value={filterSurveyId}
                onChange={(e) => setFilterSurveyId(e.target.value)}
                className="input"
              >
                <option value="">All Surveys (System-wide)</option>
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={filterSiteId}
                onChange={(e) => setFilterSiteId(e.target.value)}
                className="input"
              >
                <option value="">All Monitoring Sites</option>
                {sites.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.site_name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                placeholder="Filter by species (e.g. elephant)"
                className="input"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end pt-3 border-t border-canopy-100">
            <button
              type="submit"
              disabled={generating}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2 shadow-md"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-ochre-400" />
                  <span>Compiling &amp; Exporting Data...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-ochre-400" />
                  <span>Generate &amp; Download {selectedFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ================= REPORT ARCHIVE / HISTORY ================= */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-canopy-100">
          <div>
            <h2 className="font-display font-bold text-bark-900 text-lg">Generated Reports Archive</h2>
            <p className="text-xs text-canopy-600">Past generated reports available for immediate re-download.</p>
          </div>
          <span className="text-xs font-semibold text-canopy-700 bg-canopy-100 px-3 py-1 rounded-full">
            {reportHistory.length} Report(s)
          </span>
        </div>

        {reportHistory.length === 0 && !loading && (
          <p className="text-sm text-canopy-600 py-10 text-center">
            No reports generated yet. Use the generator above to create your first report.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left uppercase text-canopy-600 border-b border-canopy-100 pb-2">
                <th className="py-3">Report Title</th>
                <th className="py-3">Template</th>
                <th className="py-3">Format</th>
                <th className="py-3">Generated By</th>
                <th className="py-3">Timestamp</th>
                <th className="py-3">File Size</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canopy-100">
              {reportHistory.map((r) => {
                const isPdf = r.file_format === "pdf";
                return (
                  <tr key={r.id} className="hover:bg-canopy-50/50">
                    <td className="py-3 font-semibold text-bark-900">{r.title}</td>
                    <td className="py-3 uppercase text-canopy-700 text-[11px] font-medium">
                      {r.report_type.replace("_", " ")}
                    </td>
                    <td className="py-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md uppercase text-[10px] ${
                          isPdf ? "bg-red-100 text-red-800 border border-red-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {r.file_format}
                      </span>
                    </td>
                    <td className="py-3 text-canopy-600">{r.generator_name || "System"}</td>
                    <td className="py-3 text-canopy-600">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3 text-canopy-600">{Math.round(r.file_size_bytes / 1024)} KB</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDownloadReport(r)}
                        disabled={downloadingId === r.id}
                        className="btn-secondary text-xs py-1 px-3 inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingId === r.id ? "Downloading..." : "Download"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= RAW MODULE RECORDS FEED ================= */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-bark-900 text-lg mb-1">Live Ingestion Telemetry Feed</h2>
        <p className="text-xs text-canopy-600 mb-4">
          Real-time stream of ingested camera trap photos, acoustic audio clips, and uploaded dataset archives.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left uppercase text-canopy-600 border-b border-canopy-100 pb-2">
                <th className="py-2.5">Record ID</th>
                <th className="py-2.5">Timestamp</th>
                <th className="py-2.5">Source Node / Dataset</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canopy-100">
              {records.map((r) => (
                <tr key={r.record_id + r.timestamp} className="hover:bg-canopy-50/50">
                  <td className="py-2.5 font-mono font-bold text-bark-900">{r.record_id}</td>
                  <td className="py-2.5 text-canopy-600">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="py-2.5 text-bark-800 font-medium">{r.source}</td>
                  <td className="py-2.5">
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
