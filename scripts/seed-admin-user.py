#!/usr/bin/env python3
"""Crea y confirma el usuario admin de prueba en Supabase Auth."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"

ADMIN_EMAIL = "admin@unl.edu.ec"
ADMIN_NAME = "Administrador UNL"


def get_admin_password() -> str:
    pwd = os.environ.get("ADMIN_PASSWORD", "").strip()
    if not pwd:
        pwd = load_env().get("ADMIN_PASSWORD", "").strip()
    if not pwd:
        print(
            "Define ADMIN_PASSWORD en .env o en el entorno (no se sube a GitHub).",
            file=sys.stderr,
        )
        sys.exit(1)
    return pwd


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    if not ENV_FILE.exists():
        return values
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        values[key.strip()] = val.strip()
    return values


def api_request(
    method: str,
    url: str,
    headers: dict[str, str],
    payload: dict | None = None,
) -> tuple[int, dict]:
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            body = {"message": raw}
        return exc.code, body


def confirm_with_service_role(base_url: str, service_role: str, email: str) -> bool:
    headers = {
        "apikey": service_role,
        "Authorization": f"Bearer {service_role}",
        "Content-Type": "application/json",
    }
    list_url = f"{base_url.rstrip('/')}/auth/v1/admin/users"
    status, body = api_request("GET", list_url, headers)
    if status != 200:
        return False

    users = body.get("users") or []
    user = next((u for u in users if (u.get("email") or "").lower() == email.lower()), None)
    if not user:
        return False

    user_id = user["id"]
    update_url = f"{base_url.rstrip('/')}/auth/v1/admin/users/{user_id}"
    status, _ = api_request(
        "PUT",
        update_url,
        headers,
        {"email_confirm": True},
    )
    return status == 200


def main() -> int:
    env = {**load_env(), **os.environ}
    base_url = env.get("PUBLIC_SUPABASE_URL") or env.get("SUPABASE_URL", "")
    anon_key = env.get("PUBLIC_SUPABASE_ANON_KEY") or env.get("SUPABASE_ANON_KEY", "")
    service_role = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not base_url or not anon_key:
        print("Faltan PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en .env", file=sys.stderr)
        return 1

    admin_password = get_admin_password()

    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
    }

    signup_url = f"{base_url.rstrip('/')}/auth/v1/signup"
    status, body = api_request(
        "POST",
        signup_url,
        headers,
        {
            "email": ADMIN_EMAIL,
            "password": admin_password,
            "data": {"full_name": ADMIN_NAME},
        },
    )

    if status not in (200, 201):
        msg = json.dumps(body)
        if "already" not in msg.lower():
            print(f"Error al registrar admin ({status}): {msg}", file=sys.stderr)
            return 1
        print(f"✓ El usuario {ADMIN_EMAIL} ya existe.")

    if service_role:
        if confirm_with_service_role(base_url, service_role, ADMIN_EMAIL):
            print("✓ Correo confirmado vía Admin API")
        else:
            print(
                "⚠ No se pudo confirmar el correo automáticamente. "
                "Confírmalo en Dashboard → Authentication → Users.",
                file=sys.stderr,
            )
    else:
        print(
            "⚠ Añade SUPABASE_SERVICE_ROLE_KEY al .env y vuelve a ejecutar make seed-admin "
            "para confirmar el correo, o confírmalo manualmente en el dashboard.",
        )

    print(f"\n  Email:    {ADMIN_EMAIL}")
    print("  Password: (la definida en ADMIN_PASSWORD de tu .env local)")
    print("  Login:    http://127.0.0.1:4321/auth/login")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
