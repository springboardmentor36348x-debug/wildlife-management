import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ResearcherDashboard from "./dashboards/ResearcherDashboard";
import ConservationDashboard from "./dashboards/ConservationDashboard";
import ForestDashboard from "./dashboards/ForestDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import { Eye, Shield, PawPrint, Trees, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const userRole = user?.role || "researcher";
  const [previewRole, setPreviewRole] = useState(userRole);

  // If user is administrator, allow switching between all 4 dashboards to inspect system behavior
  const isAdmin = user?.role === "administrator";
  const activeDashboardRole = isAdmin ? previewRole : userRole;

  return (
    <div className="space-y-6">
      {/* Admin Role Preview Bar */}
      {isAdmin && (
        <div className="bg-canopy-900/90 text-white px-5 py-3 rounded-xl border border-canopy-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-ochre-400/20 text-ochre-300 rounded-md">
              <Eye className="w-4 h-4" />
            </span>
            <span className="font-semibold text-canopy-100">Administrator Role Inspector:</span>
            <span className="text-canopy-300">Preview live dashboard interfaces for each role.</span>
          </div>

          <div className="flex items-center gap-1.5 bg-canopy-950 p-1 rounded-lg border border-canopy-800">
            {[
              { role: "administrator", label: "Admin Console", icon: ShieldCheck },
              { role: "researcher", label: "Researcher", icon: PawPrint },
              { role: "conservation_officer", label: "Conservation Officer", icon: Shield },
              { role: "forest_department", label: "Forest Department", icon: Trees },
            ].map(({ role, label, icon: Icon }) => (
              <button
                key={role}
                onClick={() => setPreviewRole(role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  previewRole === role
                    ? "bg-ochre-400 text-bark-950 font-bold"
                    : "text-canopy-300 hover:text-white hover:bg-canopy-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render the appropriate role dashboard */}
      {activeDashboardRole === "administrator" && <AdminDashboard />}
      {activeDashboardRole === "researcher" && <ResearcherDashboard />}
      {activeDashboardRole === "conservation_officer" && <ConservationDashboard />}
      {activeDashboardRole === "forest_department" && <ForestDashboard />}
    </div>
  );
}
