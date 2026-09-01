import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, UploadCloud, RefreshCw, PawPrint } from "lucide-react";
import Card from "../components/ui/Card";
import { fetchPopulationOverview } from "../api/intelligence";

const STATUS_COLORS = {
  Endangered: "bg-red-50 text-red-600 border border-red-200",
  Vulnerable: "bg-amber-50 text-amber-600 border border-amber-200",
  "Least Concern": "bg-forest-50 text-forest-600 border border-forest-200",
};

export default function Species() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [speciesList, setSpeciesList] = useState([]);

  const loadSpeciesData = async () => {
    setLoading(true);
    try {
      const data = await fetchPopulationOverview();
      setSpeciesList(data.species_summaries || []);
    } catch (err) {
      console.error("Error fetching species identification data:", err);
      setSpeciesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpeciesData();
  }, []);

  const filtered = speciesList.filter(
    (s) =>
      s.species_name.toLowerCase().includes(query.toLowerCase()) ||
      (s.iucn_status && s.iucn_status.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest-900">Species Identification</h1>
          <p className="text-sm text-forest-400">Live breakdown of all identified wildlife species across your monitoring sites</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSpeciesData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3.5 py-2 text-sm font-medium text-forest-700 hover:bg-surface transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-forest-600" : "text-forest-600"} />
            <span>Refresh Species Data</span>
          </button>
          <Link
            to="/upload-image"
            className="inline-flex items-center gap-2 px-4 py-2 bg-wild-600 hover:bg-wild-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <UploadCloud size={16} />
            <span>Upload Image to Classify (YOLOv9)</span>
          </Link>
        </div>
      </div>

      <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-2">
        <Search size={16} className="text-forest-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search species..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-forest-400">Loading live species data...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-forest-400">
              No species records found. Upload an image or add observations to populate species identification data.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-forest-400">
                  <th className="py-2.5 font-medium">Species</th>
                  <th className="py-2.5 font-medium">IUCN Conservation Status</th>
                  <th className="py-2.5 font-medium">Total Sightings (DB)</th>
                  <th className="py-2.5 font-medium">Estimated Population</th>
                  <th className="py-2.5 font-medium">Density (/sq km)</th>
                  <th className="py-2.5 font-medium">Trend Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.species_name} className="border-b border-surface-border last:border-0 hover:bg-forest-50/40 transition-colors">
                    <td className="py-3 font-semibold text-forest-900 flex items-center gap-2">
                      <PawPrint size={16} className="text-forest-600" />
                      <span>{s.species_name}</span>
                    </td>
                    <td className="py-3">
                      <span className={`status-pill ${STATUS_COLORS[s.iucn_status] || "bg-forest-50 text-forest-700"}`}>
                        {s.iucn_status || "Evaluated"}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-forest-700">{s.total_sightings}</td>
                    <td className="py-3 font-semibold text-forest-900">{s.estimated_population.toLocaleString()}</td>
                    <td className="py-3 text-forest-700">{s.density_per_sq_km}</td>
                    <td className="py-3 font-medium text-forest-600">
                      <span className={s.trend_status === "Increasing" ? "text-emerald-700 font-semibold" : s.trend_status === "Declining" ? "text-red-600 font-semibold" : "text-forest-700"}>
                        {s.trend_status} ({s.growth_rate_pct > 0 ? "+" : ""}{s.growth_rate_pct}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
