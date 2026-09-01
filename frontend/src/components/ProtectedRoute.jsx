import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wild-50 text-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-wild-600 border-t-transparent rounded-full animate-spin" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to Login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if allowedRoles is specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-wild-50 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 font-bold text-xl">
          403
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-600 mt-2 max-w-md">
          Your current role (<strong>{user.role}</strong>) does not have permission to access this page.
        </p>
        <a
          href="/dashboard"
          className="mt-6 px-4 py-2 bg-wild-900 text-white rounded-lg font-medium hover:bg-wild-800 transition-colors"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return <Outlet />;
}
