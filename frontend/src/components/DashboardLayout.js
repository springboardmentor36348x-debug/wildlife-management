import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { AuthContext } from "../context/AuthContext";
import "./DashboardLayout.css";

function DashboardLayout({ title, children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="dl-shell">
      <Sidebar />
      <div className="dl-main">
        <header className="dl-topbar">
          <h1 className="dl-title">{title}</h1>

          <div className="dl-topbar-right">
            <input className="dl-search" type="text" placeholder="Search..." />
            <div className="dl-user" onClick={() => navigate("/dashboard")}>
              <div className="dl-avatar">{initials}</div>
              <div className="dl-user-info">
                <span className="dl-user-name">{user?.full_name}</span>
                <span className="dl-user-role">{user?.role?.replace(/_/g, " ")}</span>
              </div>
            </div>
            <button className="dl-logout" onClick={logout}>Logout</button>
          </div>
        </header>

        <main className="dl-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;