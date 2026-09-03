import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Layers, Eye, Filter } from 'lucide-react';

// Leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for wildlife reserve sites
const siteIcon = L.divIcon({
  html: `<div style="background:#059669; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 8px rgba(5,150,105,0.6);"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function GISMap() {
  const [sitesGeo, setSitesGeo] = useState([]);
  const [observationsHeatmap, setObservationsHeatmap] = useState([]);
  const [showObservations, setShowObservations] = useState(true);
  const [showSites, setShowSites] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGISData() {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [resSites, resObs] = await Promise.all([
          fetch('/api/v1/gis/sites-geojson', { headers }),
          fetch('/api/v1/gis/observations-heatmap', { headers })
        ]);

        if (resSites.ok) {
          const data = await resSites.json();
          setSitesGeo(data.features || []);
        }

        if (resObs.ok) {
          const data = await resObs.json();
          setObservationsHeatmap(data.features || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGISData();
  }, []);

  // India center for initial map zoom
  const mapCenter = [20.5937, 78.9629];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">GIS Wildlife Distribution Maps</h2>
          <p className="text-sm text-slate-500 mt-1">Spatial hotspot heatmaps, reserve zone markers, and species observation clustering.</p>
        </div>
      </div>

      {/* Map Layer Controls */}
      <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm">
        <Layers className="h-4 w-4 text-slate-400" />
        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Layer Controls:</span>
        <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={showSites}
            onChange={(e) => setShowSites(e.target.checked)}
            className="rounded accent-emerald-600"
          />
          Reserve Site Markers
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={showObservations}
            onChange={(e) => setShowObservations(e.target.checked)}
            className="rounded accent-emerald-600"
          />
          Wildlife Observation Hotspots
        </label>
      </div>

      {/* Leaflet Map Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-[480px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading geospatial data layers...</div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={5}
              style={{ height: '100%', width: '100%', borderRadius: '16px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {/* Reserve Site Markers */}
              {showSites && sitesGeo.map((feature) => {
                const [lon, lat] = feature.geometry.coordinates;
                const props = feature.properties;
                return (
                  <Marker key={props.id} position={[lat, lon]} icon={siteIcon}>
                    <Popup>
                      <div className="text-xs space-y-1 min-w-[200px]">
                        <h3 className="font-bold text-slate-800 text-sm">{props.site_name}</h3>
                        <p className="text-slate-500">Code: {props.site_code}</p>
                        <p className="text-slate-500">Habitat: {props.habitat_type}</p>
                        <p className="text-slate-500">Area: {props.area_km2} km²</p>
                        <p className="text-emerald-700 font-semibold">
                          {props.observation_count} observations logged
                        </p>
                        {props.is_protected_area && (
                          <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Protected Area
                          </span>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Wildlife Observation Heatmap Dots */}
              {showObservations && observationsHeatmap.map((feature) => {
                const [lon, lat] = feature.geometry.coordinates;
                const props = feature.properties;
                return (
                  <CircleMarker
                    key={props.id}
                    center={[lat, lon]}
                    radius={8}
                    fillColor="#f97316"
                    color="#ea580c"
                    weight={1.5}
                    opacity={0.8}
                    fillOpacity={0.6}
                  >
                    <Popup>
                      <div className="text-xs space-y-1 min-w-[180px]">
                        <h3 className="font-bold text-slate-800">{props.species_name}</h3>
                        <p className="text-slate-500">Date: {props.date}</p>
                        <p className="text-slate-500">Animals Counted: {props.count}</p>
                        {props.confidence && (
                          <p className="text-slate-500">AI Confidence: {(props.confidence * 100).toFixed(0)}%</p>
                        )}
                        <span className="inline-block bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                          {props.type} observation
                        </span>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Map Legend */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-6 text-xs text-slate-600 font-semibold">
        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Map Legend:</span>
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-emerald-600 border-2 border-white shadow"></div>
          Reserve Site Boundaries
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-orange-500 opacity-80"></div>
          Wildlife Observation Hotspot
        </div>
      </div>
    </div>
  );
}
