from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings


@dataclass(frozen=True)
class TokenPayload:
    sub: UUID
    role: str | None = None
    email: str | None = None


def decode_supabase_jwt(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación inválido o expirado",
        ) from exc

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sin identificador de usuario",
        )

    try:
        user_id = UUID(sub)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identificador de usuario inválido",
        ) from exc

    return TokenPayload(
        sub=user_id,
        role=payload.get("role"),
        email=payload.get("email"),
    )
