from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.auth.models import Profile, UserRole
from app.domains.challenges.models import Challenge, ChallengeStatus
from app.domains.proposals.models import Proposal, ProposalStatus
from app.domains.proposals.schemas import ProposalCreate, ProposalUpdate


def list_my_proposals(db: Session, academic_id: UUID) -> list[Proposal]:
    return list(
        db.scalars(
            select(Proposal)
            .where(Proposal.academic_id == academic_id)
            .order_by(Proposal.created_at.desc())
        ).all()
    )


def list_challenge_proposals(db: Session, challenge_id: UUID, company_id: UUID) -> list[Proposal]:
    challenge = db.scalar(select(Challenge).where(Challenge.id == challenge_id))
    if challenge is None or challenge.company_id != company_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reto no encontrado")
    return list(
        db.scalars(
            select(Proposal)
            .where(Proposal.challenge_id == challenge_id)
            .order_by(Proposal.submitted_at.desc().nullslast())
        ).all()
    )


def create_proposal(db: Session, profile: Profile, data: ProposalCreate) -> Proposal:
    if profile.role != UserRole.academic:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo perfiles académicos pueden enviar propuestas",
        )

    challenge = db.scalar(select(Challenge).where(Challenge.id == data.challenge_id))
    if challenge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reto no encontrado")
    if challenge.status != ChallengeStatus.open or challenge.published_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El reto no está abierto para propuestas",
        )

    existing = db.scalar(
        select(Proposal).where(
            Proposal.challenge_id == data.challenge_id,
            Proposal.academic_id == profile.id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una propuesta para este reto",
        )

    proposal = Proposal(
        challenge_id=data.challenge_id,
        academic_id=profile.id,
        title=data.title,
        approach=data.approach,
        sustainability_alignment=data.sustainability_alignment,
        status=ProposalStatus.draft,
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal


def update_proposal(
    db: Session,
    profile: Profile,
    proposal_id: UUID,
    data: ProposalUpdate,
) -> Proposal:
    proposal = db.scalar(
        select(Proposal).where(Proposal.id == proposal_id, Proposal.academic_id == profile.id)
    )
    if proposal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Propuesta no encontrada")
    if proposal.status != ProposalStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden editar propuestas en borrador",
        )

    if data.title is not None:
        proposal.title = data.title
    if data.approach is not None:
        proposal.approach = data.approach
    if data.sustainability_alignment is not None:
        proposal.sustainability_alignment = data.sustainability_alignment

    db.commit()
    db.refresh(proposal)
    return proposal


def submit_proposal(db: Session, profile: Profile, proposal_id: UUID) -> Proposal:
    proposal = db.scalar(
        select(Proposal).where(Proposal.id == proposal_id, Proposal.academic_id == profile.id)
    )
    if proposal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Propuesta no encontrada")
    if proposal.status != ProposalStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La propuesta ya fue enviada",
        )

    proposal.status = ProposalStatus.submitted
    proposal.submitted_at = datetime.now(UTC)
    db.commit()
    db.refresh(proposal)
    return proposal
