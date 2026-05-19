from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session, selectinload

from app.domains.auth.models import Profile, UserRole
from app.domains.challenges.models import (
    Challenge,
    ChallengeCategory,
    ChallengeStatus,
    SustainabilityCategory,
)
from app.domains.challenges.schemas import ChallengeCreate, ChallengeStatusUpdate, ChallengeUpdate

ALLOWED_TRANSITIONS: dict[ChallengeStatus, set[ChallengeStatus]] = {
    ChallengeStatus.open: {ChallengeStatus.under_review, ChallengeStatus.closed},
    ChallengeStatus.under_review: {
        ChallengeStatus.in_development,
        ChallengeStatus.open,
        ChallengeStatus.closed,
    },
    ChallengeStatus.in_development: {ChallengeStatus.closed, ChallengeStatus.under_review},
    ChallengeStatus.closed: set(),
}


def _load_challenge(db: Session, challenge_id: UUID) -> Challenge | None:
    return db.scalar(
        select(Challenge)
        .where(Challenge.id == challenge_id)
        .options(selectinload(Challenge.category_links).selectinload(ChallengeCategory.category))
    )


def _set_categories(db: Session, challenge: Challenge, category_ids: list[UUID]) -> None:
    categories = db.scalars(
        select(SustainabilityCategory).where(SustainabilityCategory.id.in_(category_ids))
    ).all()
    if len(categories) != len(set(category_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Una o más categorías de sustentabilidad no existen",
        )
    challenge.category_links.clear()
    for cat in categories:
        challenge.category_links.append(ChallengeCategory(category_id=cat.id))


def challenge_to_read(challenge: Challenge) -> dict:
    categories = [link.category for link in challenge.category_links if link.category is not None]
    data = {
        "id": challenge.id,
        "company_id": challenge.company_id,
        "title": challenge.title,
        "description": challenge.description,
        "status": challenge.status,
        "environmental_impact": challenge.environmental_impact,
        "deadline": challenge.deadline,
        "published_at": challenge.published_at,
        "created_at": challenge.created_at,
        "updated_at": challenge.updated_at,
        "categories": categories,
    }
    return data


def list_public_challenges(db: Session) -> list[Challenge]:
    return list(
        db.scalars(
            select(Challenge)
            .where(
                Challenge.status == ChallengeStatus.open,
                Challenge.published_at.isnot(None),
            )
            .options(
                selectinload(Challenge.category_links).selectinload(ChallengeCategory.category)
            )
            .order_by(Challenge.published_at.desc())
        ).all()
    )


def list_company_challenges(db: Session, company_id: UUID) -> list[Challenge]:
    return list(
        db.scalars(
            select(Challenge)
            .where(Challenge.company_id == company_id)
            .options(
                selectinload(Challenge.category_links).selectinload(ChallengeCategory.category)
            )
            .order_by(Challenge.created_at.desc())
        ).all()
    )


def create_challenge(db: Session, profile: Profile, data: ChallengeCreate) -> Challenge:
    if profile.role != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo las empresas pueden publicar retos",
        )

    db.execute(text("SET CONSTRAINTS ALL DEFERRED"))

    challenge = Challenge(
        company_id=profile.id,
        title=data.title,
        description=data.description,
        environmental_impact=data.environmental_impact.model_dump(),
        deadline=data.deadline,
        status=ChallengeStatus.open,
    )
    db.add(challenge)
    db.flush()
    _set_categories(db, challenge, data.category_ids)
    db.commit()
    db.refresh(challenge)
    return _load_challenge(db, challenge.id)  # type: ignore[return-value]


def update_challenge(
    db: Session,
    profile: Profile,
    challenge_id: UUID,
    data: ChallengeUpdate,
) -> Challenge:
    challenge = _load_challenge(db, challenge_id)
    if challenge is None or challenge.company_id != profile.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reto no encontrado")

    if data.title is not None:
        challenge.title = data.title
    if data.description is not None:
        challenge.description = data.description
    if data.environmental_impact is not None:
        challenge.environmental_impact = data.environmental_impact.model_dump()
    if data.deadline is not None:
        challenge.deadline = data.deadline
    if data.category_ids is not None:
        _set_categories(db, challenge, data.category_ids)

    db.commit()
    return _load_challenge(db, challenge_id)  # type: ignore[return-value]


def publish_challenge(db: Session, profile: Profile, challenge_id: UUID) -> Challenge:
    challenge = _load_challenge(db, challenge_id)
    if challenge is None or challenge.company_id != profile.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reto no encontrado")

    challenge.published_at = datetime.now(UTC)
    challenge.status = ChallengeStatus.open
    db.commit()
    return _load_challenge(db, challenge_id)  # type: ignore[return-value]


def transition_status(
    db: Session,
    profile: Profile,
    challenge_id: UUID,
    data: ChallengeStatusUpdate,
) -> Challenge:
    challenge = _load_challenge(db, challenge_id)
    if challenge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reto no encontrado")

    if profile.role == UserRole.company and challenge.company_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sin permiso sobre este reto",
        )
    if profile.role not in (UserRole.company, UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sin permiso para cambiar estado",
        )

    allowed = ALLOWED_TRANSITIONS.get(challenge.status, set())
    if data.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transición no permitida de {challenge.status.value} a {data.status.value}",
        )

    challenge.status = data.status
    db.commit()
    return _load_challenge(db, challenge_id)  # type: ignore[return-value]


def get_challenge(db: Session, challenge_id: UUID) -> Challenge:
    challenge = _load_challenge(db, challenge_id)
    if challenge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reto no encontrado")
    return challenge


def list_categories(db: Session) -> list[SustainabilityCategory]:
    stmt = select(SustainabilityCategory).order_by(SustainabilityCategory.name_es)
    return list(db.scalars(stmt).all())
