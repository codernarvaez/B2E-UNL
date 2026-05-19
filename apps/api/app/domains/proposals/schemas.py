from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domains.proposals.models import ProposalStatus


class ProposalCreate(BaseModel):
    challenge_id: UUID
    title: str = Field(..., min_length=5, max_length=200)
    approach: str = Field(..., min_length=20)
    sustainability_alignment: str = Field(..., min_length=20)


class ProposalUpdate(BaseModel):
    title: str | None = Field(None, min_length=5, max_length=200)
    approach: str | None = Field(None, min_length=20)
    sustainability_alignment: str | None = Field(None, min_length=20)


class ProposalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    challenge_id: UUID
    academic_id: UUID
    title: str
    approach: str
    sustainability_alignment: str
    status: ProposalStatus
    submitted_at: datetime | None
    created_at: datetime
    updated_at: datetime
