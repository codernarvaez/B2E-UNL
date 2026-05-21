#!/usr/bin/env bash
# Validación local B2E + conectividad Supabase (sin exponer secretos).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0
WARN_COUNT=0
ok() { echo "  OK   $1"; }
warn() { echo "  WARN $1"; WARN_COUNT=$((WARN_COUNT + 1)); }
bad() { echo "  FAIL $1"; FAIL=1; }

echo "=========================================="
echo " B2E — Validación del proyecto"
echo "=========================================="

# --- Git ---
echo ""
echo "1) Git / .gitignore"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  bash scripts/verify-before-push.sh >/dev/null && ok "Índice git y ignores" || bad "verify-before-push.sh"
else
  warn "No es repositorio git"
fi

# --- .env ---
echo ""
echo "2) Variables de entorno (.env)"
if [[ ! -f .env ]]; then
  bad "Falta .env — ejecuta: cp .env.example .env"
else
  # shellcheck disable=SC1091
  set -a && source .env && set +a
  [[ "${PUBLIC_SUPABASE_URL:-}" =~ ^https://.*\.supabase\.co$ ]] && ok "PUBLIC_SUPABASE_URL" || bad "PUBLIC_SUPABASE_URL inválida"
  [[ -n "${PUBLIC_SUPABASE_ANON_KEY:-}" && "${PUBLIC_SUPABASE_ANON_KEY}" != "your-anon-key" ]] && ok "PUBLIC_SUPABASE_ANON_KEY" || bad "PUBLIC_SUPABASE_ANON_KEY"
  [[ "${SUPABASE_JWT_SECRET:-}" != "CHANGE_ME" && -n "${SUPABASE_JWT_SECRET:-}" ]] && ok "SUPABASE_JWT_SECRET" || warn "SUPABASE_JWT_SECRET (API JWT)"
  [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && ok "SUPABASE_SERVICE_ROLE_KEY" || warn "SUPABASE_SERVICE_ROLE_KEY (seed-admin)"
  if [[ "${DATABASE_URL:-}" == *"hzfkoxvqtemflpokaqnw"* && "${DATABASE_URL:-}" != *"CHANGE_ME"* ]]; then
    if [[ "${DATABASE_URL}" == *"aws-0-us-east-1.pooler.supabase.com"* ]]; then
      bad "DATABASE_URL: host aws-0 incorrecto para este proyecto — usa el host del dashboard (aws-1-us-east-1)"
    else
      ok "DATABASE_URL (formato)"
      if python3 scripts/test-db-connection.py >/dev/null 2>&1; then
        ok "DATABASE_URL (conexión Postgres)"
      else
        warn "DATABASE_URL no conecta — ejecuta: python3 scripts/test-db-connection.py"
      fi
    fi
  else
    warn "DATABASE_URL (FastAPI + Postgres)"
  fi
fi

# --- Red / Supabase (HTTPS es la prueba válida; ping/ICMP suele estar bloqueado en UNL) ---
echo ""
echo "3) Conectividad Supabase (HTTPS, no ping)"
HOST="hzfkoxvqtemflpokaqnw.supabase.co"
echo "  Nota: en redes institucionales el ping suele estar restringido; usamos curl/HTTPS."

HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 8 \
  "https://${HOST}/auth/v1/health" 2>/dev/null || echo "000")
[[ "$HTTPS_CODE" =~ ^[0-9]{3}$ && "$HTTPS_CODE" != "000" ]] && ok "HTTPS alcanza $HOST (HTTP $HTTPS_CODE)" \
  || bad "HTTPS no alcanza $HOST (timeout o firewall)"

if getent hosts "$HOST" >/dev/null 2>&1; then
  ok "Resolución DNS de $HOST"
else
  warn "DNS no resolvió $HOST (si HTTPS OK, puede ser normal en tu red)"
fi

if [[ -n "${PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 8 \
    -H "apikey: ${PUBLIC_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${PUBLIC_SUPABASE_ANON_KEY}" \
    "https://${HOST}/rest/v1/sustainability_categories?select=id&limit=1" 2>/dev/null || echo "000")
  [[ "$CODE" == "200" ]] && ok "REST API (categorías)" || bad "REST API respondió HTTP $CODE"
else
  warn "REST API no probada (falta anon key)"
fi

# --- Servicios locales ---
echo ""
echo "4) Servicios locales (opcional)"
for port_svc in "4321:Web Astro" "8000:API FastAPI"; do
  port="${port_svc%%:*}"
  name="${port_svc#*:}"
  if ss -tln 2>/dev/null | grep -q ":${port} "; then
    URL="http://127.0.0.1:${port}/"
    [[ "$port" == "8000" ]] && URL="http://127.0.0.1:8000/docs"
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")
    [[ "$CODE" =~ ^[23] ]] && ok "$name en :$port (HTTP $CODE)" || warn "$name en :$port (HTTP $CODE)"
  else
    warn "$name no está en :$port — ejecuta: make dev-web / make dev-api"
  fi
done

echo ""
echo "=========================================="
if [[ "$FAIL" -gt 0 ]]; then
  echo " Resultado: CORREGIR errores FAIL antes de continuar"
  exit 1
fi
if [[ "$WARN_COUNT" -gt 0 ]]; then
  echo " Resultado: PARCIAL — web/Supabase OK; completa variables WARN para API completa"
  echo " Dashboard: https://supabase.com/dashboard/project/hzfkoxvqtemflpokaqnw"
  exit 0
fi
echo " Resultado: LISTO para desarrollo"
echo " Dashboard: https://supabase.com/dashboard/project/hzfkoxvqtemflpokaqnw"
exit 0
