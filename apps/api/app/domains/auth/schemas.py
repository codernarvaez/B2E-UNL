from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domains.auth.models import UserRole


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: UserRole
    full_name: str
    organization_name: str | None
    tax_id: str | None = None
    phone: str | None = None
    address: str | None = None
    website: str | None = None
    business_sector: str | None = None
    contact_email: str | None = None
    bio: str | None
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    organization_name: str | None = None
    tax_id: str | None = None
    phone: str | None = None
    address: str | None = None
    website: str | None = None
    business_sector: str | None = None
    contact_email: str | None = None
    bio: str | None = None
