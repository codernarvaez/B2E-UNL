from collections.abc import Generator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.security import TokenPayload, decode_supabase_jwt
from app.domains.auth.models import Profile

bearer_scheme = HTTPBearer(auto_error=False)


def get_optional_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> TokenPayload | None:
    if credentials is None:
        return None
    return decode_supabase_jwt(credentials.credentials)


def get_current_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> TokenPayload:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere autenticación",
        )
    return decode_supabase_jwt(credentials.credentials)


def get_db_with_rls(
    token: Annotated[TokenPayload, Depends(get_current_token)],
) -> Generator[Session, None, None]:
    """Database session with JWT claims set for Postgres RLS."""
    db = SessionLocal()
    try:
        db.execute(
            text("SELECT set_config('request.jwt.claim.sub', :sub, true)"),
            {"sub": str(token.sub)},
        )
        db.execute(
            text("SELECT set_config('request.jwt.claim.role', 'authenticated', true)"),
        )
        yield db
    finally:
        db.close()


DbSession = Annotated[Session, Depends(get_db)]
DbSessionRls = Annotated[Session, Depends(get_db_with_rls)]


def get_current_user_id(
    token: Annotated[TokenPayload, Depends(get_current_token)],
) -> UUID:
    return token.sub


CurrentUserId = Annotated[UUID, Depends(get_current_user_id)]


def get_current_profile(
    db: DbSessionRls,
    user_id: CurrentUserId,
) -> Profile:
    profile = db.scalar(select(Profile).where(Profile.id == user_id))
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado",
        )
    return profile


CurrentProfile = Annotated[Profile, Depends(get_current_profile)]
