import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/surveys", label: "Surveys & Sites", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/datasets", label: "Datasets", roles: ["administrator", "researcher"] },
  { to: "/species-recognition", label: "Species AI", roles: ["administrator", "researcher", "forest_department"] },
  { to: "/reports", label: "Reports", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/users", label: "Users", roles: ["administrator"] },
];

const ROLE_LABELS = {
  administrator: "Admin",
  researcher: "Researcher",
  conservation_officer: "Officer",
  forest_department: "Forest Dept",
};

const ROLE_BADGE_CLASS = {
  administrator: "badge-purple",
  researcher: "badge-cyan",
  conservation_officer: "badge-emerald",
  forest_department: "badge-amber",
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <div className="brand-icon">🌍</div>
            <span className="brand-text">WildlifeOS</span>
          </div>

          <ul className="navbar-nav">
            {NAV_ITEMS.filter((item) => item.roles.includes(user?.role)).map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar-user">
            <span className={`badge ${ROLE_BADGE_CLASS[user?.role] || "badge-slate"}`}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
            <span className="user-name">{user?.full_name}</span>
            <button
              className="logout-btn"
              onClick={() => { logout(); navigate("/login"); }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="main-content" style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
