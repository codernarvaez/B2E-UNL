"""AI service for challenge requirement improvement suggestions."""

import json
import logging
from typing import Any

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger("b2e.api.ai")


def suggest_requirement_improvement(challenge_data: dict[str, Any]) -> dict[str, str] | None:
    """
    Suggest improvements to a challenge requirement using Google Gemini AI.
    
    Args:
        challenge_data: Dict with keys: title, description, environmental_impact
                       environmental_impact is a dict with: summary, expected_metric, metric_unit, etc.
    
    Returns a dict with suggested improvements (title, description, impact_summary)
    or None if the API key is not configured or if an error occurs.
    """
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not configured. AI suggestions disabled.")
        return None

    try:
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemma-4-26b-a4b-it")
        
        # Extract environmental impact data
        env_impact = challenge_data.get("environmental_impact", {})
        if hasattr(env_impact, "model_dump"):
            env_impact = env_impact.model_dump()
        
        prompt = f"""Eres un experto en redacción técnica y retos de sustentabilidad. 
        
Analiza el siguiente reto tecnológico y sugiere SOLO mejoras críticas que hagan el requerimiento más claro, medible y viable para académicos.

**Título actual:**
{challenge_data.get('title', '')}

**Descripción del requerimiento:**
{challenge_data.get('description', '')}

**Resumen del impacto esperado:**
{env_impact.get('summary', '')}

**Contexto adicional:**
- Métrica objetivo: {env_impact.get('expected_metric', 'No especificada')}
- Unidad: {env_impact.get('metric_unit', 'No especificada')}
- Línea base: {env_impact.get('baseline_situation') or 'No especificada'}
- Criterios de éxito: {env_impact.get('success_criteria') or 'No especificados'}

Responde en JSON con este formato (solo si hay mejoras recomendadas):
{{
  "title": "Título mejorado o null si está bien",
  "description": "Descripción mejorada con más claridad y estructura o null si está bien",
  "impact_summary": "Resumen mejorado con indicadores más específicos o null si está bien",
  "rationale": "Explicación breve de por qué estas mejoras ayudan a académicos"
}}

Si el requerimiento está bien redactado, responde con todos los campos como null pero incluyendo rationale: "Requerimiento bien estructurado".
Sé conciso: máximo 2 líneas de mejora por campo."""

        response = model.generate_content(prompt)
        response_text = response.text
        
        # Extract JSON from response (may be wrapped in markdown code blocks)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        suggestions = json.loads(response_text)
        logger.info(f"AI suggestions generated for challenge: {challenge_data.get('title', 'unknown')}")
        return suggestions
        
    except Exception as e:
        logger.exception(f"Error generating AI suggestions: {str(e)}")
        return None
