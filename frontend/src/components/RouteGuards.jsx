import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canopy-900">
        <p className="text-canopy-200 text-sm">Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-display text-xl font-semibold text-bark-900 mb-2">Access restricted</h2>
        <p className="text-sm text-canopy-700">
          Your role ({user.role.replace("_", " ")}) does not have permission to view this page.
        </p>
      </div>
    );
  }
  return children;
}
