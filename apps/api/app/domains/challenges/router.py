from uuid import UUID

from fastapi import APIRouter

from app.core.deps import CurrentProfile, DbSession, DbSessionRls
from app.domains.challenges import services
from app.domains.challenges.schemas import (
    ChallengeCreate,
    ChallengePublicRead,
    ChallengeRead,
    ChallengeStatusUpdate,
    ChallengeUpdate,
    SustainabilityCategoryRead,
)

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("/categories", response_model=list[SustainabilityCategoryRead])
def get_categories(db: DbSession) -> list[SustainabilityCategoryRead]:
    cats = services.list_categories(db)
    return [SustainabilityCategoryRead.model_validate(c) for c in cats]


@router.get("/public", response_model=list[ChallengePublicRead])
def list_public(db: DbSession) -> list[ChallengePublicRead]:
    challenges = services.list_public_challenges(db)
    return [
        ChallengePublicRead.model_validate(services.challenge_to_read(c))
        for c in challenges
    ]


@router.get("/public/{challenge_id}", response_model=ChallengePublicRead)
def get_public(challenge_id: UUID, db: DbSession) -> ChallengePublicRead:
    challenge = services.get_challenge(db, challenge_id)
    if challenge.published_at is None or challenge.status.value != "open":
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reto no disponible")
    return ChallengePublicRead.model_validate(services.challenge_to_read(challenge))


@router.get("/mine", response_model=list[ChallengeRead])
def list_mine(db: DbSessionRls, profile: CurrentProfile) -> list[ChallengeRead]:
    challenges = services.list_company_challenges(db, profile.id)
    return [ChallengeRead.model_validate(services.challenge_to_read(c)) for c in challenges]


@router.post("", response_model=ChallengeRead, status_code=201)
def create_challenge(
    body: ChallengeCreate,
    db: DbSessionRls,
    profile: CurrentProfile,
) -> ChallengeRead:
    challenge = services.create_challenge(db, profile, body)
    return ChallengeRead.model_validate(services.challenge_to_read(challenge))


@router.get("/{challenge_id}", response_model=ChallengeRead)
def get_challenge(
    challenge_id: UUID,
    db: DbSessionRls,
    profile: CurrentProfile,
) -> ChallengeRead:
    challenge = services.get_challenge(db, challenge_id)
    return ChallengeRead.model_validate(services.challenge_to_read(challenge))


@router.patch("/{challenge_id}", response_model=ChallengeRead)
def update_challenge(
    challenge_id: UUID,
    body: ChallengeUpdate,
    db: DbSessionRls,
    profile: CurrentProfile,
) -> ChallengeRead:
    challenge = services.update_challenge(db, profile, challenge_id, body)
    return ChallengeRead.model_validate(services.challenge_to_read(challenge))


@router.post("/{challenge_id}/publish", response_model=ChallengeRead)
def publish_challenge(
    challenge_id: UUID,
    db: DbSessionRls,
    profile: CurrentProfile,
) -> ChallengeRead:
    challenge = services.publish_challenge(db, profile, challenge_id)
    return ChallengeRead.model_validate(services.challenge_to_read(challenge))


@router.patch("/{challenge_id}/status", response_model=ChallengeRead)
def update_status(
    challenge_id: UUID,
    body: ChallengeStatusUpdate,
    db: DbSessionRls,
    profile: CurrentProfile,
) -> ChallengeRead:
    challenge = services.transition_status(db, profile, challenge_id, body)
    return ChallengeRead.model_validate(services.challenge_to_read(challenge))
