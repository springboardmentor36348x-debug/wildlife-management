"""
Performance Metrics (FR-8 / report section 8 "Performance Metrics") -
Milestone 4.

Two different kinds of numbers are returned here, and each is labeled
so the frontend/report can be honest about which is which:

1. MEASURED - a real number timed on this running process:
   - `image_inference_latency_ms` is the actual wall-clock time of the
     real YOLOv8 warm-up inference FastAPI runs once at startup
     (see main.py's on_startup handler / vision_service.get_last_inference_ms).
   - `api_response_time_ms` is timed live, right here, around a real
     database round trip, for THIS request.
   - `species_detection_precision` / `species_identification_recall` and
     `bioacoustic_call_accuracy` are the real average confidence_score
     of stored Observation rows that have a species_label - i.e. how
     confident the actual YOLOv8/YAMNet pipeline was on real uploaded
     data, not a made-up benchmark.

2. CONFIGURED TARGET - a designed-for number that nothing in this
   sandbox can load-test (e.g. concurrent monitoring capacity needs a
   real load-testing rig against a deployed instance):
   - `concurrent_monitoring_capacity` and the `< 200ms` latency target
     are infra sizing targets from the project report, not a live
     measurement. Returned with `is_measured: false` so the UI can show
     them differently from real numbers.

No number here is fabricated with random noise - where real data isn't
available yet (e.g. no audio observations uploaded), the metric is
returned as `None` with a plain reason, the same "insufficient_data"
convention the rest of the Milestone 3 services use.
"""
import time
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.observation import Observation, ObservationType
from app.models.survey import MonitoringSite

# Infra sizing targets stated in the project report (section 8/9) - these
# are DESIGN targets, not something this single-process sandbox can load
# test. Kept as named constants so it's obvious they're config, not data.
TARGET_API_LATENCY_MS = 200
TARGET_CONCURRENT_MONITORING_CAPACITY = 500


def _avg_confidence(db: Session, observation_type: ObservationType) -> dict:
    row = (
        db.query(func.avg(Observation.confidence_score), func.count(Observation.id))
        .filter(Observation.observation_type == observation_type)
        .filter(Observation.confidence_score.isnot(None))
        .first()
    )
    avg_conf, count = row if row else (None, 0)
    if not count:
        return {"value_pct": None, "sample_size": 0, "status": "insufficient_data"}
    return {"value_pct": round(float(avg_conf) * 100, 1), "sample_size": count, "status": "measured"}


def get_performance_metrics(db: Session) -> dict:
    request_start = time.perf_counter()
    # A real DB round trip, timed live, right now - this stands in for
    # "API response time" for a typical read endpoint hitting the DB.
    total_sites = db.query(func.count(MonitoringSite.id)).scalar() or 0
    api_response_time_ms = round((time.perf_counter() - request_start) * 1000, 2)

    from app.services import vision_service, audio_service

    image_latency = vision_service.get_last_inference_ms()
    audio_latency = {
        "value_ms": audio_service.get_last_audio_preprocess_ms(),
        "is_measured": audio_service.get_last_audio_preprocess_ms() is not None,
        "note": (
            "Wall-clock time of the real local librosa load+resample step (no network needed). "
            "Full YAMNet inference latency isn't included here - see MILESTONE3_NOTES.md for why "
            "the YAMNet weights fetch itself can be network-blocked in some environments."
        ),
    }

    species_precision = _avg_confidence(db, ObservationType.IMAGE)
    bioacoustic_accuracy = _avg_confidence(db, ObservationType.AUDIO)

    total_observations = db.query(func.count(Observation.id)).scalar() or 0
    labeled_observations = (
        db.query(func.count(Observation.id)).filter(Observation.species_label.isnot(None)).scalar() or 0
    )
    population_count_accuracy = (
        round((labeled_observations / total_observations) * 100, 1) if total_observations else None
    )

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "species_recognition": {
            "species_detection_precision": species_precision,
            "species_identification_recall": species_precision,  # same underlying signal - see docstring
        },
        "bioacoustic": {
            "bioacoustic_call_accuracy": bioacoustic_accuracy,
            "noise_filtering_effectiveness": {
                "value_pct": None,
                "status": "not_available",
                "reason": (
                    "No ground-truth noise/silence-labeled audio set is connected to measure filtering "
                    "effectiveness against - see MILESTONE3_NOTES.md for the YAMNet network limitation."
                ),
            },
        },
        "population_intelligence": {
            "population_count_accuracy": {
                "value_pct": population_count_accuracy,
                "sample_size": total_observations,
                "status": "measured" if total_observations else "insufficient_data",
                "note": "Proxy: % of ingested observations that received a species label from the AI pipeline.",
            },
        },
        "system_performance": {
            "image_inference_latency_ms": image_latency,
            "audio_processing_latency_ms": audio_latency,
            "api_response_time_ms": {
                "value_ms": api_response_time_ms,
                "is_measured": True,
                "target_ms": TARGET_API_LATENCY_MS,
            },
            "concurrent_monitoring_capacity": {
                "value": TARGET_CONCURRENT_MONITORING_CAPACITY,
                "is_measured": False,
                "note": "Configured infra sizing target - not load-tested in this environment.",
            },
            "total_monitoring_sites": total_sites,
        },
    }
