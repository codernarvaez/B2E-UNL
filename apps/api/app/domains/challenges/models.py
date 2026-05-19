import enum
import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChallengeStatus(enum.StrEnum):
    open = "open"
    under_review = "under_review"
    in_development = "in_development"
    closed = "closed"


class SustainabilityCategory(Base):
    __tablename__ = "sustainability_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name_es: Mapped[str] = mapped_column(Text, nullable=False)
    description_es: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ChallengeStatus] = mapped_column(
        Enum(ChallengeStatus, name="challenge_status", create_constraint=False, native_enum=True),
        nullable=False,
        default=ChallengeStatus.open,
    )
    environmental_impact: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict
    )
    deadline: Mapped[date | None] = mapped_column(Date)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    company = relationship("Profile", back_populates="challenges")
    category_links = relationship(
        "ChallengeCategory",
        back_populates="challenge",
        cascade="all, delete-orphan",
    )
    proposals = relationship("Proposal", back_populates="challenge")


class ChallengeCategory(Base):
    __tablename__ = "challenge_categories"

    challenge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("challenges.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sustainability_categories.id"),
        primary_key=True,
    )

    challenge = relationship("Challenge", back_populates="category_links")
    category = relationship("SustainabilityCategory")
