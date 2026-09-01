import { FaBell, FaUserCircle } from "react-icons/fa";

function TopNavbar() {
  return (
    <div className="bg-[#111827] border border-white/10 shadow-xl rounded-2xl p-5 flex justify-between items-center mb-8">

      <div>
        <h1 className="text-3xl font-bold text-white">
          Wildlife Dashboard
        </h1>

        <p className="text-slate-400 mt-1">
          Welcome back! Monitor wildlife activity here.
        </p>
      </div>

      <div className="flex items-center gap-5">

        <button
          className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center hover:bg-amber-500/20 transition"
          title="Notifications"
        >
          <FaBell size={21} className="text-amber-400" />
        </button>

        <button
          className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center"
          title="Profile"
        >
          <FaUserCircle size={32} className="text-teal-400" />
        </button>

      </div>

    </div>
  );
}

export default TopNavbar;