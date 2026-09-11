import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RoleBadge } from "./Badges";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { to: "/", label: "Overview", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/surveys", label: "Surveys & Sites", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/datasets", label: "Dataset Pipeline", roles: ["administrator", "researcher"] },
  { to: "/species-recognition", label: "Image / Audio Detection", roles: ["administrator", "researcher", "forest_department"] },
  { to: "/population", label: "Population", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/habitat", label: "Habitat (Map)", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/conservation", label: "Conservation", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/ecosystem-health", label: "Ecosystem Health", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/gis-mapping", label: "GIS Mapping", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/performance", label: "Performance Metrics", roles: ["administrator", "researcher"] },
  { to: "/notifications", label: "Alerts", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/reports", label: "Reports", roles: ["administrator", "researcher", "conservation_officer", "forest_department"] },
  { to: "/users", label: "User Management", roles: ["administrator"] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-canopy-900 text-canopy-50 flex flex-col">
        <div className="px-6 py-6 border-b border-canopy-800">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="#d8a441" strokeWidth="1.5" />
              <circle cx="14" cy="14" r="8" stroke="#d8a441" strokeWidth="1.2" opacity="0.7" />
              <circle cx="14" cy="14" r="4" stroke="#d8a441" strokeWidth="1" opacity="0.5" />
              <circle cx="14" cy="14" r="1.6" fill="#d8a441" />
            </svg>
            <span className="font-display font-semibold text-lg leading-tight">
              Wildlife<br />Intelligence
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.filter((item) => item.roles.includes(user?.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-canopy-700 text-white"
                    : "text-canopy-200 hover:bg-canopy-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-canopy-800 text-xs text-canopy-300">
          Milestone 4 · GIS Mapping, Performance Metrics, Alerts &amp; Reports Export
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-contour" style={{ backgroundSize: "16px 16px" }}>
        <header className="bg-white/80 backdrop-blur border-b border-canopy-100 px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">
              AI-Powered Wildlife Population Intelligence System
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            {user && <RoleBadge role={user.role} />}
            <span className="text-sm text-bark-800 font-medium">{user?.full_name}</span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-sm text-canopy-700 hover:text-canopy-900 font-medium underline underline-offset-2"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
