from types import SimpleNamespace
from uuid import uuid4
from typing import cast

from app.domains.challenges.models import Challenge
from app.domains.challenges.models import ChallengeStatus
from app.domains.challenges.services import challenge_to_read


def test_public_challenge_is_anonymized() -> None:
    company = SimpleNamespace(
        organization_name="TechNova Solutions LLC",
        full_name="Luis Pérez",
        business_sector="Tecnología",
    )
    challenge = SimpleNamespace(
        id=uuid4(),
        company_id=uuid4(),
        title="Arquitectura para TechNova Solutions LLC",
        description="TechNova Solutions LLC necesita reducir consumo eléctrico.",
        status=ChallengeStatus.open,
        environmental_impact={
            "summary": "TechNova Solutions LLC busca eficiencia energética.",
            "expected_metric": "Reducción de consumo",
            "metric_unit": "%",
        },
        deadline=None,
        published_at=None,
        created_at=None,
        updated_at=None,
        category_links=[],
        company=company,
    )

    payload = challenge_to_read(cast(Challenge, challenge), anonymize=True)

    assert "TechNova Solutions LLC" not in payload["title"]
    assert "TechNova Solutions LLC" not in payload["description"]
    assert payload["environmental_impact"]["summary"] == "Entidad del Sector Tecnología - Anónima busca eficiencia energética."
