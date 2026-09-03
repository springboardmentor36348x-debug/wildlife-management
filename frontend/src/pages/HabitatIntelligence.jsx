import React, { useState, useEffect } from 'react';
import { ShieldCheck, HelpCircle, Activity, Save, Trees, Droplet, Users } from 'lucide-react';

export default function HabitatIntelligence() {
  const [siteId, setSiteId] = useState('');
  const [sites, setSites] = useState([]);
  const [habData, setHabData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form Sliders for field submission
  const [vegVal, setVegVal] = useState(80);
  const [waterVal, setWaterVal] = useState(75);
  const [humanVal, setHumanVal] = useState(15);
  const [canopyVal, setCanopyVal] = useState(70);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSites() {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/v1/monitoring-sites', { headers });
        if (res.ok) {
          const data = await res.json();
          setSites(data);
          if (data.length > 0) setSiteId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSites();
  }, []);

  const loadHabitat = async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/habitat/assessment?site_id=${siteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHabData(data);
        // Pre-fill sliders
        setVegVal(data.vegetation_score || 80);
        setWaterVal(data.water_source_score || 75);
        setHumanVal(data.human_disturbance_score || 15);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabitat();
  }, [siteId]);

  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/habitat/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          site_id: parseInt(siteId),
          vegetation_quality: parseFloat(vegVal),
          water_availability: parseFloat(waterVal),
          human_disturbance: parseFloat(humanVal),
          canopy_cover_pct: parseFloat(canopyVal)
        })
      });

      if (res.ok) {
        alert('Habitat health assessment saved successfully!');
        loadHabitat();
      } else {
        alert('Failed to save assessment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-col md:flex-row gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Habitat Intelligence</h2>
          <p className="text-sm text-slate-500 mt-1">Ecosystem quality scoring, vegetation canopy ratios, and human encroachment indexes.</p>
        </div>

        <div>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            {sites.map((st) => (
              <option key={st.id} value={st.id}>{st.site_name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Retrieving habitat maps...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habitat Quality Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-base font-bold text-slate-800">Ecosystem Integrity Scores</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  habData?.habitat_quality_score >= 75 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                }`}>
                  Status: {habData?.environmental_status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <Trees className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Vegetation Density</span>
                    <span className="font-extrabold text-slate-800">{habData?.vegetation_score}%</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <Droplet className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Water Availability</span>
                    <span className="font-extrabold text-slate-800">{habData?.water_source_score}%</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <Users className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Human Encroachment</span>
                    <span className="font-extrabold text-slate-800">{habData?.human_disturbance_score}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-sm text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Habitat Quality Score</span>
                  <span className="text-xl font-black text-slate-800 mt-1">{habData?.habitat_quality_score}/100</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Degradation Classification</span>
                  <span className="text-xl font-black text-slate-800 mt-1 capitalize">{habData?.degradation_level}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">{habData?.degradation_type}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Assessment Sliders */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4">
                Field Health Assessment Form
              </h3>
              <form onSubmit={handleSubmitAssessment} className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Vegetation Quality</span>
                    <span>{vegVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={vegVal}
                    onChange={(e) => setVegVal(e.target.value)}
                    className="w-full accent-emerald-600"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Water Source Abundance</span>
                    <span>{waterVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={waterVal}
                    onChange={(e) => setWaterVal(e.target.value)}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Human Disturbance / Encroachment</span>
                    <span>{humanVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={humanVal}
                    onChange={(e) => setHumanVal(e.target.value)}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 mt-6 border border-transparent rounded-lg text-xs font-semibold text-slate-950 bg-nature-400 hover:bg-nature-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {submitting ? 'Saving...' : 'Submit Field Report'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
