import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  HomeIcon, ClipboardIcon, PinIcon, CameraIcon, MicIcon, ButterflyIcon,
  DnaIcon, ImageIcon, HeadphonesIcon, ChartBarIcon, TrendUpIcon, SearchIcon,
  UserIcon, PopulationIcon, TreeIcon, GlobeIcon, ShieldIcon, CalculatorIcon,
  BrainIcon, BellIcon, FileTextIcon, UsersIcon,
} from "./Icons";

const ITEM_DEFS = {
  "/dashboard": { label: "Overview", icon: HomeIcon, group: "Overview" },
  "/admin-panel": { label: "User Management", icon: UsersIcon, group: "Admin" },
  "/surveys": { label: "Surveys", icon: ClipboardIcon, group: "Field Data" },
  "/monitoring-sites": { label: "Monitoring Sites", icon: PinIcon, group: "Field Data" },
  "/camera-traps": { label: "Camera Traps", icon: CameraIcon, group: "Field Data" },
  "/audio-sensors": { label: "Audio Sensors", icon: MicIcon, group: "Field Data" },
  "/observations": { label: "Observations", icon: ButterflyIcon, group: "Field Data" },
  "/species-catalog": { label: "Species Catalog", icon: DnaIcon, group: "Field Data" },
  "/image-analysis": { label: "Image Analysis", icon: ImageIcon, group: "Field Data" },
  "/bioacoustic-analysis": { label: "Bioacoustic Analysis", icon: HeadphonesIcon, group: "Field Data" },
  "/analytics": { label: "Biodiversity Analytics", icon: ChartBarIcon, group: "Analysis" },
  "/species-trend": { label: "Species Trend", icon: TrendUpIcon, group: "Analysis" },
  "/species-detections": { label: "Species Detections", icon: SearchIcon, group: "Analysis" },
  "/user-activity": { label: "Detections by User", icon: UserIcon, group: "Analysis" },
  "/population-estimation": { label: "Population Estimation", icon: PopulationIcon, group: "Analysis" },
  "/animal-counting": { label: "Animal Counting", icon: CalculatorIcon, group: "Analysis" },
  "/habitat-intelligence": { label: "Habitat Intelligence", icon: TreeIcon, group: "Intelligence" },
  "/ecosystem-health": { label: "Ecosystem Health", icon: GlobeIcon, group: "Intelligence" },
  "/conservation-recommendations": { label: "Conservation Recommendations", icon: ShieldIcon, group: "Intelligence" },
  "/wildlife-intelligence": { label: "Wildlife Intelligence", icon: BrainIcon, group: "Intelligence" },
  "/alerts": { label: "Alerts", icon: BellIcon, group: "Alerts & Reports" },
  "/reports": { label: "Reports", icon: FileTextIcon, group: "Alerts & Reports" },
};

const NAV_BY_ROLE = {
  wildlife_researcher: [
    "/dashboard", "/surveys", "/monitoring-sites", "/camera-traps", "/audio-sensors",
    "/observations", "/species-catalog", "/image-analysis", "/bioacoustic-analysis",
    "/analytics", "/species-trend", "/species-detections", "/population-estimation",
    "/habitat-intelligence", "/ecosystem-health", "/conservation-recommendations",
    "/animal-counting", "/wildlife-intelligence", "/alerts", "/reports",
  ],
  conservation_officer: [
    "/dashboard", "/analytics", "/species-trend", "/species-detections", "/user-activity",
    "/population-estimation", "/habitat-intelligence", "/ecosystem-health",
    "/conservation-recommendations", "/wildlife-intelligence", "/alerts", "/reports",
  ],
  forest_officer: [
    "/dashboard", "/monitoring-sites", "/camera-traps", "/audio-sensors", "/image-analysis",
    "/bioacoustic-analysis", "/analytics", "/species-trend", "/species-detections",
    "/user-activity", "/population-estimation", "/habitat-intelligence", "/ecosystem-health",
    "/conservation-recommendations", "/animal-counting", "/wildlife-intelligence",
    "/alerts", "/reports",
  ],
  administrator: [
    "/dashboard", "/admin-panel", "/surveys", "/monitoring-sites", "/camera-traps",
    "/audio-sensors", "/observations", "/species-catalog", "/image-analysis",
    "/bioacoustic-analysis", "/analytics", "/species-trend", "/species-detections",
    "/user-activity", "/population-estimation", "/habitat-intelligence", "/ecosystem-health",
    "/conservation-recommendations", "/animal-counting", "/wildlife-intelligence",
    "/alerts", "/reports",
  ],
};

const GROUP_ORDER = ["Overview", "Admin", "Field Data", "Analysis", "Intelligence", "Alerts & Reports"];

function buildGroups(paths) {
  const groups = {};
  paths.forEach((path) => {
    const def = ITEM_DEFS[path];
    if (!def) return;
    if (!groups[def.group]) groups[def.group] = [];
    groups[def.group].push({ to: path, ...def });
  });
  return GROUP_ORDER.filter((g) => groups[g]).map((g) => ({ name: g, items: groups[g] }));
}

function Sidebar() {
  const { user } = useContext(AuthContext);
  const paths = NAV_BY_ROLE[user?.role] || [];
  const groups = buildGroups(paths);

  return (
    <aside className="dl-sidebar">
      <div className="dl-brand">
        <span className="dl-brand-dot"><HomeIcon size={16} /></span>
        Wildlife PIS
      </div>

      <nav className="dl-nav">
        {groups.map((group) => (
          <div className="dl-nav-group" key={group.name}>
            {group.name !== "Overview" && (
              <div className="dl-nav-group-label">{group.name}</div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => "dl-nav-item" + (isActive ? " active" : "")}
                >
                  <span className="dl-nav-icon"><Icon size={16} /></span>
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;