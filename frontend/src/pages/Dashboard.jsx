import React, { useState, useEffect } from 'react';
import { 
  TreePine, Eye, ShieldAlert, Wifi, Cpu, Layers, Clipboard, 
  BarChart3, Activity, ArrowRight, UserCheck, Database, Zap 
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalSpecies: 6,
    totalObservations: 142,
    estimatedPopulation: 260,
    biodiversityScore: 82.5,
    habitatQuality: 82.4,
    ecosystemHealth: 82.7,
    activeAlerts: 3,
    activeDevices: 5
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch alerts
        const resAlerts = await fetch('/api/v1/conservation/alerts?is_active=true', { headers });
        if (resAlerts.ok) {
          const alertData = await resAlerts.json();
          setAlerts(alertData);
        }

        // Fetch general stats (fallback if endpoints are loading)
        const resPop = await fetch('/api/v1/population/overview', { headers });
        const resBio = await fetch('/api/v1/biodiversity/metrics', { headers });
        
        if (resPop.ok && resBio.ok) {
          const pop = await resPop.json();
          const bio = await resBio.json();
          setStats(prev => ({
            ...prev,
            totalObservations: bio.total_observations || 142,
            totalSpecies: bio.species_richness || 6,
            estimatedPopulation: pop.total_individuals_estimated || 260,
            biodiversityScore: bio.biodiversity_score || 82.5
          }));
        }
      } catch (err) {
        console.error("Dashboard loading error", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Dashboard Chart Configuration
  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Tiger Sightings',
        data: [12, 19, 15, 24, 22, 30],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Elephant Sightings',
        data: [25, 28, 35, 30, 42, 45],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const speciesDistData = {
    labels: ['Mammals', 'Birds', 'Reptiles', 'Amphibians'],
    datasets: [{
      data: [65, 22, 10, 3],
      backgroundColor: ['#059669', '#3b82f6', '#eab308', '#ec4899'],
      borderWidth: 0
    }]
  };

  const renderRoleDashboard = () => {
    switch (user.role) {
      case 'wildlife_researcher':
        return (
          <div className="space-y-6">
            <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Welcome back, Dr. Anjali</h2>
                <p className="text-sm text-slate-500 mt-1">Research Hub: Track species occurrence records, bioacoustic logs, and Shannon diversity metrics.</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200">
                  Role: Wildlife Researcher
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4">Populations Sightings Timeline</h3>
                <div className="h-[260px] flex items-center justify-center">
                  <Line data={trendData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4">Taxonomic Group Diversity</h3>
                <div className="h-[220px] flex items-center justify-center">
                  <Doughnut data={speciesDistData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'conservation_officer':
        return (
          <div className="space-y-6">
            <div className="bg-amber-950/5 border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Welcome, Officer Rajesh Kumar</h2>
                <p className="text-sm text-slate-500 mt-1">Conservation Panel: Check habitat quality degradations, human disturbances, and AI policy recommendations.</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-200">
                Role: Conservation Officer
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800">Critical Restoration Corridors</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Western Ghats Corridor Zone A</span>
                    <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2 py-1 rounded">High Priority</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Nagarjuna Sagar Buffer Sector 4</span>
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">Medium Priority</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800">Biodiversity vs Habitat Suitability</h3>
                <div className="h-[200px]">
                  <Bar data={{
                    labels: ['SITE001', 'SITE002', 'SITE003'],
                    datasets: [
                      { label: 'Biodiversity Score', data: [82.5, 78.0, 68.5], backgroundColor: '#10b981' },
                      { label: 'Habitat Suitability %', data: [82.4, 75.0, 68.5], backgroundColor: '#f59e0b' }
                    ]
                  }} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'forest_department_officer':
        return (
          <div className="space-y-6">
            <div className="bg-cyan-950/5 border border-cyan-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Welcome, Ranger Amit Sharma</h2>
                <p className="text-sm text-slate-500 mt-1">Forest Patrol & Sensor Telemetry Hub: Track active devices, patrol grids, and incident reports.</p>
              </div>
              <span className="bg-cyan-100 text-cyan-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-cyan-200">
                Role: Forest Officer
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-slate-800">Monitoring Device Batteries</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-800">NS Core Zone Cam 01</p>
                      <p className="text-[10px] text-slate-500">Camera Trap</p>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-700">89%</span>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-red-800">NS Core Zone Cam 02</p>
                      <p className="text-[10px] text-slate-500">Camera Trap</p>
                    </div>
                    <span className="text-sm font-extrabold text-red-700">12%</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800">Patrol Summary Log</h3>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>🗓️ <b>Aug 22:</b> Anti-Poaching Sweep completed in sector grid-NS-12.</p>
                  <p>🔍 <b>Outcome:</b> Secured corridor. No snares found.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'administrator':
        return (
          <div className="space-y-6">
            <div className="bg-purple-950/5 border border-purple-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Welcome, Administrator</h2>
                <p className="text-sm text-slate-500 mt-1">Platform Admin: Manage system user registrations, verify AI model statuses, and monitor server health.</p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-purple-200">
                Role: Administrator
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-700">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Platform Users</p>
                  <p className="text-lg font-bold text-slate-800">4 Active</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-700">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Database Engine</p>
                  <p className="text-lg font-bold text-slate-800">SQLite (Local)</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Inference Latency</p>
                  <p className="text-lg font-bold text-slate-800">184 ms</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <TreePine className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Ecosystem Health</p>
            <p className="text-xl font-black text-slate-800">{stats.ecosystemHealth}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Sightings Count</p>
            <p className="text-xl font-black text-slate-800">{stats.totalObservations}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Biodiversity Score</p>
            <p className="text-xl font-black text-slate-800">{stats.biodiversityScore}/100</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Active Alerts</p>
            <p className="text-xl font-black text-slate-800">{alerts.length || stats.activeAlerts}</p>
          </div>
        </div>
      </div>

      {/* Role specific Dashboard content */}
      {renderRoleDashboard()}

      {/* Alerts Feed */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-500" />
          Active Conservation Alerts
        </h3>
        <div className="divide-y divide-slate-100">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                  }`}></span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{alert.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Type: {alert.alert_type} &bull; Reserve: {alert.site_name || 'Global'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-rose-50 text-rose-700 px-2 py-1 rounded">
                  {alert.severity}
                </span>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              No active conservation alerts currently generated.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
