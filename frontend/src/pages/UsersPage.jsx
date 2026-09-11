import { useEffect, useState } from "react";
import { api } from "../api/client";
import { RoleBadge } from "../components/Badges";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setUsers(await api.listUsers());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDeactivate(id) {
    try {
      await api.deactivateUser(id);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-bark-900">User Management</h1>
        <p className="text-canopy-700 text-sm mt-1">
          Administer researcher, officer, and forest department accounts.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="card p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-canopy-500 border-b border-canopy-100">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Organization</th>
              <th className="py-2">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canopy-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-2 font-medium text-bark-900">{u.full_name}</td>
                <td className="py-2 text-canopy-700">{u.email}</td>
                <td className="py-2"><RoleBadge role={u.role} /></td>
                <td className="py-2 text-canopy-700">{u.organization || "—"}</td>
                <td className="py-2">
                  <span className={`badge ${u.is_active ? "badge-ok" : "badge-high"}`}>
                    {u.is_active ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="py-2 text-right">
                  {u.is_active && (
                    <button
                      onClick={() => handleDeactivate(u.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <p className="text-sm text-canopy-600 py-4">No users found.</p>
        )}
      </div>
    </div>
  );
}
