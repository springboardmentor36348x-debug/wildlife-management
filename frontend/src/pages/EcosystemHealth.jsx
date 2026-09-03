import React, { useState } from 'react';
import { ShieldCheck, HelpCircle, Activity, Sparkles, Cpu, Sliders } from 'lucide-react';

export default function EcosystemHealth() {
  // Live calculator slider state variables
  const [divVal, setDivVal] = useState(85);
  const [stabVal, setStabVal] = useState(78);
  const [habVal, setHabVal] = useState(82);
  const [endVal, setEndVal] = useState(90);
  const [envVal, setEnvVal] = useState(75);

  // Health calculation logic matching the weighted backend model
  const diversityWeight = 0.30;
  const stabilityWeight = 0.25;
  const habitatWeight = 0.20;
  const endangeredWeight = 0.15;
  const envWeight = 0.10;

  const score = (
    (divVal * diversityWeight) +
    (stabVal * stabilityWeight) +
    (habVal * habitatWeight) +
    (endVal * endangeredWeight) +
    (envVal * envWeight)
  );

  const finalScore = parseFloat(score.toFixed(1));

  let statusText = '';
  let statusColor = '';
  let statusDesc = '';

  if (finalScore >= 90) {
    statusText = 'Excellent';
    statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    statusDesc = 'Ecosystem is in pristine balance with flourishing biodiversity and high stability.';
  } else if (finalScore >= 75) {
    statusText = 'Healthy';
    statusColor = 'bg-green-100 text-green-800 border-green-200';
    statusDesc = 'Ecosystem exhibits robust health, sustainable populations, and good habitat integrity.';
  } else if (finalScore >= 60) {
    statusText = 'Moderate Concern';
    statusColor = 'bg-amber-100 text-amber-800 border-amber-200';
    statusDesc = 'Signs of localized habitat degradation or population stagnation observed. Increased monitoring advised.';
  } else if (finalScore >= 40) {
    statusText = 'Vulnerable';
    statusColor = 'bg-orange-100 text-orange-800 border-orange-200';
    statusDesc = 'Ecosystem under notable stress with declining trends or habitat fragmentation.';
  } else {
    statusText = 'Critical';
    statusColor = 'bg-red-100 text-red-800 border-red-200';
    statusDesc = 'Urgent conservation intervention required. Severe habitat loss or rapid population decline detected.';
  }

  // Pre-seeded sites comparisons
  const siteComparisons = [
    {
      name: 'Nagarjuna Sagar Reserve',
      scores: { diversity: 85, stability: 78, habitat: 82.4, endangered: 90, environment: 75 },
      final: 82.7,
      status: 'Healthy'
    },
    {
      name: 'Western Ghats Corridor',
      scores: { diversity: 70, stability: 62, habitat: 68.5, endangered: 80, environment: 60 },
      final: 67.7,
      status: 'Moderate Concern'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">Ecosystem Health Scoring</h2>
        <p className="text-sm text-slate-500 mt-1">Weighted conservation index combining biodiversity, populations stability, habitat indices, and environmental parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Calculator */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-emerald-600" />
            Interactive Health Index Calculator
          </h3>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Species Diversity Index (Weight: 30%)</span>
                <span>{divVal}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={divVal}
                onChange={(e) => setDivVal(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Populations Demographics Stability (Weight: 25%)</span>
                <span>{stabVal}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={stabVal}
                onChange={(e) => setStabVal(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Habitat Quality Score (Weight: 20%)</span>
                <span>{habVal}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={habVal}
                onChange={(e) => setHabVal(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Endangered Species Status Indicator (Weight: 15%)</span>
                <span>{endVal}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={endVal}
                onChange={(e) => setEndVal(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Environmental Baseline Conditions (Weight: 10%)</span>
                <span>{envVal}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={envVal}
                onChange={(e) => setEnvVal(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Gauge / Score Output */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="text-center space-y-4">
            <h3 className="text-base font-bold text-slate-800">Ecosystem Health Output</h3>
            
            <div className="py-8 relative flex items-center justify-center">
              <div className="h-32 w-32 rounded-full border-8 border-slate-100 flex flex-col items-center justify-center relative">
                <span className="text-3xl font-black text-slate-800">{finalScore}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Health Score</span>
              </div>
            </div>

            <div className={`inline-block border font-bold text-xs uppercase px-3 py-1 rounded-full ${statusColor}`}>
              {statusText}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed px-2">{statusDesc}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-[10px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-500 uppercase mb-1">Active Model Formula</p>
            <p>Score = (Diversity * 0.3) + (Stability * 0.25) + (Habitat * 0.2) + (Endangered * 0.15) + (Env * 0.1)</p>
          </div>
        </div>
      </div>

      {/* Comparisons */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800">Comparative Site Assessments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {siteComparisons.map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  c.status === 'Healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>{c.status}</span>
              </div>
              
              <div className="grid grid-cols-5 gap-2 text-center text-[10px] text-slate-500 font-semibold border-t border-slate-200/50 pt-3">
                <div>
                  <span>Diversity</span>
                  <span className="block font-bold text-slate-700 mt-1">{c.scores.diversity}%</span>
                </div>
                <div>
                  <span>Stability</span>
                  <span className="block font-bold text-slate-700 mt-1">{c.scores.stability}%</span>
                </div>
                <div>
                  <span>Habitat</span>
                  <span className="block font-bold text-slate-700 mt-1">{c.scores.habitat}%</span>
                </div>
                <div>
                  <span>Endangered</span>
                  <span className="block font-bold text-slate-700 mt-1">{c.scores.endangered}%</span>
                </div>
                <div>
                  <span>Env</span>
                  <span className="block font-bold text-slate-700 mt-1">{c.scores.environment}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 text-xs font-bold text-slate-700">
                <span>Weighted Health Result</span>
                <span>{c.final}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
