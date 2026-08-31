from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.survey import Survey
from app.schemas.survey import SurveyCreate, SurveyResponse
from app.api.deps import get_current_user
from app.models.user import User
from app.core.permissions import require_role

router = APIRouter(prefix="/surveys", tags=["Survey Management"])


# ✅ CREATE (Researcher + Admin only)
@router.post("/", response_model=SurveyResponse)
def create_survey(
    survey_data: SurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["wildlife_researcher", "administrator"]))
):
    new_survey = Survey(
        **survey_data.dict(),
        created_by=current_user.id
    )

    db.add(new_survey)
    db.commit()
    db.refresh(new_survey)

    return new_survey


# ✅ LIST
@router.get("/", response_model=list[SurveyResponse])
def list_surveys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["administrator", "conservation_officer", "forest_officer"]:
        return db.query(Survey).all()

    return db.query(Survey).filter(
        Survey.created_by == current_user.id
    ).all()


# ✅ UPDATE
@router.put("/{survey_id}", response_model=SurveyResponse)
def update_survey(
    survey_id: str,
    survey_data: SurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["administrator", "wildlife_researcher"]))
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()

    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    survey.survey_code = survey_data.survey_code
    survey.title = survey_data.title
    survey.habitat_type = survey_data.habitat_type
    survey.protected_area = survey_data.protected_area
    survey.survey_date = survey_data.survey_date

    db.commit()
    db.refresh(survey)

    return survey

# ✅ DELETE
@router.delete("/{survey_id}")
def delete_survey(
    survey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["administrator", "wildlife_researcher"]))
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()

    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    if current_user.role != "administrator" and survey.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(survey)
    db.commit()

    return {"message": "Survey deleted successfully ✅"}