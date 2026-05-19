from sqlalchemy.orm import Session

from app.domains.auth.models import Profile
from app.domains.auth.schemas import ProfileUpdate


def update_profile(db: Session, profile: Profile, data: ProfileUpdate) -> Profile:
    if data.full_name is not None:
        profile.full_name = data.full_name
    if data.organization_name is not None:
        profile.organization_name = data.organization_name
    if data.tax_id is not None:
        profile.tax_id = data.tax_id
    if data.phone is not None:
        profile.phone = data.phone
    if data.address is not None:
        profile.address = data.address
    if data.website is not None:
        profile.website = data.website
    if data.business_sector is not None:
        profile.business_sector = data.business_sector
    if data.contact_email is not None:
        profile.contact_email = data.contact_email
    if data.bio is not None:
        profile.bio = data.bio
    db.commit()
    db.refresh(profile)
    return profile
