# B2E Innovación y Sustentabilidad — Loja

Plataforma **Business-to-Education (B2E)** que conecta la **Cámara de Comercio de Loja (CADECOL)** con la **Universidad Nacional de Loja (UNL)** para el matchmaking de retos técnicos con impacto ambiental y categorías Green Tech.

[![CI](https://github.com/codernarvaez/B2E-UNL/actions/workflows/ci.yml/badge.svg)](https://github.com/codernarvaez/B2E-UNL/actions/workflows/ci.yml)
[![DevSecOps](https://github.com/codernarvaez/B2E-UNL/actions/workflows/devsecops.yml/badge.svg)](https://github.com/codernarvaez/B2E-UNL/actions/workflows/devsecops.yml)
[![CodeQL](https://github.com/codernarvaez/B2E-UNL/actions/workflows/codeql.yml/badge.svg)](https://github.com/codernarvaez/B2E-UNL/actions/workflows/codeql.yml)

## Características

- Tablero público de retos sustentables (`/retos`)
- Registro de empresas (correo/contraseña o SSO Google y GitHub)
- **Gestión de retos empresariales**: crear borrador, requerimiento técnico, métricas de impacto, publicar en tablero y seguimiento de propuestas (`/dashboard/empresa`)
- Roles: `company`, `academic`, `admin` con aprobación de empresas
- Panel administrativo (empresas pendientes, retos, propuestas)
- Sesión con JWT (Supabase), aviso de expiración y cierre por inactividad
- Proyectos galardonados (datos de ejemplo, preparado para ampliarse)

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Astro 5, Vite, TypeScript, TailwindCSS |
| Backend | FastAPI, SQLAlchemy, Pydantic v2 |
| Datos y auth | Supabase (PostgreSQL, RLS, Auth) |

## Estructura del monorepo

```text
B2E/
├── apps/
│   ├── web/          # Astro SSR — interfaz
│   └── api/          # FastAPI — API REST
├── supabase/
│   ├── migrations/   # Esquema SQL (fuente de verdad)
│   └── seed.sql
├── scripts/          # setup-env, validate, test-db, verify-before-push
├── .env.example      # Plantilla de variables (sí se sube a Git)
├── Makefile
└── docker-compose.yml
```

## Requisitos previos

- **Node.js** 20+
- **Python** 3.11+
- **npm** y **pip**
- Cuenta en [Supabase](https://supabase.com) (proyecto cloud o CLI local)
- *(Opcional)* `make`, Docker, Supabase CLI

## Configuración rápida

### 1. Clonar e instalar

```bash
git clone https://github.com/codernarvaez/B2E-UNL.git
cd B2E-UNL

make install
# o: npm run install:all
```

### 2. Variables de entorno

**No subas el archivo `.env` a GitHub.** Solo usa la plantilla:

```bash
cp .env.example .env
```

#### Qué es seguro subir al repositorio público

| Ruta | ¿Subir? | Motivo |
|------|---------|--------|
| `.env.example` | **Sí** | Solo placeholders (`your-anon-key`, `[DB_PASSWORD]`). Sin secretos reales. Gitleaks lo excluye. |
| `.env` | **No** | Contraseñas, JWT secret, service role. |
| `.cursorrules` | **Sí** | Reglas del proyecto para Cursor; no contiene credenciales. |
| `.cursor/` | **No** | Estado local del IDE (chats, índices). |
| `.codegraph/` | **No** | Caché local de herramientas. |
| `supabase/migrations/` | **Sí** | Esquema SQL y RLS; fuente de verdad del equipo. |
| `supabase/seed.sql`, `config.toml` | **Sí** | Configuración y datos de ejemplo sin secretos. |
| `supabase/.env` | **No** | Secretos del CLI local, si existiera. |

Completa en `.env` (desde el [dashboard de Supabase](https://supabase.com/dashboard) → Settings → API):

- `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `DATABASE_URL` — copia la cadena exacta desde **Dashboard → Connect** (proyecto `hzfkoxvqtemflpokaqnw`). Suele ser `postgres.hzfkoxvqtemflpokaqnw` en `aws-1-us-east-1.pooler.supabase.com` (puerto **6543** o **5432** según el modo que muestre el dashboard). No inventes el host `aws-0-*` si tu proyecto usa `aws-1-*` (*Tenant or user not found*).
- `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` (mismos valores públicos para Astro)

Prueba la base de datos:

```bash
make test-db
```

Alternativa guiada:

```bash
chmod +x scripts/setup-env.sh
make setup-env
```

### 3. Migraciones en Supabase

Aplica las migraciones de `supabase/migrations/` en tu proyecto (SQL Editor o CLI):

```bash
# Con Supabase CLI vinculado
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

### 4. Arrancar en desarrollo

Desde la **raíz del repositorio**, en dos terminales:

```bash
make dev-web    # http://127.0.0.1:4321
make dev-api    # http://127.0.0.1:8000/docs
```

Equivalente con npm:

```bash
npm run dev:web
npm run dev:api
```

### 5. Usuario administrador (solo desarrollo)

```bash
make seed-admin
```

Crea el usuario definido en `scripts/seed-admin-user.py`. **Cambia la contraseña** antes de usar en producción.

## URLs locales

| Recurso | URL |
|---------|-----|
| Inicio | http://127.0.0.1:4321/ |
| Tablero de retos | http://127.0.0.1:4321/retos |
| Login | http://127.0.0.1:4321/auth/login |
| Registro empresa | http://127.0.0.1:4321/auth/registro-empresa |
| Panel empresa (mis retos) | http://127.0.0.1:4321/dashboard/empresa |
| Crear reto | http://127.0.0.1:4321/dashboard/empresa/nuevo |
| API (OpenAPI) | http://127.0.0.1:8000/docs |

## OAuth (Google / GitHub)

1. Supabase → **Authentication** → **Providers**: activa Google y GitHub.
2. **URL Configuration** → Redirect URLs:
   - `http://127.0.0.1:4321/auth/callback`
   - `http://localhost:4321/auth/callback`
   - Tu dominio de producción cuando despliegues
3. En cada proveedor OAuth, usa la callback que indica Supabase:  
   `https://TU_PROJECT_REF.supabase.co/auth/v1/callback`

## Sesión (JWT)

- El access token de Supabase es un **JWT**; el middleware valida expiración en rutas protegidas.
- Variables opcionales en `.env`:
  - `PUBLIC_SESSION_IDLE_MINUTES` (default: 30)
  - `PUBLIC_SESSION_WARN_MINUTES` (default: 5)

## Roles

| Rol | Descripción |
|-----|-------------|
| `company` | Crea y gestiona retos (requiere aprobación admin para publicar en tablero) |
| `academic` | Postula soluciones |
| `admin` | Gestión de plataforma |

## DevSecOps (GitHub Actions)

Pipelines en `.github/workflows/`:

| Workflow | Disparadores | Qué hace |
|----------|--------------|----------|
| [**CI**](.github/workflows/ci.yml) | push/PR `main`, `develop` | Ruff + pytest (API), Astro check + build (web) |
| [**DevSecOps**](.github/workflows/devsecops.yml) | push/PR + cron semanal | Gitleaks, npm/pip audit, Bandit SAST, Trivy (fs + Dockerfiles) |
| [**CodeQL**](.github/workflows/codeql.yml) | push/PR + cron semanal | Análisis semántico JS/TS y Python |

**Dependabot** (`.github/dependabot.yml`): actualizaciones semanales de npm, pip y GitHub Actions.

### Gates de seguridad

- **Gitleaks**: bloquea si detecta secretos (`.gitleaks.toml` excluye `.env.example`).
- **Bandit**: bloquea hallazgos medium+ en `apps/api/app`.
- **Trivy**: reporta CRITICAL/HIGH en SARIF (pestaña Security del repo).
- **npm audit / pip-audit**: advierten vulnerabilidades (npm en modo warning inicial).

### Ejecutar checks en local

```bash
# API
cd apps/api && pip install -e ".[dev]" && ruff check app && pytest -q && bandit -r app -ll

# Web
cd apps/web && npm ci && npm run check && npm run build:ci
```

### Validar entorno local

```bash
make validate
```

Comprueba `.env`, **HTTPS hacia Supabase** (no usa `ping`) y servicios en `:4321` / `:8000`. En redes de la UNL u otras institucionales el **ICMP (ping) suele estar bloqueado**; eso no significa que Supabase esté caído. Usa:

```bash
curl -I https://hzfkoxvqtemflpokaqnw.supabase.co
```

### Protección de rama (recomendado)

En GitHub → **Settings → Branches** → ruleset para `main`:

- Require status checks: `CI — resumen`, `DevSecOps — resumen`, `CodeQL — javascript-typescript`, `CodeQL — python`
- Require PR antes de merge

## Subir a GitHub

### Verificar qué se va a commitear

```bash
make verify-git
# o: bash scripts/verify-before-push.sh
```

El script comprueba que secretos, dependencias, artefactos de build y carpetas de herramientas locales **no** estén en el índice de Git.

```bash
git add .
git status
```

**Comprueba que NO aparezcan:**

- `.env`
- `node_modules/`
- `apps/web/dist/`
- `.venv/` o `__pycache__/`
- `.cursor/` — configuración local de Cursor IDE
- `.codegraph/` — cachés locales de CodeGraph

Si alguna ruta sensible aparece en `git status`, detente y revisa `.gitignore`. El archivo `.cursorrules` en la raíz **sí puede** versionarse (reglas del proyecto); la carpeta `.cursor/` no.

Prueba explícita:

```bash
git check-ignore -v .env .cursor .codegraph apps/web/node_modules apps/web/dist
git check-ignore -v .env.example .cursorrules   # no debe devolver regla (no ignorados)
```

`.env.example` y `.cursorrules` **no** deben aparecer como ignorados. `.env` y `.cursor` **sí**.

Si `.cursor` o `.codegraph` se subieron antes por error:

```bash
git rm -r --cached .cursor .codegraph 2>/dev/null || true
```

### Primer push

```bash
git commit -m "chore: initial commit — plataforma B2E Loja"
git branch -M main
git remote add origin https://github.com/codernarvaez/B2E-UNL.git
git push -u origin main
```

Sustituye `TU_USUARIO` y el nombre del repositorio. Actualiza también el badge del README con la URL real del repo.

### Secretos en GitHub Actions (CI)

El workflow `.github/workflows/ci.yml` ejecuta tests y build **sin** `.env` de producción. Para despliegues futuros, configura secrets en el repo:  
**Settings → Secrets and variables → Actions**.

## Docker (opcional)

```bash
docker compose up --build
```

Requiere `.env` en la raíz del proyecto.

## Comandos útiles

```bash
make help          # Lista de comandos
make validate      # .env, Supabase (HTTPS), servicios locales
make test-db       # Probar conexión DATABASE_URL
make verify-git    # Qué se subirá a GitHub (sin .env, .cursor, etc.)
make test-api      # pytest en apps/api
make seed-admin    # Usuario admin de prueba
make supabase-reset  # Solo con Supabase CLI local
```

## Aliados

Cámara de Comercio de Loja (CADECOL) · Universidad Nacional de Loja · Carrera de Ingeniería en Sistemas/Computación · CIT

## Licencia

Proyecto académico e institucional. Define la licencia con tu equipo antes de distribución pública.
