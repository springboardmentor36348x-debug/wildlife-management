import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { api } from "../api/client";
import {
  Layers,
  MapPin,
  Activity,
  Trees,
  Shield,
  Compass,
  Maximize2,
  Minimize2,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  Radio,
  PawPrint,
} from "lucide-react";

// Fix Leaflet default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const BASE_MAPS = {
  carto_light: {
    name: "Terrain / Clean",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  },
  satellite: {
    name: "Satellite Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
  dark_matter: {
    name: "Dark Canopy",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
};

function createSvgPin(color, innerIconHtml, size = 32) {
  return L.divIcon({
    className: "custom-gis-pin",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${color};
        color: white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; font-size: ${size * 0.45}px;">
          ${innerIconHtml}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export default function GisMap({
  height = "520px",
  surveyId = null,
  initialLayer = "all",
  activeLayers: propActiveLayers = null,
  selectedSpecies = null,
  onSiteClick = null,
  showControls = true,
  title = "GIS Geographic Intelligence",
  subtitle = "Interactive multi-layer spatial telemetry & environmental zones",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const layerGroupsRef = useRef({
    sensors: L.layerGroup(),
    species_distribution: L.layerGroup(),
    habitat_zones: L.layerGroup(),
    health_scores: L.layerGroup(),
    migration_paths: L.layerGroup(),
    protected_areas: L.layerGroup(),
  });

  const [activeBaseMap, setActiveBaseMap] = useState("carto_light");
  const [layersVisibility, setLayersVisibility] = useState({
    sensors: true,
    species_distribution: true,
    habitat_zones: true,
    health_scores: true,
    migration_paths: true,
    protected_areas: true,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sitesCount: 0, speciesCount: 0, alertsCount: 0 });
  const [availableSurveys, setAvailableSurveys] = useState([]);
  const [currentSurvey, setCurrentSurvey] = useState(surveyId || "");
  const [currentSpecies, setCurrentSpecies] = useState(selectedSpecies || "");
  const [speciesList, setSpeciesList] = useState([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-2.5, 35.0],
        zoom: 8,
        zoomControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      const base = BASE_MAPS[activeBaseMap];
      baseTileLayerRef.current = L.tileLayer(base.url, {
        attribution: base.attribution,
        maxZoom: 19,
      }).addTo(map);

      // Add all layer groups to map
      Object.values(layerGroupsRef.current).forEach((lg) => lg.addTo(map));

      mapInstanceRef.current = map;
    }

    return () => {
      // Don't destroy on every render to avoid flicker
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (baseTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
    }
    const base = BASE_MAPS[activeBaseMap];
    baseTileLayerRef.current = L.tileLayer(base.url, {
      attribution: base.attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, [activeBaseMap]);

  // Load Filters & Surveys list
  useEffect(() => {
    api.listSurveys().then((s) => setAvailableSurveys(s || [])).catch(() => {});
    api.getPopulationCounts().then((counts) => {
      setSpeciesList(counts.map((c) => c.species));
    }).catch(() => {});
  }, []);

  // Toggle Layer Visibility
  const toggleLayer = (key) => {
    setLayersVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const lg = layerGroupsRef.current[key];
      if (lg && mapInstanceRef.current) {
        if (next[key]) {
          mapInstanceRef.current.addLayer(lg);
        } else {
          mapInstanceRef.current.removeLayer(lg);
        }
      }
      return next;
    });
  };

  // Fetch and Draw All Layer Data
  const refreshLayersData = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    setLoading(true);

    try {
      // Clear existing layers
      Object.values(layerGroupsRef.current).forEach((lg) => lg.clearLayers());

      const [sensorsGeo, speciesGeo, habitatGeo, healthGeo, migrationGeo, protectedGeo] = await Promise.all([
        api.getGisSensors(currentSurvey || undefined).catch(() => ({ features: [] })),
        api.getGisSpeciesDistribution({ surveyId: currentSurvey || undefined, species: currentSpecies || undefined }).catch(() => ({ features: [] })),
        api.getGisHabitatZones().catch(() => ({ features: [] })),
        api.getGisHealthScores().catch(() => ({ features: [] })),
        api.getGisMigrationPaths(currentSpecies || undefined).catch(() => ({ features: [] })),
        api.getGisProtectedAreas().catch(() => ({ features: [] })),
      ]);

      const allLatLngs = [];

      // 1. SENSORS LAYER
      if (sensorsGeo.features) {
        sensorsGeo.features.forEach((f) => {
          const [lon, lat] = f.geometry.coordinates;
          allLatLngs.push([lat, lon]);
          const props = f.properties;
          const icon = props.device_type === "audio_sensor" ? "🔊" : props.device_type === "drone" ? "🛸" : "📷";
          const color = props.is_active ? "#15803d" : "#64748b";

          const marker = L.marker([lat, lon], {
            icon: createSvgPin(color, icon, 32),
          });

          const popupContent = `
            <div style="font-family: inherit; font-size: 12px; min-width: 200px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-weight: 700; font-size: 13px; color: #1e293b;">${props.name}</span>
                <span style="background: ${props.is_active ? '#dcfce7' : '#f1f5f9'}; color: ${props.is_active ? '#166534' : '#475569'}; padding: 2px 6px; border-radius: 999px; font-size: 10px; font-weight: 600;">
                  ${props.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style="margin: 2px 0; color: #64748b;"><strong>Device:</strong> ${props.device_type.replace('_', ' ').toUpperCase()}</p>
              <p style="margin: 2px 0; color: #64748b;"><strong>Habitat:</strong> ${props.habitat_type}</p>
              <p style="margin: 2px 0; color: #64748b;"><strong>Protected Area:</strong> ${props.protected_area}</p>
              <p style="margin: 2px 0; color: #64748b;"><strong>Observations:</strong> ${props.observation_count}</p>
              <p style="margin: 2px 0; color: #94a3b8; font-size: 10px;">Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
            </div>
          `;
          marker.bindPopup(popupContent);
          if (onSiteClick) marker.on("click", () => onSiteClick(props));
          layerGroupsRef.current.sensors.addLayer(marker);
        });
      }

      // 2. SPECIES DISTRIBUTION LAYER
      if (speciesGeo.features) {
        speciesGeo.features.forEach((f) => {
          const [lon, lat] = f.geometry.coordinates;
          const props = f.properties;
          if (props.total_detections > 0) {
            const circle = L.circleMarker([lat, lon], {
              radius: Math.min(24, Math.max(8, props.total_detections * 3)),
              color: "#d97706",
              fillColor: "#fbbf24",
              fillOpacity: 0.45,
              weight: 2,
            });
            const speciesTags = (props.species_counts || [])
              .map((c) => `<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin: 2px;">${c.species}: ${c.count}</span>`)
              .join(" ");

            circle.bindPopup(`
              <div style="font-family: inherit; font-size: 12px; min-width: 200px;">
                <strong style="color: #92400e; font-size: 13px;">🐾 Species Sightings at ${props.site_name}</strong>
                <p style="margin: 4px 0 6px 0; color: #4b5563;">Total confirmed observations: <strong>${props.total_detections}</strong></p>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">${speciesTags}</div>
              </div>
            `);
            layerGroupsRef.current.species_distribution.addLayer(circle);
          }
        });
      }

      // 3. HABITAT ZONES LAYER
      if (habitatGeo.features) {
        habitatGeo.features.forEach((f) => {
          const [lon, lat] = f.geometry.coordinates;
          const props = f.properties;
          const circle = L.circle([lat, lon], {
            radius: 3500, // 3.5km zone
            color: props.is_declining ? "#dc2626" : props.habitat_color || "#15803d",
            fillColor: props.is_declining ? "#fee2e2" : props.habitat_color || "#15803d",
            fillOpacity: props.is_declining ? 0.35 : 0.15,
            dashArray: props.is_declining ? "6, 6" : undefined,
            weight: props.is_declining ? 2 : 1,
          });

          circle.bindPopup(`
            <div style="font-family: inherit; font-size: 12px;">
              <strong style="color: #1e293b; font-size: 13px;">🌿 Habitat Zone: ${props.site_name}</strong>
              <p style="margin: 3px 0; color: #475569;">Type: <strong>${props.habitat_type.toUpperCase()}</strong></p>
              <p style="margin: 3px 0; color: ${props.is_declining ? '#b91c1c' : '#15803d'}; font-weight: 600;">
                Degradation Status: ${props.degradation_status.toUpperCase()} ${props.change_pct !== null ? `(${props.change_pct}%)` : ''}
              </p>
              <p style="margin: 3px 0; color: #64748b;">Recent observations: ${props.recent_obs}</p>
            </div>
          `);
          layerGroupsRef.current.habitat_zones.addLayer(circle);
        });
      }

      // 4. HEALTH SCORES LAYER
      if (healthGeo.features) {
        healthGeo.features.forEach((f) => {
          const [lon, lat] = f.geometry.coordinates;
          const props = f.properties;
          const score = props.ecosystem_health_score;
          const color = props.status_color || "#10B981";

          const pulseIcon = L.divIcon({
            className: "health-score-marker",
            html: `
              <div style="
                width: 32px; height: 32px;
                background: ${color};
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 11px;
                box-shadow: 0 0 10px ${color}88, 0 2px 4px rgba(0,0,0,0.3);
                border: 2px solid white;
              ">
                ${Math.round(score)}
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([lat, lon], { icon: pulseIcon });
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; min-width: 220px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                <strong style="color: #1e293b; font-size: 13px;">${props.site_name}</strong>
                <span style="background: ${color}22; color: ${color}; padding: 2px 6px; border-radius: 999px; font-weight: 700; font-size: 11px;">
                  ${props.conservation_status}
                </span>
              </div>
              <p style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 4px 0;">
                Ecosystem Health Score: <span style="color: ${color};">${score}/100</span>
              </p>
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
                <div>Diversity Score: ${props.components?.species_diversity?.score ?? '—'}/100</div>
                <div>Stability Score: ${props.components?.population_stability?.score ?? '—'}/100</div>
                <div>Habitat Score: ${props.components?.habitat_quality?.score ?? '—'}/100</div>
              </div>
            </div>
          `);
          layerGroupsRef.current.health_scores.addLayer(marker);
        });
      }

      // 5. MIGRATION PATHS LAYER
      if (migrationGeo.features) {
        migrationGeo.features.forEach((f) => {
          if (f.geometry.type === "LineString") {
            const latlngs = f.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
            const polyline = L.polyline(latlngs, {
              color: "#3b82f6",
              weight: 4,
              opacity: 0.8,
              dashArray: "8, 6",
            });
            polyline.bindPopup(`
              <div style="font-family: inherit; font-size: 12px;">
                <strong style="color: #1d4ed8; font-size: 13px;">🔄 Migration Corridor: ${f.properties.species.toUpperCase()}</strong>
                <p style="margin: 3px 0; color: #475569;">Path: <strong>${f.properties.start_site} &rarr; ${f.properties.end_site}</strong></p>
                <p style="margin: 3px 0; color: #64748b;">Waypoints: ${f.properties.total_waypoints} sites recorded</p>
              </div>
            `);
            layerGroupsRef.current.migration_paths.addLayer(polyline);
          }
        });
      }

      // 6. PROTECTED AREAS LAYER
      if (protectedGeo.features) {
        protectedGeo.features.forEach((f) => {
          const [lon, lat] = f.geometry.coordinates;
          const props = f.properties;
          const circle = L.circle([lat, lon], {
            radius: 8000,
            color: "#059669",
            fillColor: "#10b981",
            fillOpacity: 0.08,
            weight: 1.5,
          });
          circle.bindPopup(`
            <div style="font-family: inherit; font-size: 12px;">
              <strong style="color: #065f46; font-size: 13px;">🏞️ ${props.protected_area_name}</strong>
              <p style="margin: 3px 0; color: #475569;">Total Monitoring Sites: <strong>${props.sites_count}</strong></p>
              <p style="margin: 3px 0; color: #64748b; font-size: 11px;">Included: ${props.sites.join(', ')}</p>
            </div>
          `);
          layerGroupsRef.current.protected_areas.addLayer(circle);
        });
      }

      // Update statistics
      setStats({
        sitesCount: sensorsGeo.features ? sensorsGeo.features.length : 0,
        speciesCount: speciesGeo.features ? speciesGeo.features.length : 0,
        alertsCount: habitatGeo.features ? habitatGeo.features.filter((f) => f.properties.is_declining).length : 0,
      });

      // Auto-fit bounds if we have points
      if (allLatLngs.length > 0 && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(allLatLngs, { padding: [40, 40], maxZoom: 11 });
      }
    } catch (err) {
      console.error("GIS Layer loading failed:", err);
    } finally {
      setLoading(false);
    }
  }, [currentSurvey, currentSpecies, onSiteClick]);

  useEffect(() => {
    refreshLayersData();
  }, [refreshLayersData]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-2.5, 35.0], 8);
    }
  };

  return (
    <div
      className={`card overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl bg-white" : ""
      }`}
    >
      {/* Header toolbar */}
      <div className="px-5 py-3.5 bg-canopy-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-canopy-800">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-ochre-400" />
            <h3 className="font-display font-semibold text-white text-base leading-none">{title}</h3>
          </div>
          <p className="text-xs text-canopy-300 mt-0.5">{subtitle}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Base map style selector */}
          <select
            value={activeBaseMap}
            onChange={(e) => setActiveBaseMap(e.target.value)}
            className="text-xs bg-canopy-800 text-canopy-100 border border-canopy-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            {Object.entries(BASE_MAPS).map(([key, bm]) => (
              <option key={key} value={key}>
                {bm.name}
              </option>
            ))}
          </select>

          <button
            onClick={refreshLayersData}
            title="Refresh GIS layers"
            className="p-1.5 rounded-lg bg-canopy-800 hover:bg-canopy-700 text-canopy-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-ochre-400" : ""}`} />
          </button>

          <button
            onClick={resetView}
            title="Reset Zoom & Center"
            className="p-1.5 rounded-lg bg-canopy-800 hover:bg-canopy-700 text-canopy-200 text-xs px-2"
          >
            Reset Center
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
            className="p-1.5 rounded-lg bg-canopy-800 hover:bg-canopy-700 text-canopy-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Layer switchers & Filter Bar */}
      {showControls && (
        <div className="px-5 py-2.5 bg-canopy-50/80 border-b border-canopy-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Layer toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-canopy-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Layers:
            </span>

            {[
              { key: "sensors", label: "Sensors & Nodes", color: "bg-emerald-600", icon: Radio },
              { key: "species_distribution", label: "Species Sightings", color: "bg-amber-600", icon: PawPrint },
              { key: "habitat_zones", label: "Habitat & Degradation", color: "bg-green-700", icon: Trees },
              { key: "health_scores", label: "Health Scores", color: "bg-emerald-500", icon: Shield },
              { key: "migration_paths", label: "Migration Paths", color: "bg-blue-600", icon: Compass },
              { key: "protected_areas", label: "Protected Areas", color: "bg-teal-700", icon: MapPin },
            ].map(({ key, label, color, icon: Icon }) => {
              const active = layersVisibility[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all ${
                    active
                      ? `${color} text-white shadow-xs`
                      : "bg-white text-bark-600 border border-canopy-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                  {active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
              );
            })}
          </div>

          {/* Filter dropdowns */}
          <div className="flex items-center gap-2">
            {availableSurveys.length > 0 && (
              <select
                value={currentSurvey}
                onChange={(e) => setCurrentSurvey(e.target.value)}
                className="bg-white border border-canopy-200 rounded-md px-2 py-1 text-xs text-bark-800"
              >
                <option value="">All Surveys</option>
                {availableSurveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {speciesList.length > 0 && (
              <select
                value={currentSpecies}
                onChange={(e) => setCurrentSpecies(e.target.value)}
                className="bg-white border border-canopy-200 rounded-md px-2 py-1 text-xs text-bark-800 capitalize"
              >
                <option value="">All Species</option>
                {speciesList.map((sp) => (
                  <option key={sp} value={sp} className="capitalize">
                    {sp}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Map Display Container */}
      <div className="relative flex-1" style={{ minHeight: isFullscreen ? "calc(100vh - 120px)" : height }}>
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: isFullscreen ? "100%" : height }} />

        {/* Loading Spinner Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xs flex items-center justify-center pointer-events-none z-1000">
            <div className="bg-canopy-900/90 text-white text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-ochre-400" />
              <span>Rendering GIS Telemetry Layers...</span>
            </div>
          </div>
        )}

        {/* Legend Overlay on Map bottom-left */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur border border-canopy-200 rounded-lg p-2.5 shadow-md z-1000 text-xs max-w-xs pointer-events-auto">
          <p className="font-bold text-bark-900 mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-canopy-700" />
            Ecosystem Health Index
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-bark-700">Excellent (80+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
              <span className="text-bark-700">Healthy (65-79)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
              <span className="text-bark-700">Moderate (50-64)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
              <span className="text-bark-700">Vulnerable (35-49)</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-bark-700">Critical (&lt;35) / Degradation Flag</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
