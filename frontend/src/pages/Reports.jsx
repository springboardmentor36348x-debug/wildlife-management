import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function Reports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/reports/"
      );

      setReports(response.data);
    } catch (error) {
      console.log(error);
      alert("Failed to load reports.");
    }
  };

  const filteredReports = reports.filter((item) =>
    item.animal.toLowerCase().includes(search.toLowerCase())
  );

  // PDF Export
  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Wildlife Monitoring Report", 14, 20);

    doc.setFontSize(11);
    doc.text(
      `Total Records: ${filteredReports.length}`,
      14,
      30
    );

    const tableData = filteredReports.map((item) => [
      item.image,
      item.animal,
      `${item.confidence}%`,
      new Date(item.date).toLocaleString(),
    ]);

    autoTable(doc, {
      startY: 38,
      head: [
        ["Image", "Animal", "Confidence", "Detection Date"],
      ],
      body: tableData,
    });

    doc.save("wildlife-monitoring-report.pdf");
  };

  // Excel Export
  const downloadExcel = () => {
    const excelData = filteredReports.map((item) => ({
      Image: item.image,
      Animal: item.animal,
      Confidence: `${item.confidence}%`,
      "Detection Date": new Date(item.date).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Wildlife Reports"
    );

    XLSX.writeFile(
      workbook,
      "wildlife-monitoring-report.xlsx"
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0b1120]">

      <Sidebar />

      <main className="ml-64 flex-1 p-8">

        {/* Header */}
        <div className="mb-8">

          <p className="text-yellow-400 text-sm font-semibold uppercase tracking-[0.2em]">
            Wildlife Data Management
          </p>

          <h1 className="text-4xl font-bold text-white mt-2">
            Wildlife Monitoring Reports
          </h1>

          <p className="text-slate-400 mt-2 max-w-3xl">
            Review recorded wildlife detection reports and export the
            available information for further use.
          </p>

        </div>


        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">

          {/* Total Reports */}
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-slate-400 text-sm">
                  Total Reports
                </p>

                <p className="text-4xl font-bold text-white mt-2">
                  {reports.length}
                </p>

              </div>

              <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center text-2xl">
                📄
              </div>

            </div>

          </div>


          {/* Filtered Records */}
          <div className="bg-teal-500/10 border border-teal-400/20 rounded-2xl p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-slate-400 text-sm">
                  Records Shown
                </p>

                <p className="text-4xl font-bold text-white mt-2">
                  {filteredReports.length}
                </p>

              </div>

              <div className="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center text-2xl">
                🔎
              </div>

            </div>

          </div>


          {/* Export */}
          <div className="bg-purple-500/10 border border-purple-400/20 rounded-2xl p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-slate-400 text-sm">
                  Export Formats
                </p>

                <p className="text-2xl font-bold text-white mt-2">
                  PDF + Excel
                </p>

              </div>

              <div className="w-14 h-14 rounded-xl bg-purple-500 flex items-center justify-center text-2xl">
                📥
              </div>

            </div>

          </div>

        </div>


        {/* Search & Export Panel */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 mb-7">

          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

            {/* Search */}
            <div className="relative flex-1 max-w-xl">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                🔎
              </span>

              <input
                type="text"
                placeholder="Search by wildlife name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0b1120] border border-white/10 text-white placeholder-slate-500 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition"
              />

            </div>


            {/* Export Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">

              <button
                onClick={downloadPDF}
                className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-400/20 text-red-400 px-5 py-3 rounded-xl font-semibold hover:bg-red-500/20 transition"
              >
                📄
                Download PDF
              </button>


              <button
                onClick={downloadExcel}
                className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-400/20 text-green-400 px-5 py-3 rounded-xl font-semibold hover:bg-green-500/20 transition"
              >
                📊
                Download Excel
              </button>

            </div>

          </div>

        </div>


        {/* Reports Table */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl overflow-hidden">

          {/* Table Header */}
          <div className="p-7 border-b border-white/10">

            <div className="flex items-center gap-4">

              <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center text-2xl">
                📋
              </div>

              <div>

                <h2 className="text-2xl font-bold text-white">
                  Detection Reports
                </h2>

                <p className="text-slate-400 text-sm mt-1">
                  Wildlife records retrieved from the reporting system.
                </p>

              </div>

            </div>

          </div>


          {/* Table */}
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="bg-white/5 border-b border-white/10">

                  <th className="text-left p-4 text-slate-400 text-sm font-semibold">
                    Image
                  </th>

                  <th className="text-left p-4 text-slate-400 text-sm font-semibold">
                    Wildlife
                  </th>

                  <th className="text-left p-4 text-slate-400 text-sm font-semibold">
                    Confidence
                  </th>

                  <th className="text-left p-4 text-slate-400 text-sm font-semibold">
                    Detection Date
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredReports.length > 0 ? (

                  filteredReports.map((item, index) => (

                    <tr
                      key={index}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >

                      <td className="p-4 text-slate-300">
                        {item.image}
                      </td>


                      <td className="p-4">

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                            🐾
                          </div>

                          <span className="text-white font-medium">
                            {item.animal}
                          </span>

                        </div>

                      </td>


                      <td className="p-4">

                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-400 text-sm font-semibold">
                          {item.confidence}%
                        </span>

                      </td>


                      <td className="p-4 text-slate-400 text-sm">
                        {new Date(item.date).toLocaleString()}
                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="4"
                      className="p-12 text-center"
                    >

                      <div className="text-5xl mb-4">
                        📄
                      </div>

                      <p className="text-slate-400">
                        No wildlife reports found.
                      </p>

                      {search && (
                        <p className="text-slate-600 text-sm mt-2">
                          Try searching for a different wildlife name.
                        </p>
                      )}

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* Information */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-7 mt-7">

          <div className="flex items-start gap-4">

            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-2xl shrink-0">
              💡
            </div>

            <div>

              <h2 className="text-xl font-bold text-white">
                Report Information
              </h2>

              <p className="text-slate-400 mt-2 leading-relaxed">
                Use the search field to filter wildlife records. Reports
                can be exported as PDF or Excel files for documentation,
                analysis and conservation reporting.
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Reports;