#!/usr/bin/env bash
# Genera .env para el proyecto Supabase Cloud b2e_ (hzfkoxvqtemflpokaqnw)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
PROJECT_REF="hzfkoxvqtemflpokaqnw"
API_URL="https://${PROJECT_REF}.supabase.co"
POOLER="aws-0-us-east-1.pooler.supabase.com"

# Anon key publicada (segura para cliente; rotar en dashboard si se filtra)
DEFAULT_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZmtveHZxdGVtZmxwb2thcW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTQ0MzQsImV4cCI6MjA5NDc3MDQzNH0.T1Jk0Z5R1xdTgVqYBGW0lW1ML59OGLWl-yiB5RHG7O8"

if [[ -f "$ENV_FILE" ]]; then
  echo "Ya existe $ENV_FILE — no se sobrescribe. Edítalo manualmente o bórralo primero."
  exit 1
fi

read -rsp "Contraseña de base de datos (Dashboard → Database): " DB_PASSWORD
echo
read -rsp "JWT Secret (Dashboard → API → JWT Settings): " JWT_SECRET
echo

if [[ -z "$DB_PASSWORD" || -z "$JWT_SECRET" ]]; then
  echo "Error: DB_PASSWORD y JWT_SECRET son obligatorios."
  exit 1
fi

# Escapar caracteres especiales en URL para DATABASE_URL
ENC_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$DB_PASSWORD''', safe=''))")

cat > "$ENV_FILE" <<EOF
# Generado por scripts/setup-env.sh — $(date -Iseconds)
SUPABASE_URL=${API_URL}
SUPABASE_ANON_KEY=${DEFAULT_ANON}
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=${JWT_SECRET}

DATABASE_URL=postgresql+psycopg://postgres.${PROJECT_REF}:${ENC_PASSWORD}@${POOLER}:6543/postgres

API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:4321,http://127.0.0.1:4321

PUBLIC_SUPABASE_URL=${API_URL}
PUBLIC_SUPABASE_ANON_KEY=${DEFAULT_ANON}
PUBLIC_API_URL=http://localhost:8000
EOF

chmod 600 "$ENV_FILE"
echo "✓ Creado $ENV_FILE"
echo "  Opcional: añade SUPABASE_SERVICE_ROLE_KEY desde el dashboard (solo backend/admin)."
echo "  Arranca: make dev-api && make dev-web"
