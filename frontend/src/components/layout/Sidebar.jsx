import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  LayoutDashboard,
  ImageUp,
  AudioLines,
  PawPrint,
  LineChart,
  Leaf,
  FileBarChart2,
  Bell,
  User,
  Settings,
  Shield,
  LogOut,
  MapPin,       
  ClipboardList,
  Camera,       
  Eye,   
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "User Approvals", icon: Shield, roles: ["Administrator"] },
  { to: "/monitoring", label: "Monitoring Overview", icon: LayoutDashboard },
  { to: "/monitoring/sites", label: "Monitoring Sites", icon: MapPin },
  { to: "/monitoring/surveys", label: "Surveys", icon: ClipboardList },
  { to: "/monitoring/camera-traps", label: "Camera Traps", icon: Camera },
  { to: "/monitoring/audio-sensors", label: "Audio Sensors", icon: AudioLines },
  { to: "/monitoring/observations", label: "Observation History", icon: Eye },
  { to: "/upload-image", label: "Upload Wildlife Image", icon: ImageUp },
  { to: "/upload-audio", label: "Upload Bird Audio", icon: AudioLines },
  { to: "/species", label: "Species Identification", icon: PawPrint },
  { to: "/population", label: "Population Estimation", icon: LineChart },
  { to: "/biodiversity", label: "Biodiversity Intelligence", icon: Leaf },
  { to: "/reports", label: "Reports", icon: FileBarChart2 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  return (
    <aside className="w-64 shrink-0 bg-wild-900 min-h-screen flex flex-col py-5 px-3">
      <div className="flex items-center gap-2 px-3 pb-6">
        <PawPrint className="text-wild-400" size={22} />
        <span className="text-white font-semibold text-sm leading-tight">
          Wildlife
          <br />
          Intelligence
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {filteredNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="sidebar-link mt-2 text-red-200/80 hover:bg-red-500/10 cursor-pointer"
      >
        <LogOut size={17} />
        <span>Logout</span>
      </button>
    </aside>
  );
}