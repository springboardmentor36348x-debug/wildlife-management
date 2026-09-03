import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, HelpCircle, FileText, Settings, Play, RefreshCw, Calculator, Layers, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

const ESTIMATION_METHODS = [
  { value: 'scr', label: 'Spatial Capture-Recapture (SCR)', desc: 'Identifies individual markings & spatial movement grids.' },
  { value: 'distance', label: 'Distance Sampling Line Transects', desc: 'Models detection probability as perpendicular distance.' },
  { value: 'mark_recapture', label: 'Lincoln-Petersen Mark-Recapture', desc: 'Standard dual-session tag and recovery ratio estimator.' },
  { value: 'n_mixture', label: 'Royle-Nichols N-Mixture Model', desc: 'Corrects for imperfect detection across repeated counts.' }
];

export default function PopulationIntelligence() {
  const [siteId, setSiteId] = useState('');
  const [sites, setSites] = useState([]);
  const [popData, setPopData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Interactive Input Simulator State
  const [speciesName, setSpeciesName] = useState('Bengal Tiger');
  const [initialPop, setInitialPop] = useState(38);
  const [growthRate, setGrowthRate] = useState(6.5); // % per year
  const [carryingCapacity, setCarryingCapacity] = useState(75);
  const [horizonYears, setHorizonYears] = useState(5);
  const [method, setMethod] = useState('scr');
  const [adultPct, setAdultPct] = useState(55);
  const [subadultPct, setSubadultPct] = useState(25);
  const [juvenilePct, setJuvenilePct] = useState(20);

  // Computed Simulation Results
  const [simResults, setSimResults] = useState(null);

  useEffect(() => {
    async function loadSites() {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/v1/monitoring-sites', { headers });
        if (res.ok) {
          const data = await res.json();
          setSites(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSites();
  }, []);

  const loadPopulationData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = siteId ? `/api/v1/population/overview?site_id=${siteId}` : '/api/v1/population/overview';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPopData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPopulationData();
  }, [siteId]);

  // Run demographic projection simulation whenever inputs change
  const runSimulation = () => {
    const r = growthRate / 100;
    const K = Math.max(carryingCapacity, 1);
    const N0 = Math.max(initialPop, 1);
    const years = parseInt(horizonYears);

    const labels = ['Year 0 (Now)'];
    const trajectory = [N0];
    const capacityLine = [K];

    for (let t = 1; t <= years; t++) {
      labels.push(`Year +${t}`);
      // Logistic Growth Formula: N(t) = K / (1 + ((K - N0) / N0) * e^(-r*t))
      const expVal = Math.exp(-r * t);
      const Nt = Math.round(K / (1 + ((K - N0) / N0) * expVal));
      trajectory.push(Nt);
      capacityLine.push(K);
    }

    const finalPop = trajectory[trajectory.length - 1];
    const netGrowth = finalPop - N0;
    const saturationPct = Math.min(100, Math.round((finalPop / K) * 100));

    // Life stages counts
    const adultCount = Math.round((finalPop * adultPct) / 100);
    const subadultCount = Math.round((finalPop * subadultPct) / 100);
    const juvenileCount = Math.max(0, finalPop - adultCount - subadultCount);

    // Stage Tier Classification
    let stageTier = 'Stage 1: Thriving & Expanding';
    let stageColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let advice = 'Population demonstrates resilient intrinsic growth. Maintain perimeter camera trap arrays.';

    if (growthRate < 0) {
      stageTier = 'Stage 4: Critical Depletion Alert';
      stageColor = 'text-red-700 bg-red-50 border-red-200';
      advice = 'Urgent anti-poaching intervention and prey base restoration required.';
    } else if (saturationPct >= 90) {
      stageTier = 'Stage 2: Carrying Capacity Equilibrium';
      stageColor = 'text-blue-700 bg-blue-50 border-blue-200';
      advice = 'Reserve approaching ecological carrying capacity. Monitor territorial dispersal & corridor connectivity.';
    } else if (growthRate < 3) {
      stageTier = 'Stage 3: Vulnerable Slow Recovery';
      stageColor = 'text-amber-700 bg-amber-50 border-amber-200';
      advice = 'Low recruitment velocity. Assess cub survival rates and waterhole access.';
    }

    setSimResults({
      labels,
      trajectory,
      capacityLine,
      finalPop,
      netGrowth,
      saturationPct,
      adultCount,
      subadultCount,
      juvenileCount,
      stageTier,
      stageColor,
      advice
    });
  };

  useEffect(() => {
    runSimulation();
  }, [speciesName, initialPop, growthRate, carryingCapacity, horizonYears, adultPct, subadultPct, juvenilePct, method]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-col md:flex-row gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Population Intelligence Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">
            Demographic modeling, life stage distribution, carrying capacity forecaster & estimation methods.
          </p>
        </div>

        <div>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
          >
            <option value="">All Monitoring Reserves</option>
            {sites.map((st) => (
              <option key={st.id} value={st.id}>{st.site_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Reserve Area</p>
          <p className="text-xl font-black text-slate-800 mt-1">
            {siteId ? `${sites.find(s => s.id === parseInt(siteId))?.area_km2} km²` : '5,848 km²'}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Surveyed Habitat Area</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estimated Total Individuals</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{popData?.total_individuals_estimated || 142} animals</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Across Cataloged Species</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mean Density Index</p>
          <p className="text-xl font-black text-slate-800 mt-1">{popData?.overall_density || '0.24'} ind/km²</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Spatial Abundance Metric</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Demographic Stage</p>
          <p className="text-sm font-extrabold text-blue-700 mt-1.5">Stage 1: Stable Growth</p>
          <span className="text-[10px] text-blue-500 font-semibold mt-1 block">Positive Multi-Year Trend</span>
        </div>
      </div>

      {/* ─── INTERACTIVE SIMULATION & FORECASTER (USER INPUT -> LIVE OUTPUT) ─── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">
                Live Population Forecaster & Demographic Simulator
              </h3>
              <p className="text-xs text-slate-300">
                Supply your custom input parameters below to dynamically compute population trajectories, carrying capacity saturation, and life stage cohorts.
              </p>
            </div>
          </div>
          <button
            onClick={runSimulation}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-xl transition-colors shadow-md"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-calculate Forecast
          </button>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Species */}
          <div className="space-y-1.5 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Target Species</label>
            <input
              type="text"
              value={speciesName}
              onChange={(e) => setSpeciesName(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-semibold"
            />
          </div>

          {/* Baseline Population */}
          <div className="space-y-1.5 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Baseline Count (N₀)</label>
            <input
              type="number"
              min="1"
              max="5000"
              value={initialPop}
              onChange={(e) => setInitialPop(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-semibold"
            />
          </div>

          {/* Growth Rate */}
          <div className="space-y-1.5 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-emerald-400 uppercase tracking-wider">Annual Growth Rate (r)</span>
              <span className="font-bold text-white">{growthRate}%</span>
            </div>
            <input
              type="range"
              min="-15"
              max="25"
              step="0.5"
              value={growthRate}
              onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 mt-2"
            />
          </div>

          {/* Carrying Capacity */}
          <div className="space-y-1.5 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Carrying Capacity (K)</label>
            <input
              type="number"
              min="5"
              max="10000"
              value={carryingCapacity}
              onChange={(e) => setCarryingCapacity(parseFloat(e.target.value) || 10)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-semibold"
            />
          </div>
        </div>

        {/* Secondary Inputs: Stages & Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Method Selector */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
            <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Estimation Methodology</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
            >
              {ESTIMATION_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 italic">
              {ESTIMATION_METHODS.find(m => m.value === method)?.desc}
            </p>
          </div>

          {/* Life Stages Ratios */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 lg:col-span-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Life Stage Cohort Allocation</label>
              <span className="text-[10px] text-slate-300">Adults {adultPct}% · Subadults {subadultPct}% · Cubs {juvenilePct}%</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400">Adult (Breeding) %</span>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={adultPct}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 0;
                    setAdultPct(v);
                    setJuvenilePct(Math.max(0, 100 - v - subadultPct));
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Subadult %</span>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={subadultPct}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 0;
                    setSubadultPct(v);
                    setJuvenilePct(Math.max(0, 100 - adultPct - v));
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Juvenile / Cub %</span>
                <input
                  type="number"
                  disabled
                  value={juvenilePct}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 mt-1 opacity-80"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── DYNAMIC OUTPUT RESULTS ─── */}
        {simResults && (
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Computed Output Results</span>
              <span className="text-xs text-slate-400">({horizonYears}-Year Demographic Projection)</span>
            </div>

            {/* Output Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-white/10 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Projected Population</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{simResults.finalPop} animals</p>
                <p className="text-[10px] text-emerald-300 mt-0.5 font-semibold">
                  {simResults.netGrowth >= 0 ? `+${simResults.netGrowth}` : simResults.netGrowth} net change
                </p>
              </div>

              <div className="bg-slate-900/90 border border-white/10 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Carrying Saturation</p>
                <p className="text-2xl font-black text-cyan-400 mt-1">{simResults.saturationPct}%</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Threshold: {carryingCapacity} max</p>
              </div>

              <div className="bg-slate-900/90 border border-white/10 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Breeding Stock (Adults)</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{simResults.adultCount} adults</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{simResults.subadultCount} subadults · {simResults.juvenileCount} cubs</p>
              </div>

              <div className="bg-slate-900/90 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Demographic Stage Tier</p>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border mt-1 ${simResults.stageColor}`}>
                  {simResults.stageTier}
                </span>
              </div>
            </div>

            {/* Projection Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/90 border border-white/10 p-5 rounded-2xl">
                <p className="text-xs font-bold text-slate-200 mb-3">Projected Trajectory vs Carrying Capacity (K)</p>
                <div className="h-[220px]">
                  <Line
                    data={{
                      labels: simResults.labels,
                      datasets: [
                        {
                          label: `${speciesName} Projected Population`,
                          data: simResults.trajectory,
                          borderColor: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          fill: true,
                          tension: 0.35,
                          pointBackgroundColor: '#10b981',
                          pointRadius: 4
                        },
                        {
                          label: 'Carrying Capacity Limit (K)',
                          data: simResults.capacityLine,
                          borderColor: '#ef4444',
                          borderDash: [6, 4],
                          fill: false,
                          pointRadius: 0
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { labels: { color: '#cbd5e1', font: { size: 11 } } }
                      },
                      scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Cohort Breakdown & Advisory */}
              <div className="bg-slate-900/90 border border-white/10 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-200 mb-2">Life Stage Cohort Breakdown</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl">
                      <span className="text-slate-300">Adult Breeding Stage</span>
                      <span className="font-bold text-amber-400">{simResults.adultCount} ({adultPct}%)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl">
                      <span className="text-slate-300">Subadult Stage</span>
                      <span className="font-bold text-cyan-400">{simResults.subadultCount} ({subadultPct}%)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl">
                      <span className="text-slate-300">Juvenile / Cub Stage</span>
                      <span className="font-bold text-emerald-400">{simResults.juvenileCount} ({juvenilePct}%)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300">
                  <p className="font-bold text-white mb-1">AI Conservation Advisory:</p>
                  {simResults.advice}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Methodology & Stage Definitions Reference */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-600" />
          Demographic Stages & Estimation Framework Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
            <span className="font-bold text-emerald-800 block">Stage 1: Thriving (r &gt; 5%)</span>
            <p className="text-slate-600 text-[11px]">Rapid population growth with strong juvenile recruitment and minimal anthropogenic pressure.</p>
          </div>
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
            <span className="font-bold text-blue-800 block">Stage 2: Capacity Equilibrium</span>
            <p className="text-slate-600 text-[11px]">Density nears carrying capacity (K). Natural territorial dispersal buffers surplus individuals.</p>
          </div>
          <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
            <span className="font-bold text-amber-800 block">Stage 3: Vulnerable (0 ≤ r &lt; 3%)</span>
            <p className="text-slate-600 text-[11px]">Recruitment is suppressed by prey scarcity, fragment corridors, or habitat edge friction.</p>
          </div>
          <div className="p-3.5 bg-red-50/50 border border-red-100 rounded-xl space-y-1">
            <span className="font-bold text-red-800 block">Stage 4: Critical (r &lt; 0%)</span>
            <p className="text-slate-600 text-[11px]">Mortality exceeds birth rate. Emergency anti-poaching and corridor protection mandated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
