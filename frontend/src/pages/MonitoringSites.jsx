import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Layers, Trees, ShieldCheck, FileText, Trash2, Edit2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Leaflet marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map coordinate click handler
function CoordinatePicker({ onLocationSelected }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MonitoringSites() {
  const [sites, setSites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form State
  const [siteName, setSiteName] = useState('');
  const [siteCode, setSiteCode] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(16.5745);
  const [longitude, setLongitude] = useState(79.3124);
  const [habitatType, setHabitatType] = useState('forest');
  const [areaKm2, setAreaKm2] = useState(100.0);
  const [isProtected, setIsProtected] = useState(true);
  const [protectionStatus, setProtectionStatus] = useState('National Park');

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/monitoring-sites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleCreateSite = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/monitoring-sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          site_name: siteName,
          site_code: siteCode,
          description,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          habitat_type: habitatType,
          area_km2: parseFloat(areaKm2),
          is_protected_area: isProtected,
          protection_status: protectionStatus
        })
      });

      if (res.ok) {
        setSuccessMsg('Monitoring site registered successfully!');
        setShowModal(false);
        fetchSites();
        // Reset form
        setSiteName('');
        setSiteCode('');
        setDescription('');
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Failed to register site');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCoords = (lat, lng) => {
    setLatitude(parseFloat(lat.toFixed(5)));
    setLongitude(parseFloat(lng.toFixed(5)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this monitoring reserve site?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/monitoring-sites/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSites();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Monitoring Sites & Reserves</h2>
          <p className="text-sm text-slate-500 mt-1">Manage core wildlife reserve zones and survey telemetry grids.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-950 bg-nature-400 hover:bg-nature-300 rounded-lg shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Site / Reserve
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-sm">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading reserves database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div key={site.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative group">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] tracking-wider uppercase font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {site.site_code}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-1.5">{site.site_name}</h3>
                  </div>
                  <button 
                    onClick={() => handleDelete(site.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{site.description || "No reserve description logged."}</p>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{site.latitude}, {site.longitude}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Trees className="h-4 w-4 text-slate-400" />
                    <span className="capitalize">{site.habitat_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span>{site.area_km2} km²</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    <span>{site.is_protected_area ? 'Protected' : 'Unprotected'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Surveys: {site.survey_count || 0}</span>
                <span>Observations: {site.observation_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Site Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-800">Register Wildlife Monitoring Site</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            <form onSubmit={handleCreateSite} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Site / Reserve Name</label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="e.g. Nagarjuna Sagar Reserve"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Site Code (Unique ID)</label>
                  <input
                    type="text"
                    required
                    value={siteCode}
                    onChange={(e) => setSiteCode(e.target.value)}
                    placeholder="e.g. SITE001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details on ecological importance, topography, boundaries..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              {/* Coordinates Map Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Locate Reserve Coords (Click Map or Enter Below)
                </label>
                <div className="h-[180px] w-full rounded-xl overflow-hidden border border-slate-200 mb-3">
                  <MapContainer center={[16.5745, 79.3124]} zoom={6} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <CoordinatePicker onLocationSelected={handleSelectCoords} />
                    <Marker position={[latitude, longitude]} />
                  </MapContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Habitat Classification</label>
                  <select
                    value={habitatType}
                    onChange={(e) => setHabitatType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="forest">Deciduous Forest</option>
                    <option value="grassland">Grasslands / Savannah</option>
                    <option value="wetland">Wetlands / Mangroves</option>
                    <option value="mountain">Mountain / Sub-Himalayan</option>
                    <option value="desert">Arid / Scrubland</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Reserve Area (km²)</label>
                  <input
                    type="number"
                    value={areaKm2}
                    onChange={(e) => setAreaKm2(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Protected Legal Status</h4>
                  <p className="text-[10px] text-slate-500">Is this site officially designated as protected?</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={isProtected}
                      onChange={(e) => setIsProtected(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    Protected Area
                  </label>
                  <input
                    type="text"
                    value={protectionStatus}
                    onChange={(e) => setProtectionStatus(e.target.value)}
                    placeholder="e.g. Wildlife Sanctuary"
                    disabled={!isProtected}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-slate-950 bg-nature-400 hover:bg-nature-300 rounded-lg shadow-sm"
                >
                  Register Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
