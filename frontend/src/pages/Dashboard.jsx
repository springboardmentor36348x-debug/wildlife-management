import React, { useEffect, useState } from "react";
import { listMonitoringSites, listSurveys } from "../api/surveys";
import { getSpeciesSummary } from "../api/biodiversity";
import { useAuth } from "../context/AuthContext";

function StatCard({ label, value, hint }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-forest-700 mt-1">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [speciesSummary, setSpeciesSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sitesRes, surveysRes, summaryRes] = await Promise.all([
          listMonitoringSites(),
          listSurveys(),
          getSpeciesSummary(),
        ]);
        setSites(sitesRes.data);
        setSurveys(surveysRes.data);
        setSpeciesSummary(summaryRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.full_name?.split(" ")[0]} 👋</h1>
      <p className="text-gray-500 mb-6">Here's what's happening across your monitored sites.</p>

      {loading ? (
        <p className="text-gray-400">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Monitoring Sites" value={sites.length} />
            <StatCard label="Surveys Logged" value={surveys.length} />
            <StatCard
              label="Distinct Species Identified"
              value={speciesSummary?.total_distinct_species ?? 0}
            />
            <StatCard
              label="Endangered Species Alerts"
              value={speciesSummary?.endangered_species_alerts?.length ?? 0}
              hint="vulnerable / endangered / critically endangered"
            />
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold mb-3">Recent Monitoring Sites</h2>
            {sites.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No monitoring sites yet — head to "Monitoring Sites" to register your first one.
              </p>
            ) : (
              <ul className="divide-y">
                {sites.slice(0, 6).map((s) => (
                  <li key={s.id} className="py-2 flex justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-gray-500 capitalize">{s.habitat_type}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
