import React, { useEffect, useState } from "react";
import { listSurveys, createSurvey, listMonitoringSites } from "../api/surveys";

export default function Surveys() {
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({
    survey_name: "",
    monitoring_site_id: "",
    survey_date: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    const [surveysRes, sitesRes] = await Promise.all([listSurveys(), listMonitoringSites()]);
    setSurveys(surveysRes.data);
    setSites(sitesRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createSurvey({
        ...form,
        survey_date: new Date(form.survey_date).toISOString(),
      });
      setForm({ survey_name: "", monitoring_site_id: "", survey_date: "", notes: "" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create survey.");
    } finally {
      setSubmitting(false);
    }
  };

  const siteName = (id) => sites.find((s) => s.id === id)?.name || "Unknown site";

  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold mb-3">Log a New Survey</h2>
          {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-3">{error}</div>}
          {sites.length === 0 ? (
            <p className="text-sm text-gray-400">
              Register a monitoring site first before logging a survey.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Survey name"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.survey_name}
                onChange={(e) => setForm({ ...form, survey_name: e.target.value })}
              />
              <select
                required
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.monitoring_site_id}
                onChange={(e) => setForm({ ...form, monitoring_site_id: e.target.value })}
              >
                <option value="">Select monitoring site</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                required
                type="date"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.survey_date}
                onChange={(e) => setForm({ ...form, survey_date: e.target.value })}
              />
              <textarea
                placeholder="Notes (optional)"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-forest-600 hover:bg-forest-700 text-white py-2 rounded font-medium transition disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Log Survey"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold mb-3">All Surveys ({surveys.length})</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Survey</th>
                <th>Site</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{s.survey_name}</td>
                  <td>{siteName(s.monitoring_site_id)}</td>
                  <td>{new Date(s.survey_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {surveys.length === 0 && <p className="text-gray-400 text-sm py-4">No surveys logged yet.</p>}
        </div>
      </div>
    </div>
  );
}
