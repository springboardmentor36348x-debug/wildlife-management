import React, { useState } from "react";
import {
  PawPrint, Camera, Mic, TreePine, AlertTriangle, MapPin, Users,
  BarChart3, ShieldCheck, Settings, Bell, Search, ChevronDown, Bird, Fish
} from "lucide-react";

// ---- Design tokens (used as inline styles since custom colors aren't
// available through Tailwind's default utility set in this environment) ----
const palette = {
  pine: "#16302A",      // deep forest, sidebar bg
  pineLight: "#1E4038",
  moss: "#5B8266",       // primary accent
  sand: "#F3EFE4",       // page background
  card: "#FFFFFF",
  bark: "#3A2E27",       // heading text
  amber: "#C08552",      // warning / endangered accent
  danger: "#B4442E",
  slate: "#6B6B63",
};

const roles = [
  { id: "researcher", label: "Wildlife Researcher", icon: PawPrint },
  { id: "conservation", label: "Conservation Officer", icon: ShieldCheck },
  { id: "forest", label: "Forest Department", icon: TreePine },
  { id: "admin", label: "Administrator", icon: Settings },
];

const navByRole = {
  researcher: ["Species Observations", "Population Analytics", "Biodiversity Reports", "Habitat Insights"],
  conservation: ["Threat Monitoring", "Conservation Priorities", "Species Trends", "Restoration Plans"],
  forest: ["Protected Areas", "Wildlife Movement", "Patrol Planning", "Incident Reports"],
  admin: ["User Management", "Platform Analytics", "Monitoring Systems", "Report Generation"],
};

const statsByRole = {
  researcher: [
    { label: "Species Logged", value: "184", icon: PawPrint },
    { label: "Active Camera Traps", value: "62", icon: Camera },
    { label: "Audio Sensors Live", value: "27", icon: Mic },
    { label: "New Observations (7d)", value: "1,204", icon: BarChart3 },
  ],
  conservation: [
    { label: "Critical Alerts", value: "3", icon: AlertTriangle },
    { label: "Vulnerable Species", value: "11", icon: ShieldCheck },
    { label: "Sites Needing Action", value: "5", icon: MapPin },
    { label: "Ecosystem Health Score", value: "72 / 100", icon: BarChart3 },
  ],
  forest: [
    { label: "Protected Areas", value: "9", icon: TreePine },
    { label: "Patrols This Week", value: "34", icon: ShieldCheck },
    { label: "Movement Alerts", value: "6", icon: MapPin },
    { label: "Open Incidents", value: "2", icon: AlertTriangle },
  ],
  admin: [
    { label: "Total Users", value: "58", icon: Users },
    { label: "Monitoring Devices", value: "89", icon: Camera },
    { label: "Reports Generated", value: "412", icon: BarChart3 },
    { label: "System Uptime", value: "99.6%", icon: ShieldCheck },
  ],
};

const observations = [
  { id: "OBS-2291", species: "Panthera tigris", common: "Bengal Tiger", site: "Zone 4 - Riverbend", conf: 96, status: "Endangered" },
  { id: "OBS-2290", species: "Elephas maximus", common: "Asian Elephant", site: "Zone 2 - North Ridge", conf: 91, status: "Vulnerable" },
  { id: "OBS-2285", species: "Axis axis", common: "Chital Deer", site: "Zone 1 - Grassland", conf: 99, status: "Healthy" },
];

const statusColor = {
  Endangered: palette.danger,
  Vulnerable: palette.amber,
  Healthy: palette.moss,
};

