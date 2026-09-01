from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.detection import Detection


def get_analytics(db: Session):

    total = db.query(Detection).count()

    species = (
        db.query(
            Detection.animal,
            func.count(Detection.id).label("count")
        )
        .group_by(Detection.animal)
        .all()
    )

    # Convert SQLAlchemy rows into JSON
    species_list = []

    for animal, count in species:

        species_list.append(
            {
                "animal": animal,
                "count": count
            }
        )

    return {
        "total_detections": total,
        "species_count": species_list
    }