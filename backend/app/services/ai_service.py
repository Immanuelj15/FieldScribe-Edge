import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.clinical import ExtractionPayload
from app.services.ollama_client import extract_with_ollama, check_ollama_health
from app.services.nebius_client import extract_with_nebius, extract_with_demo

logger = logging.getLogger("fieldscribe.ai_service")

async def dispatch_extract_note(source_note: str, event_timestamp: Optional[str] = None) -> ExtractionPayload:
    """
    Main entry point for note extraction. Routes to configured AI_PROVIDER without silent fallbacks.
    """
    provider = settings.AI_PROVIDER.lower().strip()
    logger.info(f"Dispatching clinical note extraction to provider: '{provider}'")

    if provider == "ollama":
        return await extract_with_ollama(source_note, event_timestamp)
    elif provider == "nebius":
        return await extract_with_nebius(source_note, event_timestamp)
    elif provider == "demo":
        return extract_with_demo(source_note, event_timestamp)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported AI_PROVIDER '{provider}'. Allowed options are 'ollama', 'nebius', or 'demo'."
        )

async def get_ai_service_status() -> Dict[str, Any]:
    """
    Aggregates provider status without exposing secrets.
    """
    provider = settings.AI_PROVIDER.lower().strip()
    has_nebius_key = bool(settings.NEBIUS_API_KEY and settings.NEBIUS_API_KEY.strip())
    masked_key = (
        f"{settings.NEBIUS_API_KEY[:4]}...{settings.NEBIUS_API_KEY[-4:]}"
        if has_nebius_key and len(settings.NEBIUS_API_KEY) > 8
        else ("Configured" if has_nebius_key else "Not Set")
    )

    ollama_info = await check_ollama_health()

    if provider == "ollama":
        active_engine = f"Ollama Local ({settings.OLLAMA_MODEL})"
    elif provider == "nebius":
        active_engine = f"Nebius Token Factory ({settings.NEBIUS_MODEL})"
    else:
        active_engine = "Deterministic Demo Engine (Offline)"

    return {
        "provider": provider,
        "active_engine": active_engine,
        "ollama": ollama_info,
        "nebius": {
            "api_endpoint": settings.NEBIUS_BASE_URL,
            "configured_model": settings.NEBIUS_MODEL,
            "api_key_configured": has_nebius_key,
            "api_key_masked": masked_key if has_nebius_key else "None"
        },
        # Backwards compatible block for older frontend versions & tests:
        "nebius_integration": {
            "api_endpoint": settings.NEBIUS_BASE_URL,
            "configured_model": settings.NEBIUS_MODEL,
            "api_key_configured": has_nebius_key,
            "api_key_masked": masked_key if has_nebius_key else "None (Running Local Demo Engine)",
            "mode": "Nebius Token Factory Cloud" if has_nebius_key else ("Ollama Local" if provider == "ollama" else "Local Demo Safe-Engine")
        }
    }
