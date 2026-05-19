# B2E Innovación y Sustentabilidad — Loja

Plataforma **Business-to-Education (B2E)** que conecta la **Cámara de Comercio de Loja (CADECOL)** con la **Universidad Nacional de Loja (UNL)** para el matchmaking de retos técnicos con impacto ambiental y categorías Green Tech.

[![CI](https://github.com/TU_USUARIO/TU_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/TU_USUARIO/TU_REPO/actions/workflows/ci.yml)

## Características

- Tablero público de retos sustentables (`/retos`)
- Registro de empresas (correo/contraseña o SSO Google y GitHub)
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
├── scripts/          # setup-env, seed-admin
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
git clone https://github.com/TU_USUARIO/b2e-loja.git
cd b2e-loja

make install
# o: npm run install:all
```

### 2. Variables de entorno

**No subas el archivo `.env` a GitHub.** Solo usa la plantilla:

```bash
cp .env.example .env
```

Completa en `.env` (desde el [dashboard de Supabase](https://supabase.com/dashboard) → Settings → API):

- `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `DATABASE_URL` (contraseña de la base de datos)
- `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` (mismos valores públicos para Astro)

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
| `company` | Publica retos (requiere aprobación admin) |
| `academic` | Postula soluciones |
| `admin` | Gestión de plataforma |

## Subir a GitHub

### Verificar qué se va a commitear

```bash
git init
git add .
git status
```

**Comprueba que NO aparezcan:**

- `.env`
- `node_modules/`
- `apps/web/dist/`
- `.venv/` o `__pycache__/`

Si `.env` aparece en `git status`, detente: revisa que exista en `.gitignore`.

Prueba explícita:

```bash
git check-ignore -v .env apps/web/node_modules apps/web/dist
```

Debe listar reglas de `.gitignore` para cada ruta.

### Primer push

```bash
git commit -m "chore: initial commit — plataforma B2E Loja"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/b2e-loja.git
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
make test-api      # pytest en apps/api
make seed-admin    # Usuario admin de prueba
make supabase-reset  # Solo con Supabase CLI local
```

## Aliados

Cámara de Comercio de Loja (CADECOL) · Universidad Nacional de Loja · Carrera de Ingeniería en Sistemas/Computación · CIT

## Licencia

Proyecto académico e institucional. Define la licencia con tu equipo antes de distribución pública.
