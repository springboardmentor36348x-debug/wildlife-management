from sqlalchemy.orm import Session
from app.models.detection import Detection


def get_detection_history(db: Session):
    return (
        db.query(Detection)
        .order_by(Detection.detected_at.desc())
        .all()
    )