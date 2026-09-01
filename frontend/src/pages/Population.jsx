import { useState, useEffect } from "react";
import { Users, TrendingUp, PawPrint, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import { fetchPopulationOverview, getCachedPopulationOverview } from "../api/intelligence";
import { monitoringSitesApi } from "../api/monitoring";
import { useAuth } from "../context/AuthContext";
import GISMap from "../components/ui/GISMap";


export default function Population() {
  const { token } = useAuth();
  const [species, setSpecies] = useState("All Species");
  const [period, setPeriod] = useState("Last 12 Months");
  const [location, setLocation] = useState("All Locations");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(() => getCachedPopulationOverview());
  const [sitesList, setSitesList] = useState([]);

  // Fetch monitoring sites once
  useEffect(() => {
    monitoringSitesApi.list(token)
      .then((sites) => setSitesList(sites || []))
      .catch(() => setSitesList([]));
  }, [token]);

  // Fetch population data when filters change
  const loadPopulationData = async () => {
    try {
      const selectedSite = sitesList.find((s) => s.site_name === location);
      const siteId = selectedSite ? selectedSite.id : null;
      const months = period === "Last 3 Months" ? 3 : period === "Last 6 Months" ? 6 : 12;

      const res = await fetchPopulationOverview(species, siteId, months);
      setData(res);
    } catch (err) {
      console.error("Error loading population intelligence:", err);
      if (!data) {
        setError("Failed to load live population data.");
      }
    }
  };

  useEffect(() => {
    loadPopulationData();
  }, [species, period, location]);

  const trends = data?.trends?.map((t) => ({
    month: `${t.month} ${t.year % 100}`,
    value: t.estimated_count,
    sightings: t.sightings,
  })) || [];

  const regional = data?.regional_breakdown || [];
  const maxRegion = Math.max(...(regional.length ? regional.map((r) => r.estimated_count) : [1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest-900">Population Intelligence Engine</h1>
          <p className="text-sm text-forest-500">
            Real-time population estimation, Relative Abundance Index (RAI), and spatial density analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPopulationData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3.5 py-2 text-sm font-medium text-forest-700 hover:bg-surface transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-forest-600" : "text-forest-600"} />
            <span>Refresh Model</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="rounded-lg border border-surface-border bg-white px-3.5 py-2 text-sm font-medium text-forest-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          <option value="All Species">All Species</option>
          {data?.species_summaries?.map((sp) => (
            <option key={sp.species_name} value={sp.species_name}>
              {sp.species_name}
            </option>
          ))}
        </select>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-surface-border bg-white px-3.5 py-2 text-sm font-medium text-forest-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          <option>Last 12 Months</option>
          <option>Last 6 Months</option>
          <option>Last 3 Months</option>
        </select>

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-lg border border-surface-border bg-white px-3.5 py-2 text-sm font-medium text-forest-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          <option>All Locations</option>
          {sitesList.map((s) => (
            <option key={s.id} value={s.site_name}>
              {s.site_name}
            </option>
          ))}
          {!sitesList.length && (
            <>
              <option>Jim Corbett NP</option>
              <option>Bandhavgarh NP</option>
              <option>Kaziranga NP</option>
              <option>Ranthambore NP</option>
            </>
          )}
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Estimated Population"
          value={data ? data.total_population_estimate.toLocaleString() : "..."}
          change={data ? data.estimated_growth_pct : 2.4}
        />
        <StatCard
          icon={TrendingUp}
          label="Estimated Growth Rate"
          value={data ? `${data.estimated_growth_pct > 0 ? "+" : ""}${data.estimated_growth_pct}%` : "+2.4%"}
          change={5.3}
        />
        <StatCard
          icon={PawPrint}
          label="Monitored Species"
          value={data ? data.total_species_monitored.toString() : "..."}
        />
        <StatCard
          icon={MapPin}
          label="Surveyed Ecosystem Areas"
          value={data ? data.total_survey_areas.toString() : "..."}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Population Trends & Encounter Seasonality">
          <div className="h-[240px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ee" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#4f8a59" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#4f8a59" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, name) => [val.toLocaleString(), name === "value" ? "Estimated Population" : "Field Sightings"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#245930"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#245930" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Spatial Population & Density by Region">
          <div className="space-y-3.5 pt-1">
            {regional.map((r) => (
              <div key={r.region}>
                <div className="mb-1 flex justify-between text-xs text-forest-600 font-medium">
                  <span>
                    {r.region} <span className="text-[10px] text-forest-400">({r.habitat_type} • {r.density_per_sq_km} / sq km)</span>
                  </span>
                  <span className="font-semibold text-forest-900">{r.estimated_count.toLocaleString()}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-forest-50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-forest-600 transition-all duration-500"
                    style={{ width: `${Math.max(5, (r.estimated_count / maxRegion) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* GIS Spatial Population Map — 100% Dynamic from Database */}
      <GISMap
        markers={sitesList}
        height="380px"
        title="Spatial Population & Protected Area GIS Map"
        subtitle="Live geographical mapping of monitored wildlife sites from database"
      />

      {/* Species Population Estimates Table */}

      {data?.species_summaries && data.species_summaries.length > 0 && (
        <Card title="Species-Level Population & Status Summary">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-forest-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Species</th>
                  <th className="py-2.5">IUCN Red List Status</th>
                  <th className="py-2.5">Survey Sightings</th>
                  <th className="py-2.5">Estimated Population</th>
                  <th className="py-2.5">Density (per sq km)</th>
                  <th className="py-2.5">Population Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {data.species_summaries.map((sp) => (
                  <tr key={sp.species_name} className="hover:bg-forest-50/50 transition-colors">
                    <td className="py-3 font-semibold text-forest-900">{sp.species_name}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          sp.iucn_status === "Endangered"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : sp.iucn_status === "Vulnerable"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-forest-50 text-forest-700 border border-forest-200"
                        }`}
                      >
                        {sp.iucn_status}
                      </span>
                    </td>
                    <td className="py-3 text-forest-700">{sp.total_sightings}</td>
                    <td className="py-3 font-semibold text-forest-900">{sp.estimated_population.toLocaleString()}</td>
                    <td className="py-3 text-forest-700">{sp.density_per_sq_km}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs font-semibold ${
                          sp.trend_status === "Increasing"
                            ? "text-emerald-700"
                            : sp.trend_status === "Declining"
                            ? "text-red-600"
                            : "text-forest-600"
                        }`}
                      >
                        {sp.trend_status} ({sp.growth_rate_pct > 0 ? "+" : ""}{sp.growth_rate_pct}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
