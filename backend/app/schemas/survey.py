from pydantic import BaseModel
from datetime import date


class SurveyCreate(BaseModel):
    survey_code: str
    title: str
    habitat_type: str
    protected_area: str | None = None
    survey_date: date


class SurveyResponse(BaseModel):
    id: str
    survey_code: str
    title: str
    habitat_type: str
    protected_area: str | None
    survey_date: date

    class Config:
        from_attributes = True