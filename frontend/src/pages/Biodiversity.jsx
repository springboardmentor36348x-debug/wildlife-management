import { useState, useEffect } from "react";
import { PawPrint, Leaf, TrendingDown, ShieldAlert, Sparkles, Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import {
  fetchBiodiversityAnalytics,
  fetchHabitatIntelligence,
  fetchConservationRecommendations,
  getCachedBiodiversityAnalytics
} from "../api/intelligence";

export default function Biodiversity() {
  const [loading, setLoading] = useState(false);
  const [bioData, setBioData] = useState(() => getCachedBiodiversityAnalytics());
  const [habitatData, setHabitatData] = useState(null);
  const [conservationData, setConservationData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [bio, hab, cons] = await Promise.all([
          fetchBiodiversityAnalytics(),
          fetchHabitatIntelligence(),
          fetchConservationRecommendations(),
        ]);
        if (isMounted) {
          setBioData(bio);
          setHabitatData(hab);
          setConservationData(cons);
        }
      } catch (err) {
        console.error("Error loading biodiversity intelligence:", err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const habitatChartData = habitatData?.habitat_breakdown?.map((h) => ({
    habitat: h.habitat,
    value: h.total_observations,
    percentage: h.percentage,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest-900">Biodiversity & Ecosystem Intelligence</h1>
          <p className="text-sm text-forest-500">
            Ecosystem health grading, Shannon-Wiener diversity metrics, habitat analysis & conservation actions
          </p>
        </div>

        {bioData && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-surface-border shadow-sm">
            <Activity className="text-forest-600" size={18} />
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-forest-400 font-semibold block">Ecosystem Health</span>
              <span className="text-sm font-bold text-forest-900">
                {bioData.ecosystem_health_score}/100 — <span className="text-emerald-700">{bioData.ecosystem_health_grade}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={PawPrint}
          label="Species Richness (S)"
          value={bioData ? bioData.species_richness.toString() : "..."}
          change={4.2}
        />
        <StatCard
          icon={Sparkles}
          label="Shannon Diversity Index (H')"
          value={bioData ? bioData.shannon_diversity_index.toFixed(2) : "..."}
        />
        <StatCard
          icon={TrendingDown}
          label="Threatened Species Under Watch"
          value={bioData ? bioData.threatened_species_count.toString() : "..."}
        />
        <StatCard
          icon={ShieldAlert}
          label="Protected Monitoring Areas"
          value={bioData ? bioData.protected_areas_count.toString() : "..."}
        />
      </div>

      {/* Grid: Occurrences & Habitat Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Recent Wildlife Occurrences"
          action={<span className="text-xs font-semibold text-forest-600 bg-forest-50 px-2.5 py-1 rounded-full">Live Telemetry</span>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-forest-400 font-medium uppercase">
                  <th className="py-2.5">Species</th>
                  <th className="py-2.5">Location</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Source / Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {bioData?.recent_occurrences?.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-forest-50/40 transition-colors">
                    <td className="py-2.5">
                      <p className="font-semibold text-forest-900">{r.species}</p>
                      {r.latin_name && <p className="text-[11px] italic text-forest-400">{r.latin_name}</p>}
                    </td>
                    <td className="py-2.5 text-forest-600">{r.location}</td>
                    <td className="py-2.5 text-forest-400 text-xs">{r.date}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2 py-0.5 text-xs font-medium text-forest-700">
                        {r.detection_source.replace("_", " ")} {r.confidence_score ? `(${Math.round(r.confidence_score * 100)}%)` : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Habitat Quality & Observation Distribution">
          <div className="h-[240px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitatChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ee" />
                <XAxis dataKey="habitat" tick={{ fontSize: 11, fill: "#4f8a59" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#4f8a59" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val) => [val.toLocaleString(), "Total Observations"]} />
                <Bar dataKey="value" fill="#2f9159" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Conservation Action Recommendation Engine Section */}
      <Card
        title="Automated Conservation Priority Recommendations"
        action={
          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            {conservationData?.urgent_actions_count || 0} Priority Actions Recommended
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {conservationData?.recommendations?.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-xl border transition-all ${
                rec.priority === "Urgent"
                  ? "border-red-200 bg-red-50/40"
                  : rec.priority === "High"
                  ? "border-amber-200 bg-amber-50/30"
                  : "border-surface-border bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {rec.priority === "Urgent" ? (
                    <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
                  ) : rec.status === "Completed" ? (
                    <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />
                  ) : (
                    <Clock className="text-amber-600 flex-shrink-0" size={18} />
                  )}
                  <h3 className="font-semibold text-sm text-forest-900">{rec.title}</h3>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    rec.priority === "Urgent"
                      ? "bg-red-100 text-red-800"
                      : rec.priority === "High"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-forest-100 text-forest-800"
                  }`}
                >
                  {rec.priority}
                </span>
              </div>

              <p className="text-xs text-forest-600 mb-3">{rec.description}</p>

              <div className="space-y-1.5 border-t border-surface-border/60 pt-2.5">
                <span className="text-[11px] font-semibold text-forest-700 block">Recommended Field Interventions:</span>
                {rec.suggested_actions.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-forest-600">
                    <span className="text-forest-400 font-bold">•</span>
                    <span>{act}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-forest-400 border-t border-surface-border/60 pt-2">
                <span>Target: {rec.site_target}</span>
                <span className="font-medium text-forest-600">Status: {rec.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
