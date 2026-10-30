import logging
from typing import Dict, Any, Optional
import httpx
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.clinical import ExtractionPayload
from app.services.prompts import SYSTEM_PROMPT, build_user_prompt
from app.services.extractor_utils import clean_and_parse_json, normalize_extraction_payload

logger = logging.getLogger("fieldscribe.ollama")

async def check_ollama_health() -> Dict[str, Any]:
    """
    Checks if local Ollama daemon is reachable and whether the configured model is installed.
    """
    base_url = settings.OLLAMA_BASE_URL.rstrip('/')
    target_model = settings.OLLAMA_MODEL.strip()
    
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{base_url}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                
                # Check for exact or prefix match (e.g. "nemotron-mini:latest" vs "nemotron-mini")
                model_installed = any(
                    target_model == m or target_model == m.split(":")[0] or m.startswith(target_model)
                    for m in models
                )
                
                return {
                    "available": True,
                    "base_url": base_url,
                    "model": target_model,
                    "model_installed": model_installed,
                    "installed_models": models
                }
            return {
                "available": False,
                "base_url": base_url,
                "model": target_model,
                "model_installed": False,
                "error": f"Ollama returned HTTP status {resp.status_code}"
            }
    except Exception as e:
        return {
            "available": False,
            "base_url": base_url,
            "model": target_model,
            "model_installed": False,
            "error": str(e)
        }

async def extract_with_ollama(source_note: str, event_timestamp: Optional[str] = None) -> ExtractionPayload:
    """
    Extracts structured clinical information using a local Ollama model (e.g. nemotron-mini, llama3.2).
    """
    base_url = settings.OLLAMA_BASE_URL.rstrip('/')
    model_name = settings.OLLAMA_MODEL.strip()
    timeout = settings.OLLAMA_TIMEOUT

    logger.info(f"Dispatching note to local Ollama at {base_url} with model '{model_name}'")
    url = f"{base_url}/api/chat"

    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(source_note, event_timestamp)}
        ],
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.05
        }
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload)
    except httpx.ConnectError:
        error_msg = (
            f"Ollama server is unavailable at {base_url}. "
            f"Please ensure Ollama is installed and running (run 'ollama serve' in your terminal or launch Ollama desktop)."
        )
        logger.error(error_msg)
        raise HTTPException(status_code=503, detail=error_msg)
    except httpx.TimeoutException:
        error_msg = (
            f"Ollama request to model '{model_name}' timed out after {timeout} seconds. "
            f"If your local machine has limited GPU resources, consider using a lighter model such as 'nemotron-mini' or 'llama3.2:3b'."
        )
        logger.error(error_msg)
        raise HTTPException(status_code=504, detail=error_msg)
    except Exception as e:
        error_msg = f"Network error connecting to local Ollama service: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)

    # Handle Ollama HTTP responses
    if response.status_code == 404:
        err_text = response.text
        if "not found" in err_text.lower():
            detail = (
                f"Ollama model '{model_name}' is not installed locally. "
                f"Please download it by opening PowerShell and running: 'ollama pull {model_name}'"
            )
        else:
            detail = f"Ollama endpoint {url} returned 404 Not Found: {err_text}"
        logger.error(detail)
        raise HTTPException(status_code=404, detail=detail)

    if response.status_code != 200:
        detail = f"Ollama returned HTTP error status {response.status_code}: {response.text}"
        logger.error(detail)
        raise HTTPException(status_code=502, detail=detail)

    try:
        data = response.json()
    except Exception as e:
        detail = f"Failed to parse Ollama JSON response: {str(e)}"
        logger.error(detail)
        raise HTTPException(status_code=502, detail=detail)

    # Extract assistant message content
    message = data.get("message", {})
    raw_content = message.get("content", "").strip()

    if not raw_content:
        detail = f"Ollama model '{model_name}' returned an empty response."
        logger.error(detail)
        raise HTTPException(status_code=502, detail=detail)

    # Parse and clean structured JSON
    try:
        parsed_json = clean_and_parse_json(raw_content)
    except Exception as e:
        snippet = raw_content[:180] + ("..." if len(raw_content) > 180 else "")
        detail = f"Ollama model '{model_name}' returned malformed or unparseable JSON: {snippet}"
        logger.error(detail)
        raise HTTPException(status_code=502, detail=detail)

    # Defensively normalize into strict Pydantic ExtractionPayload
    return normalize_extraction_payload(
        parsed_json=parsed_json,
        source_note=source_note,
        event_timestamp=event_timestamp,
        model_used=f"Ollama Local ({model_name})",
        default_confidence=0.94
    )

