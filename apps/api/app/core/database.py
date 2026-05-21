from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# Transaction pooler (:6543) no admite prepared statements persistentes en psycopg3
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"prepare_threshold": None},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def db_session_with_rls(user_id: str | None) -> Generator[Session, None, None]:
    """Open a session and inject Supabase JWT claims for RLS policies."""
    db = SessionLocal()
    try:
        if user_id:
            db.execute(
                text("SELECT set_config('request.jwt.claim.sub', :sub, true)"),
                {"sub": user_id},
            )
            db.execute(
                text("SELECT set_config('request.jwt.claim.role', 'authenticated', true)"),
            )
        db.commit()
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
