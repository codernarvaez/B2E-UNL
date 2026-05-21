#!/usr/bin/env bash
# Verifica que .gitignore bloquee secretos y artefactos antes de push a GitHub.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: no es un repositorio git."
  exit 1
fi

echo "== B2E — verificación pre-push =="
echo "Rama: $(git branch --show-current)"
echo "Archivos rastreados: $(git ls-files | wc -l)"
echo ""

FAIL=0

# 1) Nada prohibido en el índice de git
FORBIDDEN_SUBSTRINGS=(
  "node_modules"
  "/dist/"
  ".astro/"
  "__pycache__"
  ".pytest_cache"
  ".egg-info"
  ".venv/"
  "/.env"
  ".cursor/"
  ".codegraph/"
)

while IFS= read -r tracked; do
  [[ -z "$tracked" ]] && continue
  for bad in "${FORBIDDEN_SUBSTRINGS[@]}"; do
    if [[ "$tracked" == *"$bad"* ]] || [[ "$tracked" == ".env" ]]; then
      echo "ERROR [índice]: '$tracked' no debería estar rastreado (coincide: $bad)"
      FAIL=1
    fi
  done
done < <(git ls-files)

# 2) Rutas locales deben estar ignoradas si existen
MUST_IGNORE=(
  ".env"
  "apps/web/node_modules"
  "apps/web/dist"
  "apps/web/.astro"
  "apps/api/app/__pycache__"
  "apps/api/b2e_api.egg-info"
  ".cursor"
  ".codegraph"
)

for path in "${MUST_IGNORE[@]}"; do
  if [[ -e "$path" ]]; then
    if git check-ignore -q "$path" 2>/dev/null; then
      echo "OK [ignorado]: $path"
    else
      echo "ERROR [no ignorado]: $path existe y .gitignore NO lo excluye"
      FAIL=1
    fi
  fi
done

# 3) Archivos que SÍ deben versionarse (plantilla y reglas del proyecto)
for must_track in ".env.example" ".cursorrules"; do
  if [[ -f "$must_track" ]]; then
    if git check-ignore -q "$must_track" 2>/dev/null; then
      echo "ERROR: $must_track está ignorado (debe subirse al repo público)"
      FAIL=1
    else
      echo "OK [versionar]: $must_track no está ignorado"
    fi
  fi
done

# 4) supabase/ — migraciones y seed sí; secretos locales no
if [[ -d "supabase/migrations" ]]; then
  if git check-ignore -q "supabase/migrations" 2>/dev/null; then
    echo "ERROR: supabase/migrations está ignorado (debe subirse al repo)"
    FAIL=1
  else
    echo "OK [versionar]: supabase/migrations"
  fi
fi
if [[ -f "supabase/.env" ]]; then
  if git check-ignore -q "supabase/.env" 2>/dev/null; then
    echo "OK [ignorado]: supabase/.env"
  else
    echo "ERROR: supabase/.env no está ignorado"
    FAIL=1
  fi
fi

# 5) Simular git add — no debe proponer basura
STAGED_NEW=$(git add --dry-run . 2>/dev/null | wc -l)
if [[ "$STAGED_NEW" -gt 0 ]]; then
  echo ""
  echo "Pendiente de stage (revisar):"
  git add --dry-run . 2>/dev/null | head -20
  echo "..."
fi

# 6) Historial: .env jamás commiteado
if git log --all --oneline -- .env 2>/dev/null | grep -q .; then
  echo "ERROR [historial]: .env fue commiteado antes. Debes rotar secretos y usar git filter-repo."
  FAIL=1
else
  echo "OK [historial]: .env no aparece en commits"
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "== Todo correcto: seguro para git push =="
  exit 0
fi

echo "== Corrige los errores antes de subir a GitHub =="
exit 1
