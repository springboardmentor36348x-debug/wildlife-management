import { Search, Bell, Grid2x2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Navbar() {
  const { user } = useAuth();

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2 bg-wild-50 rounded-lg px-3 py-2 w-80">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search anything..."
          className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-wild-50 text-slate-500">
          <Bell size={18} />
        </button>
        <button className="p-2 rounded-lg hover:bg-wild-50 text-slate-500">
          <Grid2x2 size={18} />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
          {/* Avatar with initials fallback */}
          <div className="w-9 h-9 rounded-full bg-wild-800 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {getInitials(user?.full_name)}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-slate-800">
              {user?.full_name || "User"}
            </p>
            <p className="text-xs text-slate-400">
              {user?.role || "Member"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}