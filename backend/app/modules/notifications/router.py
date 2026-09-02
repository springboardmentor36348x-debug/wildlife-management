from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import logging
import hashlib

from app.core.deps import get_db, get_current_user
from app.modules.users.models import User
from app.modules.conservation.router import recommendations

router = APIRouter(prefix="/notifications", tags=["notifications"])
logger = logging.getLogger(__name__)

# In-memory persistence for demo (avoids Alembic migrations for Milestone 4)
SENT_ALERTS = set()
PERSISTED_ALERTS = []

def send_email_alert(subject: str, body: str, recipient: str):
    logger.info(f"EMAIL DISPATCH STUB: To: {recipient} | Subject: {subject} | Body: {body}")
    logger.info("(Note: SMTP is not configured. This is a dispatcher stub demonstrating functionality.)")

@router.get("/alerts")
def get_dashboard_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    global PERSISTED_ALERTS
    
    # In a production architecture, this scan would be a Celery task.
    # For demo purposes, we scan on fetch but deduplicate rigorously.
    recs_response = recommendations(site_id=None, db=db, current_user=current_user)
    
    new_alerts = []
    for site in recs_response.get("sites", []):
        for rec in site.get("recommendations", []):
            if rec["priority"] == "high":
                # Create a unique signature for this alert
                sig = hashlib.md5(f"{site['site_id']}-{rec['title']}".encode()).hexdigest()
                
                alert = {
                    "id": sig,
                    "site_id": site["site_id"],
                    "location": site["location_name"],
                    "category": rec["category"],
                    "title": rec["title"],
                    "message": rec["rationale"],
                    "severity": "critical",
                    "requires_action": True,
                    "status": "active"
                }
                new_alerts.append(alert)
                
                if sig not in SENT_ALERTS:
                    send_email_alert(
                        subject=f"Wildlife Alert: {rec['title']}",
                        body=f"Site: {site['location_name']}\nDetails: {rec['rationale']}",
                        recipient=current_user.email
                    )
                    SENT_ALERTS.add(sig)
                    
    PERSISTED_ALERTS = new_alerts
    return {"alerts": PERSISTED_ALERTS, "note": "Alerts are based on observed detection trends and validated habitat metrics."}
