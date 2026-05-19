from fastapi import APIRouter

from app.core.deps import CurrentProfile, DbSessionRls
from app.domains.auth import services
from app.domains.auth.schemas import ProfileRead, ProfileUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=ProfileRead)
def get_me(profile: CurrentProfile) -> ProfileRead:
    return ProfileRead.model_validate(profile)


@router.patch("/me", response_model=ProfileRead)
def patch_me(
    body: ProfileUpdate,
    db: DbSessionRls,
    profile: CurrentProfile,
) -> ProfileRead:
    updated = services.update_profile(db, profile, body)
    return ProfileRead.model_validate(updated)
