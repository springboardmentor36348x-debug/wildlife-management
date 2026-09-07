import React, { useEffect, useState } from "react";
import { getSpeciesSummary } from "../api/biodiversity";

const STATUS_COLORS = {
  least_concern: "bg-green-100 text-green-700",
  near_threatened: "bg-yellow-100 text-yellow-700",
  vulnerable: "bg-orange-100 text-orange-700",
  endangered: "bg-red-100 text-red-700",
  critically_endangered: "bg-red-200 text-red-800",
  unknown: "bg-gray-100 text-gray-600",
};

export default function SpeciesObservations() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpeciesSummary()
      .then((res) => setSummary(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Species Identification Engine</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Aggregated species detections from the Image Analysis Engine and Bioacoustic
        Recognition Engine.
      </p>

      {loading ? (
        <p className="text-gray-400">Loading species data...</p>
      ) : !summary || summary.species.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
          No species observations yet. Upload an image or audio recording to get started.
        </div>
      ) : (
        <>
          {summary.endangered_species_alerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="font-semibold text-red-700 mb-1">⚠ Endangered Species Alerts</p>
              <p className="text-sm text-red-600">
                {summary.endangered_species_alerts.map((s) => s.species_common_name).join(", ")}
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold mb-3">
              All Detected Species ({summary.total_distinct_species})
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Species</th>
                  <th>Group</th>
                  <th>Conservation Status</th>
                  <th>Detections</th>
                  <th>Total Individuals</th>
                  <th>Avg. Confidence</th>
                </tr>
              </thead>
              <tbody>
                {summary.species.map((s) => (
                  <tr key={s.species_common_name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.species_common_name}</td>
                    <td className="capitalize">{s.species_group}</td>
                    <td>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          STATUS_COLORS[s.conservation_status] || STATUS_COLORS.unknown
                        }`}
                      >
                        {s.conservation_status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>{s.detection_count}</td>
                    <td>{s.total_individuals}</td>
                    <td>{(s.avg_confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
