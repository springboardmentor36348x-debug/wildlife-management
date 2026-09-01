import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Image, AudioLines, PawPrint, FileBarChart2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  fetchPopulationOverview,
  fetchBiodiversityAnalytics,
  getCachedPopulationOverview,
  getCachedBiodiversityAnalytics
} from "../api/intelligence";
import { monitoringSitesApi } from "../api/monitoring";
import GISMap from "../components/ui/GISMap";


const DEFAULT_SPECIES_DISTRIBUTION = [
  { name: "Mammals", value: 100, color: "#2f9159" },
  { name: "Birds", value: 0, color: "#4bb377" },
  { name: "Amphibians", value: 0, color: "#a3d9b8" },
  { name: "Others", value: 0, color: "#d7ecdf" },
];

const DEFAULT_TRENDS = [
  { month: "Aug", value: 22 },
];

export default function Dashboard() {
  const { token } = useAuth();
  const [popData, setPopData] = useState(() => getCachedPopulationOverview());
  const [bioData, setBioData] = useState(() => getCachedBiodiversityAnalytics());
  const [sites, setSites] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardMetrics() {
      try {
        const [pop, bio, sitesList] = await Promise.all([
          fetchPopulationOverview().catch(() => null),
          fetchBiodiversityAnalytics().catch(() => null),
          monitoringSitesApi.list(token).catch(() => []),
        ]);
        if (isMounted) {
          if (pop) setPopData(pop);
          if (bio) setBioData(bio);
          if (sitesList && sitesList.length) setSites(sitesList);
        }
      } catch (err) {
        console.error("Error loading dashboard live metrics:", err);
      }
    }
    loadDashboardMetrics();
    return () => { isMounted = false; };
  }, [token]);


  // 100% Dynamic — only live database sites shown on GIS Map
  const mapMarkers = sites;


  const stats = [
    {
      label: "Estimated Wildlife Population",
      value: popData ? popData.total_population_estimate.toLocaleString() : "...",
      change: `${popData?.estimated_growth_pct > 0 ? "+" : ""}${popData?.estimated_growth_pct || 0}% from last period`,
      icon: Image,
    },
    {
      label: "Shannon Diversity Index (H')",
      value: bioData ? bioData.shannon_diversity_index.toFixed(2) : "...",
      change: `Grade: ${bioData?.ecosystem_health_grade || "Good"}`,
      icon: AudioLines,
    },
    {
      label: "Total Monitored Species",
      value: bioData ? bioData.total_species.toString() : "...",
      change: `${bioData?.threatened_species_count || 0} endangered/vulnerable`,
      icon: PawPrint,
    },
    {
      label: "Active Protected Areas",
      value: popData ? popData.total_survey_areas.toString() : "...",
      change: "Ecosystems monitored",
      icon: FileBarChart2,
    },
  ];

  const speciesData = bioData?.species_distribution || DEFAULT_SPECIES_DISTRIBUTION;

  const trendData = popData?.trends?.length
    ? popData.trends.map((t) => ({ month: t.month, value: t.estimated_count }))
    : DEFAULT_TRENDS;

  const recentUploads = bioData?.recent_occurrences?.length
    ? bioData.recent_occurrences.slice(0, 5).map((o) => ({
        file: `${o.detection_source === "audio_sensor" ? "audio_rec_" : "cam_trap_"}${o.id}.dat`,
        type: o.detection_source === "audio_sensor" ? "Audio" : "Image",
        species: o.species,
        location: o.location,
        date: o.date,
        status: o.status,
      }))
    : [
        { file: "IMG_2024_001.jpg", type: "Image", species: "Asian Elephant", location: "Jim Corbett NP", date: "May 20, 2024", status: "Completed" },
        { file: "bird_audio_001.mp3", type: "Audio", species: "Indian Robin", location: "Kaziranga NP", date: "May 20, 2024", status: "Completed" },
        { file: "IMG_2024_002.jpg", type: "Image", species: "Bengal Tiger", location: "Bandhavgarh NP", date: "May 19, 2024", status: "Completed" },
        { file: "bird_audio_002.mp3", type: "Audio", species: "Peacock", location: "Ranthambore NP", date: "May 18, 2024", status: "Completed" },
        { file: "IMG_2024_003.jpg", type: "Image", species: "Leopard", location: "Pench NP", date: "May 18, 2024", status: "Completed" },
      ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Wildlife Intelligence Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time population intelligence, ecosystem analytics, and species telemetry.</p>
        </div>
        <Link
          to="/upload-image"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-wild-600 hover:bg-wild-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all self-start md:self-auto"
        >
          <Image size={16} />
          <span>Upload &amp; Analyze Image (YOLOv9)</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, icon: Icon }) => (
          <div key={label} className="card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <div className="w-9 h-9 rounded-lg bg-wild-100 flex items-center justify-center text-wild-600">
                <Icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-slate-800">{value}</p>
            <span className="stat-badge bg-wild-100 text-wild-700 w-fit">{change}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-medium text-slate-800 mb-4">Species Group Distribution</h2>
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={speciesData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {speciesData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 text-sm">
              {speciesData.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-600">{s.name}</span>
                  <span className="text-slate-400">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-medium text-slate-800 mb-4">Population Trends & Encounter Index</h2>
          <p className="text-xs text-slate-400 -mt-3 mb-2">Last 12 Months</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ee" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2f9159" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GIS Field Telemetry Map Card */}
      <GISMap
        markers={mapMarkers}
        height="360px"
        title="Spatial Field Telemetry & GIS Monitoring Map"
        subtitle="Live map view of registered camera traps, audio sensors, and monitoring sites"
      />

      <div className="card">

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-slate-800">Recent Wildlife Observations & Detections</h2>
          <Link to="/monitoring/observations" className="text-sm text-wild-600 font-medium hover:underline">
            View All Observations
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-2 font-medium">Record ID</th>
                <th className="py-2 font-medium">Telemetry Type</th>
                <th className="py-2 font-medium">Species</th>
                <th className="py-2 font-medium">Location</th>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentUploads.map((row, index) => (
                <tr key={`${row.file}-${index}`} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 text-slate-700">{row.file}</td>
                  <td className="py-3 text-slate-500">{row.type}</td>
                  <td className="py-3 text-slate-700 font-medium">{row.species}</td>
                  <td className="py-3 text-slate-500">{row.location}</td>
                  <td className="py-3 text-slate-500">{row.date}</td>
                  <td className="py-3">
                    <span className="stat-badge bg-wild-100 text-wild-700">{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}