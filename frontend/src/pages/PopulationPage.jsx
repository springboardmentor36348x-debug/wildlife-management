import { useEffect, useState } from "react";
import { api } from "../api/client";

function Card({ title, subtitle, action, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display font-semibold text-bark-900">{title}</h2>
          {subtitle && <p className="text-xs text-canopy-600 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }) {
  return <p className="text-sm text-canopy-600 py-2">{children}</p>;
}

export default function PopulationPage() {
  const [surveys, setSurveys] = useState([]);
  const [surveyId, setSurveyId] = useState("");

  const [counts, setCounts] = useState([]);
  const [density, setDensity] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trendSpecies, setTrendSpecies] = useState("");
  const [windowDays, setWindowDays] = useState(30);
  const [trend, setTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const [movementSpecies, setMovementSpecies] = useState("");
  const [movement, setMovement] = useState([]);
  const [movementLoading, setMovementLoading] = useState(false);

  useEffect(() => {
    api.listSurveys().then(setSurveys).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.getPopulationCounts(surveyId || undefined),
      surveyId ? api.getPopulationDensity(surveyId) : Promise.resolve([]),
      api.getPopulationDistribution(surveyId || undefined),
    ])
      .then(([c, d, dist]) => {
        setCounts(c || []);
        setDensity(d || []);
        setDistribution(dist || []);
        if (!trendSpecies && c && c.length) setTrendSpecies(c[0].species);
        if (!movementSpecies && c && c.length) setMovementSpecies(c[0].species);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId]);

  useEffect(() => {
    if (!trendSpecies) return;
    setTrendLoading(true);
    api
      .getPopulationTrend(trendSpecies, { surveyId: surveyId || undefined, windowDays })
      .then(setTrend)
      .catch(() => setTrend([]))
      .finally(() => setTrendLoading(false));
  }, [trendSpecies, windowDays, surveyId]);

  useEffect(() => {
    if (!movementSpecies) return;
    setMovementLoading(true);
    api
      .getPopulationMovement(movementSpecies)
      .then(setMovement)
      .catch(() => setMovement([]))
      .finally(() => setMovementLoading(false));
  }, [movementSpecies]);

  const maxCount = Math.max(1, ...counts.map((c) => c.count));
  const maxTrend = Math.max(1, ...trend.map((t) => t.count));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-bark-900">Population Intelligence</h1>
          <p className="text-canopy-700 text-sm mt-1">
            Population counting, density, trend, and migration-proxy analysis — computed live from real
            species-labeled observations (Milestone 3, Feature B).
          </p>
        </div>
        <select
          className="input max-w-xs"
          value={surveyId}
          onChange={(e) => setSurveyId(e.target.value)}
        >
          <option value="">All surveys</option>
          {surveys.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Population Counting" subtitle="Confirmed observations grouped by species label.">
          {!loading && counts.length === 0 && <Empty>No species-labeled observations yet.</Empty>}
          <ul className="space-y-2">
            {counts.map((c) => (
              <li key={c.species} className="flex items-center gap-3">
                <span className="w-28 text-sm text-bark-900 truncate">{c.species}</span>
                <div className="flex-1 bg-canopy-50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-canopy-600 h-full rounded-full"
                    style={{ width: `${(c.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-semibold text-bark-900">{c.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Population Density"
          subtitle={
            surveyId
              ? "Count-per-site proxy for the selected survey (see notes: not true animals/km²)."
              : "Pick a survey above to view per-site density."
          }
        >
          {surveyId && !loading && density.length === 0 && <Empty>No density data for this survey yet.</Empty>}
          {!surveyId && <Empty>Select a survey to see the density breakdown by monitoring site.</Empty>}
          <ul className="divide-y divide-canopy-100">
            {density.map((d, i) => (
              <li key={i} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <p className="text-bark-900">{d.site_name}</p>
                  <p className="text-xs text-canopy-600">{d.species}</p>
                </div>
                <span className="font-semibold text-bark-900">{d.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Species Distribution Mapping" subtitle="Per-site species breakdown across all monitoring sites.">
          {!loading && distribution.length === 0 && <Empty>No monitoring sites yet.</Empty>}
          <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {distribution.map((d) => (
              <li key={d.site_id}>
                <p className="text-sm font-medium text-bark-900">{d.site_name}</p>
                <p className="text-xs text-canopy-600">
                  {(d.species_counts || []).length === 0
                    ? "No species recorded here yet"
                    : d.species_counts.map((sc) => `${sc.species} (${sc.count})`).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Population Trend Analysis"
          subtitle="Daily observation counts for a chosen species over a time window."
          action={
            <div className="flex items-center gap-2">
              <select className="input w-36" value={trendSpecies} onChange={(e) => setTrendSpecies(e.target.value)}>
                {counts.map((c) => (
                  <option key={c.species} value={c.species}>
                    {c.species}
                  </option>
                ))}
              </select>
              <select
                className="input w-24"
                value={windowDays}
                onChange={(e) => setWindowDays(Number(e.target.value))}
              >
                <option value={7}>7d</option>
                <option value={30}>30d</option>
                <option value={90}>90d</option>
              </select>
            </div>
          }
        >
          {!trendLoading && trend.length === 0 && (
            <Empty>Not enough time-spread observation data yet to show a real trend.</Empty>
          )}
          {trend.length > 0 && (
            <div className="flex items-end gap-1.5 h-32">
              {trend.map((t) => (
                <div key={t.date} className="flex-1 flex flex-col items-center justify-end h-full" title={`${t.date}: ${t.count}`}>
                  <div
                    className="w-full bg-ochre-400 rounded-t"
                    style={{ height: `${(t.count / maxTrend) * 100}%`, minHeight: 4 }}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Migration / Movement Proxy"
          subtitle="Chronological site-visit order for a species — not individual-animal tracking (see docs)."
          action={
            <select className="input w-40" value={movementSpecies} onChange={(e) => setMovementSpecies(e.target.value)}>
              {counts.map((c) => (
                <option key={c.species} value={c.species}>
                  {c.species}
                </option>
              ))}
            </select>
          }
        >
          {!movementLoading && movement.length === 0 && <Empty>No movement-proxy data for this species yet.</Empty>}
          <ul className="divide-y divide-canopy-100">
            {movement.map((m, i) => (
              <li key={i} className="py-2 text-sm">
                <p className="text-bark-900">{m.site_name}</p>
                <p className="text-xs text-canopy-600">
                  First observed {m.first_observed_at} · {m.observation_count} observation(s)
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
