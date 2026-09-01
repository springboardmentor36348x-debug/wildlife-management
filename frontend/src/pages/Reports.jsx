import { useState, useEffect } from "react";
import { FileText, Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import Card from "../components/ui/Card";
import { fetchReportsSummary, downloadReport } from "../api/intelligence";

const TABS = ["Monthly Reports", "Species Reports", "Custom Reports"];

export default function Reports() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await fetchReportsSummary();
        setReportsData(data);
      } catch (err) {
        console.error("Error loading reports summary:", err);
      }
    }
    loadReports();
  }, []);

  const monthlySummaries = reportsData?.monthly_summaries || [
    { month: "August 2026", observations: 3, speciesDetected: 3 },
    { month: "July 2026", observations: 0, speciesDetected: 0 },
    { month: "June 2026", observations: 0, speciesDetected: 0 },
  ];

  const recentReports = reportsData?.recent_reports || [
    { name: "August 2026 Wildlife Intelligence & Population Report", type: "Comprehensive", period: "August 2026" },
    { name: "Ecosystem Health & Biodiversity Assessment", type: "Biodiversity", period: "August 2026" },
    { name: "Targeted Conservation Interventions Summary", type: "Conservation", period: "August 2026" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Wildlife Intelligence Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Generate, view, and export official wildlife monitoring and population reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadReport("csv")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileSpreadsheet size={15} className="text-wild-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => downloadReport("pdf")}
            className="flex items-center gap-2 rounded-xl bg-wild-600 hover:bg-wild-700 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-md active:scale-[0.99]"
          >
            <Download size={15} />
            <span>Download Official PDF Report</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === tab
                ? "bg-wild-800 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {monthlySummaries.map((s) => (
          <div key={s.month} className="card">
            <p className="text-sm font-semibold text-slate-800">{s.month}</p>
            <div className="mt-3 flex justify-between text-xs text-slate-500">
              <div>
                <p>Total Observations</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{s.observations}</p>
              </div>
              <div className="text-right">
                <p>Species Detected</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{s.speciesDetected}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-medium text-slate-800 mb-4">Generated Ecological & Intelligence Reports</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 font-medium uppercase tracking-wider">
                <th className="py-2.5">Report Document Name</th>
                <th className="py-2.5">Report Type</th>
                <th className="py-2.5">Assessment Period</th>
                <th className="py-2.5 text-right">Instant Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentReports.map((r, index) => (
                <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-medium text-slate-800 flex items-center gap-2">
                    <FileText size={16} className="text-wild-600 flex-shrink-0" />
                    <span>{r.name}</span>
                  </td>
                  <td className="py-3 text-slate-600">
                    <span className="stat-badge bg-wild-100 text-wild-700">
                      {r.type}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{r.period}</td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() => downloadReport("pdf")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-wild-700 hover:text-wild-800 bg-wild-50 hover:bg-wild-100 px-3 py-1.5 rounded-lg border border-wild-200 transition-colors"
                    >
                      <Download size={13} />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => downloadReport("csv")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                    >
                      <FileSpreadsheet size={13} />
                      <span>Excel (CSV)</span>
                    </button>
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
