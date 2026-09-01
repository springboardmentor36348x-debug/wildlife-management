import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RoleBadge } from "./Badges";
import {
  LayoutDashboard,
  MapPin,
  Database,
  Camera,
  FileSpreadsheet,
  Users,
  Compass,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Role Dashboard", icon: LayoutDashboard, roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/surveys", label: "Surveys & Sites", icon: MapPin, roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/datasets", label: "Dataset Pipeline", icon: Database, roles: ["administrator", "researcher"] },
  { to: "/species-recognition", label: "Species Recognition", icon: Camera, roles: ["administrator", "researcher", "forest_department"] },
  { to: "/reports", label: "Reports & Exports", icon: FileSpreadsheet, roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/users", label: "User Management", icon: Users, roles: ["administrator"] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-canopy-900 text-canopy-50 flex flex-col shrink-0 shadow-lg">
        <div className="px-6 py-6 border-b border-canopy-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ochre-400/20 border border-ochre-400/40 flex items-center justify-center text-ochre-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-base leading-tight block text-white">
                Wildlife Intelligence
              </span>
              <span className="text-[10px] text-canopy-300 tracking-wider uppercase font-semibold">
                Conservation System
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.filter((item) => item.roles.includes(user?.role)).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-canopy-700 text-white shadow-xs font-bold"
                      : "text-canopy-200 hover:bg-canopy-800/80 hover:text-white"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-canopy-800 text-[11px] text-canopy-300">
          <p className="font-bold text-canopy-100">Milestone 4</p>
          <p className="text-[10px] text-canopy-400 mt-0.5">
            Dashboards &amp; Reports &amp; GIS
          </p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-contour overflow-x-hidden" style={{ backgroundSize: "16px 16px" }}>
        <header className="bg-white/85 backdrop-blur-md border-b border-canopy-100 px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-canopy-600 font-bold">
              AI-Powered Wildlife Population Intelligence System
            </p>
          </div>
          <div className="flex items-center gap-3.5">
            {user && <RoleBadge role={user.role} />}
            <span className="text-xs text-bark-900 font-semibold">{user?.full_name}</span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-xs text-canopy-700 hover:text-red-700 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 px-8 py-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
