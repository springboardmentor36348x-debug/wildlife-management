import { useEffect, useState } from "react";
import { LayoutDashboard, MapPin, Camera, AudioLines, PawPrint } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import { getMonitoringStats } from "../../api/monitoring.js";

export default function MonitoringOverview() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMonitoringStats(token)
      .then(setStats)
      .catch((err) => setError(err.message));
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-forest-900 flex items-center gap-2">
          <LayoutDashboard className="text-forest-600" size={24} />
          Monitoring Overview
        </h1>
        <p className="text-sm text-forest-400">Live survey and monitoring statistics</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={PawPrint} label="Total Surveys" value={stats?.total_surveys ?? "—"} />
        <StatCard icon={MapPin} label="Monitoring Sites" value={stats?.total_monitoring_sites ?? "—"} />
        <StatCard icon={Camera} label="Active Camera Traps" value={stats?.active_camera_traps ?? "—"} />
        <StatCard icon={AudioLines} label="Active Audio Sensors" value={stats?.active_audio_sensors ?? "—"} />
        <StatCard icon={PawPrint} label="Total Observations" value={stats?.total_observations ?? "—"} />
      </div>
    </div>
  );
}
