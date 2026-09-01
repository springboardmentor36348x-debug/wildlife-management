import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, Compass, Layers } from "lucide-react";

// Fix default Leaflet icon paths in Vite / React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom pin icons by status / type
const createCustomIcon = (colorHex = "#2f9159") => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
      <path fill="${colorHex}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: svg,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const defaultGreenIcon = createCustomIcon("#1b4332");
const activeIcon = createCustomIcon("#2563eb");
const alertIcon = createCustomIcon("#dc2626");

// Helper component to auto-recenter map when markers change
function MapRecenter({ markers, defaultCenter }) {
  const map = useMap();

  useEffect(() => {
    if (markers && markers.length > 0) {
      const validMarkers = markers.filter((m) => m.latitude != null && m.longitude != null);
      if (validMarkers.length === 1) {
        map.setView([validMarkers[0].latitude, validMarkers[0].longitude], 12);
      } else if (validMarkers.length > 1) {
        const bounds = L.latLngBounds(validMarkers.map((m) => [m.latitude, m.longitude]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } else if (defaultCenter) {
      map.setView(defaultCenter, 6);
    }
  }, [markers, defaultCenter, map]);

  return null;
}

export default function GISMap({
  markers = [],
  height = "420px",
  defaultCenter = [23.5937, 78.9629], // India Core Forest Region Center
  zoom = 5,
  title = "Interactive GIS Map",
  subtitle,
}) {
  const validMarkers = markers.filter(
    (m) => m && !isNaN(parseFloat(m.latitude)) && !isNaN(parseFloat(m.longitude))
  );

  return (
    <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-3">
      {(title || subtitle) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="font-display text-base font-semibold text-forest-900">{title}</h3>}
            {subtitle && <p className="text-xs text-forest-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 text-xs text-forest-600 font-medium bg-forest-50 px-2.5 py-1 rounded-lg border border-forest-100">
            <Compass size={14} className="text-forest-600 animate-spin-slow" />
            <span>{validMarkers.length} GIS Locations Mapped</span>
          </div>
        </div>
      )}

      <div
        className="relative z-0 overflow-hidden rounded-lg border border-surface-border"
        style={{ height }}
      >

        <MapContainer
          center={defaultCenter}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Topo / Satellite Street Map Tile Layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | GIS Intelligence'
          />

          <MapRecenter markers={validMarkers} defaultCenter={defaultCenter} />

          {validMarkers.map((marker, index) => {
            const lat = parseFloat(marker.latitude);
            const lng = parseFloat(marker.longitude);
            const status = marker.status || marker.alert_status;
            let icon = defaultGreenIcon;
            if (status === "Active" || status === "Operational") icon = activeIcon;
            if (status === "Alert" || status === "Maintenance" || status === "Critical") icon = alertIcon;

            return (
              <Marker key={marker.id || index} position={[lat, lng]} icon={icon}>
                <Popup>
                  <div className="space-y-1.5 p-1 text-slate-800">
                    <div className="flex items-center justify-between gap-2 border-b pb-1">
                      <span className="font-bold text-sm text-forest-900">
                        {marker.site_name || marker.name || marker.device_code || marker.species || "GIS Location"}
                      </span>
                      {status && (
                        <span className="rounded bg-forest-100 px-1.5 py-0.5 text-[10px] font-semibold text-forest-800">
                          {status}
                        </span>
                      )}
                    </div>
                    {marker.location && (
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin size={12} className="text-forest-600" />
                        {marker.location}
                      </p>
                    )}
                    {marker.habitat_type && (
                      <p className="text-xs text-slate-500">
                        <strong>Habitat:</strong> {marker.habitat_type}
                      </p>
                    )}
                    {marker.protected_area && (
                      <p className="text-xs text-slate-500">
                        <strong>Protected Area:</strong> {marker.protected_area}
                      </p>
                    )}
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded font-mono mt-1">
                      GPS: {lat.toFixed(4)}°, {lng.toFixed(4)}°
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
