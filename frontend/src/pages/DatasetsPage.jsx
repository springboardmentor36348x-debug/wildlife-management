import { Fragment, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { StatusBadge } from "../components/Badges";
import DatasetFilesPanel from "../components/DatasetFilesPanel";

const SOURCES = [
  { value: "snapshot_serengeti", label: "Snapshot Serengeti" },
  { value: "inaturalist", label: "iNaturalist" },
  { value: "birdclef", label: "BirdCLEF" },
  { value: "gbif", label: "GBIF" },
  { value: "animal_kingdom", label: "Animal Kingdom" },
  { value: "custom_upload", label: "Custom Upload" },
];

const CAN_MANAGE = ["administrator", "researcher"];

export default function DatasetsPage() {
  const { user } = useAuth();
  const canManage = CAN_MANAGE.includes(user.role);

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    source: "snapshot_serengeti",
    purpose: "",
    record_count: "",
  });

  async function refresh() {
    setLoading(true);
    try {
      setDatasets(await api.listDatasets());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createDataset({
        ...form,
        record_count: parseInt(form.record_count || "0", 10),
      });
      setForm({ name: "", source: "snapshot_serengeti", purpose: "", record_count: "" });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteDataset(id);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-bark-900">Dataset Pipeline</h1>
        <p className="text-canopy-700 text-sm mt-1">
          Register external datasets and upload real sample images / audio files against them.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {canManage && (
        <form onSubmit={handleSubmit} className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="label">Dataset name</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Source</label>
            <select
              className="input"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Purpose</label>
            <input
              className="input"
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              placeholder="e.g. species classification"
            />
          </div>
          <div>
            <label className="label">Record count</label>
            <input
              className="input"
              type="number"
              value={form.record_count}
              onChange={(e) => setForm((f) => ({ ...f, record_count: e.target.value }))}
            />
          </div>
          <div className="md:col-span-4">
            <button className="btn-primary">Register dataset</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-canopy-500 border-b border-canopy-100">
              <th className="py-2 px-5">Name</th>
              <th className="py-2">Source</th>
              <th className="py-2">Purpose</th>
              <th className="py-2">Records</th>
              <th className="py-2">Status</th>
              <th className="py-2 px-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canopy-100">
            {datasets.map((d) => (
              <Fragment key={d.id}>
                <tr
                  className="cursor-pointer hover:bg-canopy-50"
                  onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                >
                  <td className="py-2 px-5 font-medium text-bark-900 flex items-center gap-2">
                    <span className={`transition-transform ${expandedId === d.id ? "rotate-90" : ""}`}>▸</span>
                    {d.name}
                  </td>
                  <td className="py-2 text-canopy-700 capitalize">{d.source.replace("_", " ")}</td>
                  <td className="py-2 text-canopy-700">{d.purpose || "—"}</td>
                  <td className="py-2 text-canopy-700">{d.record_count.toLocaleString()}</td>
                  <td className="py-2"><StatusBadge status={d.status} /></td>
                  <td className="py-2 px-5 text-right">
                    {canManage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(d.id);
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === d.id && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <DatasetFilesPanel
                        datasetId={d.id}
                        canManage={canManage}
                        onFilesChanged={refresh}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {datasets.length === 0 && !loading && (
          <p className="text-sm text-canopy-600 py-4 px-5">No datasets registered yet.</p>
        )}
      </div>

      <p className="text-xs text-canopy-500">
        Click a dataset row to expand it and upload real sample images/audio files — this actually stores
        and serves the files, not just metadata.
      </p>
    </div>
  );
}
