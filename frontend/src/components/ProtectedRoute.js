import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;

  if (!token) return <Navigate to="/" />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

export default ProtectedRoute;