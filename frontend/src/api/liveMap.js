import client from "./client";

const WS_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/^http/, "ws");

export const getLiveMapSnapshot = (hours = 24) =>
  client.get("/api/v1/live-map/snapshot", { params: { hours } });

/**
 * Opens a WebSocket connection to the live detection feed.
 * onMessage receives a parsed { type: "new_detection", ... } object per event.
 * Returns the WebSocket instance so the caller can close() it on unmount.
 */
export function connectLiveMapSocket(onMessage, onOpen, onClose) {
  const token = localStorage.getItem("wpi_access_token");
  const socket = new WebSocket(`${WS_BASE_URL}/api/v1/live-map/ws?token=${encodeURIComponent(token || "")}`);

  socket.onopen = () => onOpen && onOpen();
  socket.onclose = () => onClose && onClose();
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      // ignore malformed messages
    }
  };

  return socket;
}
