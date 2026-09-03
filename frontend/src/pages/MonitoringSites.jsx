import React, { useEffect, useState } from "react";
import { listMonitoringSites, createMonitoringSite } from "../api/surveys";
import { downloadSitePdfReport, downloadSiteExcelReport } from "../api/reports";

const HABITAT_TYPES = ["forest", "grassland", "wetland", "riverine", "mountain", "coastal", "other"];

export default function MonitoringSites() {
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({
    name: "",
    latitude: "",
    longitude: "",
    habitat_type: "forest",
    protected_area: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (site, format) => {
    setDownloadingId(`${site.id}-${format}`);
    try {
      if (format === "pdf") await downloadSitePdfReport(site.id, site.name);
      else await downloadSiteExcelReport(site.id, site.name);
    } catch (err) {
      setError("Failed to download report.");
    } finally {
      setDownloadingId(null);
    }
  };

  const loadSites = async () => {
    const res = await listMonitoringSites();
    setSites(res.data);
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createMonitoringSite({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      setForm({ name: "", latitude: "", longitude: "", habitat_type: "forest", protected_area: "", description: "" });
      await loadSites();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create monitoring site.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold mb-3">Register Monitoring Site</h2>
          {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-3">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              placeholder="Site name"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                required
                type="number"
                step="any"
                placeholder="Latitude"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
              <input
                required
                type="number"
                step="any"
                placeholder="Longitude"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.habitat_type}
              onChange={(e) => setForm({ ...form, habitat_type: e.target.value })}
            >
              {HABITAT_TYPES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <input
              placeholder="Protected area (optional)"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.protected_area}
              onChange={(e) => setForm({ ...form, protected_area: e.target.value })}
            />
            <textarea
              placeholder="Description (optional)"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-forest-600 hover:bg-forest-700 text-white py-2 rounded font-medium transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Register Site"}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold mb-3">All Monitoring Sites ({sites.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Name</th>
                  <th>Habitat</th>
                  <th>Coordinates</th>
                  <th>Protected Area</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="capitalize">{s.habitat_type}</td>
                    <td>
                      {s.latitude.toFixed(3)}, {s.longitude.toFixed(3)}
                    </td>
                    <td>{s.protected_area || "—"}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(s, "pdf")}
                          disabled={downloadingId === `${s.id}-pdf`}
                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {downloadingId === `${s.id}-pdf` ? "..." : "PDF"}
                        </button>
                        <button
                          onClick={() => handleDownload(s, "excel")}
                          disabled={downloadingId === `${s.id}-excel`}
                          className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                        >
                          {downloadingId === `${s.id}-excel` ? "..." : "Excel"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sites.length === 0 && <p className="text-gray-400 text-sm py-4">No sites registered yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
