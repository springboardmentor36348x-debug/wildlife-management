import { useEffect, useState } from "react";
import { api } from "../api/client";

const ROLES = ["administrator", "researcher", "conservation_officer", "forest_department"];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "researcher", organization: "" });
  const [error, setError] = useState("");
  const [editUser, setEditUser] = useState(null);

  useEffect(() => { load(); }, []);
  function load() { api.listUsers().then(setUsers).catch(() => {}); }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.adminCreateUser(form);
      setShowForm(false);
      setForm({ full_name: "", email: "", password: "", role: "researcher", organization: "" });
      load();
    } catch (err) { setError(err.message); }
  }

  async function toggleStatus(u) {
    try {
      await api.adminUpdateUser(u.id, { is_active: !u.is_active });
      load();
    } catch (err) { alert(err.message); }
  }

  async function updateRole(u, newRole) {
    try {
      await api.adminUpdateUser(u.id, { role: newRole });
      load();
    } catch (err) { alert(err.message); }
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>👥 User Management</h1>
          <p>System administrator control over platform access and roles.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Provision User</button>
      </div>

      {error && <div className="auth-error mb-4">{error}</div>}

      {showForm && (
        <div className="card mb-4 border-active" style={{ borderColor: "var(--accent-purple)" }}>
          <h3 className="section-title">Provision New User</h3>
          <form onSubmit={handleCreate} className="grid grid-3">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Password</label><input type="text" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></div>
            <div className="form-group"><label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Organization</label><input className="form-input" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
            <div className="flex items-end mb-4"><button type="submit" className="btn btn-primary w-full">Create Account</button></div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">Active Platform Users</h3>
        <div className="table-container">
          <table>
            <thead><tr><th>Name / Email</th><th>Role</th><th>Organization</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="font-semibold">{u.full_name}</div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </td>
                  <td>
                    <select className="form-select" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", width: "auto" }} value={u.role} onChange={(e) => updateRole(u, e.target.value)}>
                      {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                    </select>
                  </td>
                  <td className="text-xs">{u.organization || "—"}</td>
                  <td><span className={`badge ${u.is_active ? "badge-emerald" : "badge-rose"}`}>{u.is_active ? "Active" : "Disabled"}</span></td>
                  <td>
                    <button className={`btn btn-sm ${u.is_active ? "btn-danger" : "btn-secondary"}`} onClick={() => toggleStatus(u)}>
                      {u.is_active ? "Disable" : "Enable"}
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
