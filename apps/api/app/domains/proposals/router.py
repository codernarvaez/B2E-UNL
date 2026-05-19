from uuid import UUID

from fastapi import APIRouter

from app.core.deps import CurrentProfile, DbSessionRls
from app.domains.proposals import services
from app.domains.proposals.schemas import ProposalCreate, ProposalRead, ProposalUpdate

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.get("/mine", response_model=list[ProposalRead])
def list_mine(db: DbSessionRls, profile: CurrentProfile) -> list[ProposalRead]:
    proposals = services.list_my_proposals(db, profile.id)
    return [ProposalRead.model_validate(p) for p in proposals]


@router.get("/by-challenge/{challenge_id}", response_model=list[ProposalRead])
def list_for_challenge(
    challenge_id: UUID,
    db: DbSessionRls,
    profile: CurrentProfile,
) -> list[ProposalRead]:
    proposals = services.list_challenge_proposals(db, challenge_id, profile.id)
    return [ProposalRead.model_validate(p) for p in proposals]


@router.post("", response_model=ProposalRead, status_code=201)
def create_proposal(
    body: ProposalCreate,
    db: DbSessionRls,
    profile: CurrentProfile,
) -> ProposalRead:
    proposal = services.create_proposal(db, profile, body)
    return ProposalRead.model_validate(proposal)


@router.patch("/{proposal_id}", response_model=ProposalRead)
def update_proposal(
    proposal_id: UUID,
    body: ProposalUpdate,
    db: DbSessionRls,
    profile: CurrentProfile,
) -> ProposalRead:
    proposal = services.update_proposal(db, profile, proposal_id, body)
    return ProposalRead.model_validate(proposal)


@router.post("/{proposal_id}/submit", response_model=ProposalRead)
def submit_proposal(
    proposal_id: UUID,
    db: DbSessionRls,
    profile: CurrentProfile,
) -> ProposalRead:
    proposal = services.submit_proposal(db, profile, proposal_id)
    return ProposalRead.model_validate(proposal)
