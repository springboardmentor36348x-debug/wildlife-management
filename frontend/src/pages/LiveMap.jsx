import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getLiveMapSnapshot, connectLiveMapSocket } from "../api/liveMap";

// Default Leaflet marker icons reference image files that don't resolve
// correctly through bundlers - point them at CDN-hosted assets instead.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_COLORS = {
  least_concern: "#2f7a3c",
  near_threatened: "#d4a017",
  vulnerable: "#e07b1a",
  endangered: "#c0392b",
  critically_endangered: "#8e1a1a",
  unknown: "#6b7280",
};

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function LiveMap() {
  const [sites, setSites] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // connecting | live | offline
  const [liveEvents, setLiveEvents] = useState([]);
  const [pulseSiteId, setPulseSiteId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    getLiveMapSnapshot(24).then((res) => setSites(res.data.sites));

    const socket = connectLiveMapSocket(
      (event) => {
        if (event.type !== "new_detection") return;

        setLiveEvents((prev) => [event, ...prev].slice(0, 25));

        setSites((prev) =>
          prev.map((site) =>
            site.monitoring_site_id === event.monitoring_site_id
              ? {
                  ...site,
                  recent_sighting_count: site.recent_sighting_count + 1,
                  recent_sightings: [
                    {
                      species_common_name: event.species_common_name,
                      conservation_status: event.conservation_status,
                      confidence_score: event.confidence_score,
                      source_type: event.source_type,
                      detected_at: event.detected_at,
                    },
                    ...site.recent_sightings,
                  ].slice(0, 20),
                }
              : site
          )
        );

        setPulseSiteId(event.monitoring_site_id);
        setTimeout(() => setPulseSiteId(null), 3000);
      },
      () => setConnectionStatus("live"),
      () => setConnectionStatus("offline")
    );
    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  const defaultCenter = sites.length > 0 ? [sites[0].latitude, sites[0].longitude] : [20.5937, 78.9629];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Live Wildlife Monitoring Map</h1>
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
            connectionStatus === "live"
              ? "bg-green-100 text-green-700"
              : connectionStatus === "connecting"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === "live" ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          {connectionStatus === "live" ? "Live" : connectionStatus === "connecting" ? "Connecting..." : "Offline"}
        </span>
      </div>
      <p className="text-gray-500 mb-6 text-sm">
        Real-time feed of wildlife sightings across all monitoring sites, pushed the moment a
        new image or audio upload is analyzed — no page refresh needed.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow overflow-hidden" style={{ height: "560px" }}>
          <MapContainer center={defaultCenter} zoom={sites.length > 0 ? 6 : 4} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {sites.map((site) => (
              <React.Fragment key={site.monitoring_site_id}>
                {pulseSiteId === site.monitoring_site_id && (
                  <CircleMarker
                    center={[site.latitude, site.longitude]}
                    radius={20}
                    pathOptions={{ color: "#E9A23B", fillColor: "#E9A23B", fillOpacity: 0.3, weight: 2 }}
                  />
                )}
                <Marker position={[site.latitude, site.longitude]}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{site.site_name}</p>
                      <p className="text-xs text-gray-500 capitalize mb-2">{site.habitat_type}</p>
                      <p className="text-xs font-medium mb-1">
                        {site.recent_sighting_count} sighting(s) in the last 24h
                      </p>
                      {site.recent_sightings.slice(0, 5).map((sight, i) => (
                        <div key={i} className="text-xs py-0.5 flex justify-between gap-2">
                          <span
                            style={{ color: STATUS_COLORS[sight.conservation_status] || STATUS_COLORS.unknown }}
                            className="font-medium"
                          >
                            {sight.species_common_name}
                          </span>
                          <span className="text-gray-400">{timeAgo(sight.detected_at)}</span>
                        </div>
                      ))}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-5" style={{ height: "560px", overflowY: "auto" }}>
          <h2 className="font-semibold mb-3">Live Sighting Feed</h2>
          {liveEvents.length === 0 ? (
            <p className="text-gray-400 text-sm">
              Waiting for new detections — upload an image or audio file to see it appear here
              instantly.
            </p>
          ) : (
            <div className="space-y-2">
              {liveEvents.map((event, i) => (
                <div key={i} className="border rounded-lg p-3 animate-[fadeIn_0.3s_ease-in]">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{event.species_common_name}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: STATUS_COLORS[event.conservation_status] || STATUS_COLORS.unknown }}
                    >
                      {event.conservation_status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {event.site_name} · {event.source_type === "image" ? "📷" : "🔊"}{" "}
                    {(event.confidence_score * 100).toFixed(0)}% confidence · {timeAgo(event.detected_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
