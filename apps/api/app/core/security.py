from dataclasses import dataclass
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings

_PLACEHOLDER_JWT_SECRETS = frozenset(
    {
        "CHANGE_ME",
        "your-jwt-secret",
        "super-secret-jwt-token-with-at-least-32-characters-long",
    }
)


@dataclass(frozen=True)
class TokenPayload:
    sub: UUID
    role: str | None = None
    email: str | None = None


def is_jwt_secret_configured() -> bool:
    secret = settings.supabase_jwt_secret.strip()
    return len(secret) >= 16 and secret not in _PLACEHOLDER_JWT_SECRETS


def _decode_jwt_local(token: str) -> TokenPayload:
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

    return _payload_from_claims(payload)


def _payload_from_claims(payload: dict) -> TokenPayload:
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sin identificador de usuario",
        )

    try:
        user_id = UUID(str(sub))
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


def _verify_jwt_via_supabase_auth(token: str) -> TokenPayload:
    """Fallback dev: valida el Bearer contra Supabase Auth cuando falta JWT_SECRET."""
    anon_key = settings.supabase_anon_key.strip()
    if not anon_key or anon_key == "your-anon-key":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "La API no puede validar sesiones: configura SUPABASE_JWT_SECRET "
                "(Dashboard → Settings → API → JWT Secret) o SUPABASE_ANON_KEY en .env"
            ),
        )

    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/user"
    try:
        with httpx.Client(timeout=12.0) as client:
            response = client.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": anon_key,
                },
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo contactar a Supabase Auth para validar el token",
        ) from exc

    if response.status_code in (
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación inválido o expirado",
        )

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Supabase Auth respondió HTTP {response.status_code}",
        )

    user = response.json()
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Respuesta de Supabase Auth sin identificador de usuario",
        )

    return TokenPayload(
        sub=UUID(str(user_id)),
        role=user.get("role"),
        email=user.get("email"),
    )


def decode_supabase_jwt(token: str) -> TokenPayload:
    if is_jwt_secret_configured():
        return _decode_jwt_local(token)
    return _verify_jwt_via_supabase_auth(token)
