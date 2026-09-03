from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import decode_access_token
from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.survey import MonitoringSite
from app.models.observation import SpeciesObservation, MediaAsset
from app.services.live_feed import live_feed_manager

router = APIRouter(prefix="/api/v1/live-map", tags=["Live Wildlife Monitoring Map"])


@router.get("/snapshot")
def live_map_snapshot(
    hours: int = Query(24, ge=1, le=720, description="How far back to include sightings, in hours"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Initial map load: every monitoring site with GPS coordinates, plus its
    most recent sightings within the given time window. The frontend loads
    this once on page load, then subscribes to /api/v1/live-map/ws for
    real-time updates instead of re-polling this endpoint.
    """
    cutoff = datetime.utcnow() - timedelta(hours=hours)

    sites = db.query(MonitoringSite).all()

    results = []
    for site in sites:
        recent_observations = (
            db.query(SpeciesObservation)
            .join(MediaAsset)
            .filter(
                MediaAsset.monitoring_site_id == site.id,
                SpeciesObservation.detected_at >= cutoff,
            )
            .order_by(SpeciesObservation.detected_at.desc())
            .limit(20)
            .all()
        )

        results.append({
            "monitoring_site_id": site.id,
            "site_name": site.name,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "habitat_type": site.habitat_type.value,
            "recent_sighting_count": len(recent_observations),
            "recent_sightings": [
                {
                    "species_common_name": obs.species_common_name,
                    "conservation_status": obs.conservation_status.value,
                    "confidence_score": obs.confidence_score,
                    "source_type": obs.media_asset.source_type.value if obs.media_asset else "unknown",
                    "detected_at": obs.detected_at,
                }
                for obs in recent_observations
            ],
        })

    return {"window_hours": hours, "sites": results}


@router.websocket("/ws")
async def live_map_websocket(websocket: WebSocket, token: Optional[str] = Query(None)):
    """
    Real-time feed of new detections as they happen, for the live map to
    plot without polling. Authenticated via a `?token=<jwt>` query param
    since browser WebSocket clients can't set an Authorization header.

    Sends one JSON message per new detection:
        {"type": "new_detection", "monitoring_site_id": ..., "site_name": ...,
         "latitude": ..., "longitude": ..., "species_common_name": ...,
         "conservation_status": ..., "confidence_score": ...,
         "source_type": "image"|"audio", "detected_at": "..."}
    """
    if not token or decode_access_token(token) is None:
        await websocket.close(code=4401)  # custom close code: unauthorized
        return

    await live_feed_manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from the client, but need to keep
            # the receive loop alive to detect disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        live_feed_manager.disconnect(websocket)
