from sqlalchemy.orm import Session
from app.models.detection import Detection


def get_report(db: Session):

    detections = (
        db.query(Detection)
        .order_by(Detection.detected_at.desc())
        .all()
    )

    report = []

    for item in detections:

        report.append(
            {
                "image": item.image_name,
                "animal": item.animal,
                "confidence": item.confidence,
                "date": item.detected_at
            }
        )

    return report