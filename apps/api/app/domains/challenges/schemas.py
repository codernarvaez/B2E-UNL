from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domains.challenges.models import ChallengeStatus


class EnvironmentalImpact(BaseModel):
    summary: str = Field(..., min_length=10)
    expected_metric: str = Field(..., min_length=1)
    metric_unit: str = Field(..., min_length=1)
    privacy_mode: Literal["original", "pseudonymized", "anonymous"] = "pseudonymized"
    baseline_situation: str | None = Field(
        None,
        min_length=10,
        max_length=3000,
        description="Línea base o situación actual",
    )
    success_criteria: str | None = Field(
        None,
        min_length=10,
        max_length=3000,
        description="Criterios de éxito medibles",
    )
    technical_scope: str | None = Field(
        None,
        min_length=10,
        max_length=3000,
        description="Alcance técnico y entregables esperados",
    )


class SustainabilityCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name_es: str
    description_es: str | None


class ChallengeCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20)
    environmental_impact: EnvironmentalImpact
    category_ids: list[UUID] = Field(..., min_length=1)
    privacy_mode: Literal["original", "pseudonymized", "anonymous"] = "pseudonymized"
    deadline: date | None = None


class ChallengeUpdate(BaseModel):
    title: str | None = Field(None, min_length=5, max_length=200)
    description: str | None = Field(None, min_length=20)
    environmental_impact: EnvironmentalImpact | None = None
    category_ids: list[UUID] | None = None
    privacy_mode: Literal["original", "pseudonymized", "anonymous"] | None = None
    deadline: date | None = None


class ChallengeStatusUpdate(BaseModel):
    status: ChallengeStatus


class ChallengeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    public_display_name: str | None = None
    title: str
    description: str
    status: ChallengeStatus
    environmental_impact: dict[str, Any]
    privacy_mode: str = "pseudonymized"
    deadline: date | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    categories: list[SustainabilityCategoryRead] = []


class ChallengePublicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID | None = None
    public_display_name: str | None = None
    title: str
    description: str
    status: ChallengeStatus
    environmental_impact: dict[str, Any]
    privacy_mode: str = "pseudonymized"
    deadline: date | None
    published_at: datetime | None
    categories: list[SustainabilityCategoryRead] = []


class RequirementSuggestion(BaseModel):
    """AI suggestion to improve a challenge requirement."""
    title: str | None = None
    description: str | None = None
    impact_summary: str | None = None
    rationale: str = ""


class RequirementImprovementRequest(BaseModel):
    """Request for AI-based requirement improvement suggestions."""
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20)
    impact_summary: str = Field(..., min_length=10)
    expected_metric: str = Field(..., min_length=1)
    metric_unit: str = Field(..., min_length=1)
    baseline_situation: str | None = None
    success_criteria: str | None = None
    technical_scope: str | None = None


class RequirementImprovementResponse(BaseModel):
    """Response with AI suggestions for requirement improvement."""
    suggestion: RequirementSuggestion | None = None
    message: str = ""
