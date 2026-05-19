from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.domains.auth.router import router as auth_router
from app.domains.challenges.router import router as challenges_router
from app.domains.proposals.router import router as proposals_router

app = FastAPI(
    title="B2E API — Innovación y Sustentabilidad Loja",
    description="Matchmaking de retos entre empresas y academia",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(challenges_router, prefix="/api/v1")
app.include_router(proposals_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
