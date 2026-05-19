.PHONY: help dev-api dev-web supabase-start supabase-reset test-api install setup-env seed-admin verify-git

help:
	@echo "Comandos B2E (ejecutar desde la raíz del repo):"
	@echo "  make dev-web      → Astro en http://127.0.0.1:4321"
	@echo "  make dev-api      → FastAPI en http://127.0.0.1:8000"
	@echo "  make install      → dependencias api + web"
	@echo "  make seed-admin   → usuario admin@unl.edu.ec"
	@echo "  make verify-git   → validar .gitignore antes de push"
	@echo "  npm run dev:web   → alternativa sin make"

.DEFAULT_GOAL := help

install:
	cd apps/api && pip install -e ".[dev]"
	cd apps/web && npm install

setup-env:
	bash scripts/setup-env.sh

seed-admin:
	python3 scripts/seed-admin-user.py

verify-git:
	bash scripts/verify-before-push.sh

supabase-start:
	supabase start

supabase-reset:
	supabase db reset

dev-api:
	cd apps/api && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

dev-web:
	cd apps/web && npm run dev -- --host 127.0.0.1 --port 4321

test-api:
	cd apps/api && pytest -q
