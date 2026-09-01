import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search as SearchIcon, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import Card from "../ui/Card.jsx";
import Modal from "../ui/Modal.jsx";
import GISMap from "../ui/GISMap.jsx";


export default function EntityManager({
  title,
  singular,
  description,
  api,
  columns,
  fields,
  emptyForm,
  canCreate,
  canUpdate,
  canDelete,
  searchParamName = "search",
  filters = [], // [{ name, label, options: [{value,label}] }]
}) {
  const { token } = useAuth();
  const itemLabel = singular || title.replace(/s$/, "");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { [searchParamName]: search, ...filterValues };
      const data = await api.list(token, params);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, token, search, filterValues, searchParamName]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    const next = { ...emptyForm };
    Object.keys(next).forEach((k) => {
      next[k] = item[k] ?? next[k];
    });
    setForm(next);
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {};
      fields.forEach((f) => {
        let v = form[f.name];
        if (f.type === "number" && v !== "" && v !== null && v !== undefined) v = Number(v);
        if ((v === "" || v === undefined) && f.optional) v = null;
        payload[f.name] = v;
      });

      if (editingItem) {
        await api.update(token, editingItem.id, payload);
        setSuccessMsg(`${itemLabel} updated successfully`);
      } else {
        await api.create(token, payload);
        setSuccessMsg(`${itemLabel} created successfully`);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Permanently delete this ${itemLabel.toLowerCase()}? This cannot be undone.`)) return;
    try {
      await api.remove(token, item.id);
      setSuccessMsg(`${itemLabel} deleted`);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 text-sm font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus size={18} className="text-white" /> Add {itemLabel}
          </button>
        )}

      </div>

      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-2">
            <SearchIcon size={16} className="text-forest-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          {filters.map((f) => (
            <select
              key={f.name}
              value={filterValues[f.name] || ""}
              onChange={(e) => setFilterValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
              className="rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-forest-600"
            >
              <option value="">{f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3.5 py-2 text-sm font-medium text-forest-600 hover:bg-surface"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* GIS Map Toggle View if items have latitude & longitude */}
        {items.some((i) => i.latitude != null && i.longitude != null) && (
          <div className="mb-4">
            <GISMap
              markers={items}
              height="380px"
              title={`${title} — Spatial Telemetry GIS Map`}
              subtitle="Live geographical pinpoints from database coordinates"
            />
          </div>
        )}


        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-forest-400">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-forest-400">No records found.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-forest-400">
                  {columns.map((c) => (
                    <th key={c.key} className="py-2 font-medium">
                      {c.label}
                    </th>
                  ))}
                  {(canUpdate || canDelete) && <th className="py-2 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-surface-border last:border-0">
                    {columns.map((c) => (
                      <td key={c.key} className="py-2.5">
                        {c.render ? c.render(item) : item[c.key] ?? "—"}
                      </td>
                    ))}
                    {(canUpdate || canDelete) && (
                      <td className="py-2.5">
                        <div className="flex justify-end gap-3">
                          {canUpdate && (
                            <button onClick={() => openEdit(item)} className="text-forest-500 hover:text-forest-700">
                              <Pencil size={15} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title={editingItem ? `Edit ${itemLabel}` : `Add ${itemLabel}`}
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="entity-form"
              disabled={saving}
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 text-sm font-semibold shadow-md transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving..." : editingItem ? "Save Changes" : `Create ${itemLabel}`}
            </button>
          </>
        }
      >
        <form id="entity-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
          )}
          {fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === "select" ? (
                <select
                  value={form[f.name] ?? ""}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  required={f.required}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">{f.placeholder || "Select..."}</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  value={form[f.name] ?? ""}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              ) : (
                <input
                  type={f.type || "text"}
                  step={f.step}
                  value={form[f.name] ?? ""}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  required={f.required}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              )}
            </div>
          ))}
        </form>
      </Modal>


    </div>
  );
}
