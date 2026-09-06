"""
Live Wildlife Monitoring Feed (Milestone 4).

A minimal in-process WebSocket broadcast hub: whenever the Image Analysis
Engine or Bioacoustic Recognition Engine produces a new species detection,
the upload router calls `broadcast_detection()` here, which pushes the
event to every currently-connected WebSocket client. The frontend's live
map subscribes to this and plots new sightings as they arrive, without
polling.

HONEST LIMITATION: this is an in-memory, single-process connection
manager - fine for a single-instance deployment (which is what this
project targets), but it would need a message broker (Redis pub/sub,
etc.) to fan out across multiple backend processes/replicas in a real
horizontally-scaled production deployment. That's a documented, deliberate
scope boundary for a student/demo-scale project, not an oversight.
"""
from __future__ import annotations

import json
from typing import List

from fastapi import WebSocket


class LiveFeedManager:
    def __init__(self) -> None:
        self._connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self._connections:
            self._connections.remove(websocket)

    async def broadcast(self, payload: dict) -> None:
        """Sends payload (as JSON) to every connected client. Silently drops
        connections that have gone stale rather than raising, since a
        broken client shouldn't break the upload request that triggered
        this broadcast."""
        message = json.dumps(payload, default=str)
        dead_connections = []
        for connection in self._connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead)


# Single shared instance for the whole app process (see module docstring
# for why this doesn't scale across multiple processes/replicas).
live_feed_manager = LiveFeedManager()


async def broadcast_detection(
    monitoring_site_id: str,
    site_name: str,
    latitude: float,
    longitude: float,
    species_common_name: str,
    conservation_status: str,
    confidence_score: float,
    source_type: str,
    detected_at: str,
) -> None:
    """Called by the image/audio upload routers after a successful detection."""
    await live_feed_manager.broadcast({
        "type": "new_detection",
        "monitoring_site_id": monitoring_site_id,
        "site_name": site_name,
        "latitude": latitude,
        "longitude": longitude,
        "species_common_name": species_common_name,
        "conservation_status": conservation_status,
        "confidence_score": confidence_score,
        "source_type": source_type,
        "detected_at": detected_at,
    })
