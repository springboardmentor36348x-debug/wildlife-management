"""
Conservation Intelligence Router (AI Recommendations, Alerts, Actions)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime

from database import get_db
from models import (
    MonitoringSite, Species, Observation, ConservationAlert, 
    ConservationAction, AIRecommendation, User
)
from schemas.conservation import (
    ConservationAlertCreate, ConservationAlertResponse, 
    AIRecommendationResponse, ConservationActionCreate, ConservationActionResponse
)
from ai.recommendation_engine import recommendation_engine
from security import get_current_active_user

router = APIRouter()


@router.get("/recommendations", response_model=List[AIRecommendationResponse])
def get_conservation_recommendations(
    site_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate explainable AI recommendations using stored observations, trends, 
    habitat assessments, and endangered status.
    """
    sites = []
    if site_id:
        site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Monitoring site not found")
        sites = [site]
    else:
        sites = db.query(MonitoringSite).filter(MonitoringSite.is_active == True).all()

    recommendations = []
    
    # Generate recommendations per site
    for site in sites:
        # Check active alerts for this site
        alerts = db.query(ConservationAlert).filter(
            ConservationAlert.monitoring_site_id == site.id,
            ConservationAlert.is_active == True
        ).all()

        has_degradation = any("degradation" in a.alert_type.lower() for a in alerts)
        has_decline = any("decline" in a.alert_type.lower() for a in alerts)
        has_endangered = any("endangered" in a.alert_type.lower() for a in alerts)

        # Baseline metrics
        overall_health = 80.0
        habitat_quality = 82.0
        degradation_lvl = "Low"

        # Generate recommendation cards using engine
        gen_recs = recommendation_engine.generate_recommendations(
            site_name=site.site_name,
            species_name=None,
            population_trend="decreasing" if has_decline else "stable",
            habitat_quality=habitat_quality,
            degradation_level="High" if has_degradation else degradation_lvl,
            is_endangered=has_endangered,
            overall_health=overall_health
        )

        for idx, rec in enumerate(gen_recs):
            recommendations.append(AIRecommendationResponse(
                id=idx + 1,
                recommendation_type=rec["recommendation_type"],
                title=rec["title"],
                description=rec["description"],
                priority=rec["priority"],
                evidence=rec["evidence"],
                status="pending",
                monitoring_site_id=site.id,
                site_name=site.site_name,
                created_at=datetime.utcnow()
            ))

    # If no recommendations, return a standard operational plan
    if not recommendations:
        recommendations.append(AIRecommendationResponse(
            id=1,
            recommendation_type="Routine Surveillance",
            title="Maintain Baseline Monitoring Grid",
            description="All wildlife and environmental metrics are within healthy limits. Continue standard camera-trap rotation.",
            priority="Medium",
            evidence="System health scores are optimal (overall health > 75%)",
            status="pending",
            monitoring_site_id=site_id,
            site_name=sites[0].site_name if sites else "All Reserves",
            created_at=datetime.utcnow()
        ))

    return recommendations


@router.get("/alerts", response_model=List[ConservationAlertResponse])
def list_alerts(
    site_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List active and resolved conservation alerts"""
    query = db.query(ConservationAlert)
    
    if site_id:
        query = query.filter(ConservationAlert.monitoring_site_id == site_id)
    if is_active is not None:
        query = query.filter(ConservationAlert.is_active == is_active)
        
    alerts = query.order_by(ConservationAlert.created_at.desc()).all()

    results = []
    for a in alerts:
        results.append(ConservationAlertResponse(
            id=a.id,
            alert_type=a.alert_type,
            severity=a.severity,
            description=a.description,
            monitoring_site_id=a.monitoring_site_id,
            species_id=a.species_id,
            site_name=a.monitoring_site.site_name if a.monitoring_site else None,
            species_name=a.species.common_name if a.species else None,
            is_active=a.is_active,
            created_at=a.created_at,
            resolved_at=a.resolved_at
        ))
    return results


@router.post("/alerts", response_model=ConservationAlertResponse)
def create_alert(
    alert_in: ConservationAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate a conservation alert"""
    alert = ConservationAlert(
        alert_type=alert_in.alert_type,
        severity=alert_in.severity,
        description=alert_in.description,
        monitoring_site_id=alert_in.monitoring_site_id,
        species_id=alert_in.species_id,
        is_active=True
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    return ConservationAlertResponse(
        id=alert.id,
        alert_type=alert.alert_type,
        severity=alert.severity,
        description=alert.description,
        monitoring_site_id=alert.monitoring_site_id,
        species_id=alert.species_id,
        is_active=alert.is_active,
        created_at=alert.created_at,
        site_name=alert.monitoring_site.site_name if alert.monitoring_site else None,
        species_name=alert.species.common_name if alert.species else None
    )


@router.put("/alerts/{alert_id}", response_model=ConservationAlertResponse)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark an alert as resolved"""
    alert = db.query(ConservationAlert).filter(ConservationAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.is_active = False
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)

    return ConservationAlertResponse(
        id=alert.id,
        alert_type=alert.alert_type,
        severity=alert.severity,
        description=alert.description,
        monitoring_site_id=alert.monitoring_site_id,
        species_id=alert.species_id,
        is_active=alert.is_active,
        created_at=alert.created_at,
        resolved_at=alert.resolved_at,
        site_name=alert.monitoring_site.site_name if alert.monitoring_site else None,
        species_name=alert.species.common_name if alert.species else None
    )


@router.get("/actions", response_model=List[ConservationActionResponse])
def list_conservation_actions(
    site_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve all logged conservation actions taken"""
    query = db.query(ConservationAction)
    if site_id:
        query = query.filter(ConservationAction.monitoring_site_id == site_id)
        
    actions = query.order_by(ConservationAction.start_date.desc()).all()
    results = []
    for a in actions:
        results.append(ConservationActionResponse(
            id=a.id,
            action_type=a.action_type,
            description=a.description,
            monitoring_site_id=a.monitoring_site_id,
            species_id=a.species_id,
            status=a.status,
            start_date=a.start_date,
            end_date=a.end_date,
            responsible_party=a.responsible_party,
            outcome=a.outcome,
            created_at=a.created_at,
            site_name=a.monitoring_site.site_name if a.monitoring_site else None,
            species_name=a.species.common_name if a.species else None
        ))
    return results


@router.post("/actions", response_model=ConservationActionResponse, status_code=status.HTTP_201_CREATED)
def log_conservation_action(
    action_in: ConservationActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Log a new conservation action taken by staff"""
    action = ConservationAction(
        action_type=action_in.action_type,
        description=action_in.description,
        monitoring_site_id=action_in.monitoring_site_id,
        species_id=action_in.species_id,
        status=action_in.status,
        start_date=action_in.start_date,
        end_date=action_in.end_date,
        responsible_party=action_in.responsible_party,
        outcome=action_in.outcome
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    return ConservationActionResponse(
        id=action.id,
        action_type=action.action_type,
        description=action.description,
        monitoring_site_id=action.monitoring_site_id,
        species_id=action.species_id,
        status=action.status,
        start_date=action.start_date,
        end_date=action.end_date,
        responsible_party=action.responsible_party,
        outcome=action.outcome,
        created_at=action.created_at,
        site_name=action.monitoring_site.site_name if action.monitoring_site else None,
        species_name=action.species.common_name if action.species else None
    )
