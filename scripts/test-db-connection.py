#!/usr/bin/env python3
"""Prueba DATABASE_URL y sugiere corrección ante 'Tenant or user not found'."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"
PROJECT_REF = "hzfkoxvqtemflpokaqnw"


def load_database_url() -> str | None:
    if not ENV_FILE.exists():
        return None
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip()
    return None


def analyze_url(url: str) -> list[str]:
    hints: list[str] = []
    parsed = urlparse(url.replace("postgresql+psycopg://", "postgresql://", 1))
    user = parsed.username or ""
    host = parsed.hostname or ""
    port = parsed.port or 5432

    password = parsed.password or ""
    if password in ("CHANGE_ME", "") or "[DB_PASSWORD]" in url:
        hints.append(
            "La contraseña de base de datos en DATABASE_URL sigue siendo un placeholder. "
            "En el dashboard: Settings → Database → Database password (o reset password)."
        )

    if host.endswith(".pooler.supabase.com") and port == 6543 and user.startswith("postgres."):
        if host.startswith("aws-0-"):
            hints.append(
                "Host aws-0-* suele ser incorrecto para este proyecto; el dashboard suele mostrar "
                f"aws-1-us-east-1.pooler.supabase.com (verifica en Connect)."
            )
        if not host.startswith(f"aws-1-"):
            hints.append(
                "Si falla la conexión, copia el host exacto del dashboard (Connect → URI)."
            )

    if host == f"db.{PROJECT_REF}.supabase.co" and user.startswith("postgres."):
        hints.append(
            "En conexión directa/transaction a db.*.supabase.co el usuario debe ser postgres "
            "(sin .[ref])."
        )

    return hints


def test_connection(url: str) -> None:
    try:
        from sqlalchemy import create_engine, text
    except ImportError:
        print("Instala dependencias API: cd apps/api && pip install -e .")
        sys.exit(1)

    engine = create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 12})
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("OK  Conexión a Postgres exitosa.")
    except Exception as exc:
        msg = str(exc)
        print(f"FAIL  No se pudo conectar: {msg[:500]}")
        if "Tenant or user not found" in msg:
            print()
            print("Causa habitual: host/puerto/usuario no coinciden con el modo del pooler.")
            print("Copia la cadena exacta en:")
            print(
                f"  https://supabase.com/dashboard/project/{PROJECT_REF}?showConnect=true&method=session"
            )
        for hint in analyze_url(url):
            print(f"  → {hint}")
        sys.exit(1)
    finally:
        engine.dispose()


def main() -> None:
    url = load_database_url()
    if not url:
        print(f"FAIL  No hay DATABASE_URL en {ENV_FILE}")
        sys.exit(1)

    print(f"Probando DATABASE_URL (host oculto en logs)...")
    for hint in analyze_url(url):
        print(f"WARN {hint}")
    test_connection(url)


if __name__ == "__main__":
    main()