function Sidebar({ activeRole, setActiveRole, activeNav, setActiveNav }) {
  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col justify-between py-6 px-4"
      style={{ backgroundColor: palette.pine, color: "#EDEFE9" }}
    >
      <div>
        <div className="flex items-center gap-2 px-2 mb-8">
          <TreePine size={26} color={palette.moss} />
          <div>
            <div className="text-sm font-semibold tracking-wide leading-tight">Wildlife Population</div>
            <div className="text-xs opacity-60 leading-tight">Intelligence System</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-wider opacity-50 px-2 mb-2">Role</div>
          <div className="flex flex-col gap-1">
            {roles.map((r) => {
              const Icon = r.icon;
              const active = r.id === activeRole;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setActiveRole(r.id);
                    setActiveNav(navByRole[r.id][0]);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors"
                  style={{
                    backgroundColor: active ? palette.pineLight : "transparent",
                    color: active ? "#FFFFFF" : "#C9D0C8",
                  }}
                >
                  <Icon size={16} />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider opacity-50 px-2 mb-2">Dashboard</div>
          <div className="flex flex-col gap-1">
            {navByRole[activeRole].map((item) => {
              const active = item === activeNav;
              return (
                <button
                  key={item}
                  onClick={() => setActiveNav(item)}
                  className="px-3 py-2 rounded-md text-sm text-left"
                  style={{
                    backgroundColor: active ? palette.moss : "transparent",
                    color: active ? "#0E211B" : "#C9D0C8",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-[11px] opacity-40 px-2">v1.0 · Milestone 1</div>
    </aside>
  );
}

function Topbar({ activeNav }) {
  return (
    <div className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "#E4DFCF" }}>
      <div>
        <div className="text-lg font-semibold" style={{ color: palette.bark }}>{activeNav}</div>
        <div className="text-xs" style={{ color: palette.slate }}>Camera traps · Audio sensors · Satellite feeds</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: "#EDE8D8" }}>
          <Search size={14} color={palette.slate} />
          <input
            placeholder="Search species, site, survey ID..."
            className="bg-transparent text-sm outline-none w-56"
            style={{ color: palette.bark }}
          />
        </div>
        <Bell size={18} color={palette.slate} />
        <div className="flex items-center gap-2 pl-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ backgroundColor: palette.moss, color: "#0E211B" }}
          >
            RS
          </div>
          <ChevronDown size={14} color={palette.slate} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div
      className="flex-1 rounded-xl p-5 flex flex-col gap-3"
      style={{ backgroundColor: palette.card, border: "1px solid #E4DFCF" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: "#EAF0EA" }}
      >
        <Icon size={18} color={palette.moss} />
      </div>
      <div>
        <div className="text-2xl font-semibold" style={{ color: palette.bark }}>{value}</div>
        <div className="text-xs" style={{ color: palette.slate }}>{label}</div>
      </div>
    </div>
  );
}

function ObservationsTable() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E4DFCF", backgroundColor: palette.card }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #E4DFCF" }}>
        <div className="text-sm font-semibold" style={{ color: palette.bark }}>Recent Species Observations</div>
        <button
          className="text-xs px-3 py-1.5 rounded-md font-medium"
          style={{ backgroundColor: palette.moss, color: "#0E211B" }}
        >
          Upload Camera Trap Images
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left" style={{ color: palette.slate }}>
            <th className="px-5 py-2 font-medium">Observation ID</th>
            <th className="px-5 py-2 font-medium">Species</th>
            <th className="px-5 py-2 font-medium">Monitoring Site</th>
            <th className="px-5 py-2 font-medium">Confidence</th>
            <th className="px-5 py-2 font-medium">Conservation Status</th>
          </tr>
        </thead>
        <tbody>
          {observations.map((o, i) => (
            <tr key={o.id} style={{ borderTop: "1px solid #EFEBDE" }}>
              <td className="px-5 py-3" style={{ color: palette.slate }}>{o.id}</td>
              <td className="px-5 py-3">
                <div style={{ color: palette.bark, fontWeight: 500 }}>{o.common}</div>
                <div className="text-xs italic" style={{ color: palette.slate }}>{o.species}</div>
              </td>
              <td className="px-5 py-3" style={{ color: palette.slate }}>{o.site}</td>
              <td className="px-5 py-3" style={{ color: palette.bark }}>{o.conf}%</td>
              <td className="px-5 py-3">
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: `${statusColor[o.status]}22`,
                    color: statusColor[o.status],
                  }}
                >
                  {o.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SidePanels() {
  return (
    <div className="flex flex-col gap-4 w-72 flex-shrink-0">
      <div className="rounded-xl p-5" style={{ backgroundColor: palette.card, border: "1px solid #E4DFCF" }}>
        <div className="text-sm font-semibold mb-3" style={{ color: palette.bark }}>Species Groups Detected</div>
        {[
          { icon: PawPrint, label: "Mammals", value: 64 },
          { icon: Bird, label: "Birds", value: 21 },
          { icon: Fish, label: "Marine / Aquatic", value: 9 },
        ].map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.label} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: palette.bark }}>
                <Icon size={15} color={palette.moss} /> {g.label}
              </div>
              <span className="text-sm font-medium" style={{ color: palette.slate }}>{g.value}%</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: palette.pineLight, color: "#EDEFE9" }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} color={palette.amber} />
          <div className="text-sm font-semibold">Endangered Species Alert</div>
        </div>
        <p className="text-xs opacity-80 leading-relaxed">
          Bengal Tiger sighting confirmed at Zone 4 - Riverbend, 2 hours ago.
          Confidence 96%. Notify conservation officer for patrol scheduling.
        </p>
      </div>
    </div>
  );
}

export default function WildlifeDashboard() {
  const [activeRole, setActiveRole] = useState("researcher");
  const [activeNav, setActiveNav] = useState(navByRole["researcher"][0]);

  return (
    <div className="flex h-full min-h-screen w-full" style={{ backgroundColor: palette.sand, fontFamily: "system-ui, sans-serif" }}>
      <Sidebar
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />
      <div className="flex-1 flex flex-col">
        <Topbar activeNav={activeNav} />
        <div className="p-8 flex flex-col gap-6">
          <div className="flex gap-4">
            {statsByRole[activeRole].map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <ObservationsTable />
            </div>
            <SidePanels />
          </div>
        </div>
      </div>
    </div>
  );
}