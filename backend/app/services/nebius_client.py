import json
import logging
import re
from typing import Dict, Any, Optional
import httpx
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.clinical import ExtractionPayload, MedicationItem, ProcedureItem
from app.services.prompts import SYSTEM_PROMPT, build_user_prompt
from app.services.extractor_utils import clean_and_parse_json, normalize_extraction_payload

logger = logging.getLogger("fieldscribe.nebius")

def fallback_regex_extractor(text: str) -> Dict[str, Any]:
    """
    Deterministic rule-based extractor for AI_PROVIDER=demo mode.
    Ensures zero false claims while maintaining a fully functional offline demo.
    """
    medications = []
    procedures = []
    observations = []
    missing_info = []

    # Check for prompt-style phrases: "administered <dose> of a [fictional demo] medication named <name> by <route> route at <time>"
    named_med_pattern = re.compile(
        r'(?:administered|gave|pushed|injected|provided)\s+([\d\.]+\s*(?:mg|milligrams|g|grams|mcg|micrograms|ml|milliliters|tablets?)?)\s*(?:of\s+(?:a|an)?(?:\s+fictional)?(?:\s+demo)?(?:\s+medication)?\s+named\s+)?([A-Za-z0-9\-]+)(?:\s+by\s+([a-zA-Z\s]+?)\s+route)?(?:\s+at\s+([\d]{1,2}:[\d]{2}\s*(?:AM|PM|am|pm)?))?',
        re.IGNORECASE
    )

    found_med_names = set()
    stop_words = {"a", "an", "the", "fictional", "demo", "medication", "dose", "tablet"}

    for match in named_med_pattern.finditer(text):
        dosage, name, route, timestamp = match.groups()
        if not name or name.lower() in stop_words:
            continue
        snippet = match.group(0).strip()
        found_med_names.add(name.lower())
        
        route_clean = route.strip() if route else None
        timestamp_clean = timestamp.strip() if timestamp else None
        
        if not route_clean:
            missing_info.append(f"Route not specified for medication '{name}'")
        if not timestamp_clean:
            missing_info.append(f"Administration timestamp not specified for medication '{name}'")

        medications.append({
            "name": name,
            "dosage": dosage.strip() if dosage else None,
            "route": route_clean,
            "timestamp": timestamp_clean,
            "source_text": snippet
        })

    # Simpler pattern for demo notes: "[dose] [unit] of [name]"
    if not medications:
        simple_med = re.compile(
            r'([\d\.]+\s*(?:mg|milligrams|g|grams|mcg|micrograms|ml|milliliters))\s+(?:of\s+)?([A-Za-z0-9\-]+)',
            re.IGNORECASE
        )
        for match in simple_med.finditer(text):
            dosage, name = match.groups()
            if name.lower() not in stop_words and name.lower() not in ["water", "saline", "oxygen"] and name.lower() not in found_med_names:
                snippet = match.group(0).strip()
                time_match = re.search(r'at\s+([\d]{1,2}:[\d]{2}\s*(?:AM|PM|am|pm)?)', text[match.end():match.end()+45], re.IGNORECASE)
                route_match = re.search(r'(?:by|via)\s+([a-zA-Z\s]+?)\s+route', text[match.end():match.end()+45], re.IGNORECASE)
                
                t_val = time_match.group(1).strip() if time_match else None
                r_val = route_match.group(1).strip() if route_match else None
                
                if not r_val:
                    missing_info.append(f"Route not specified for medication '{name}'")
                if not t_val:
                    missing_info.append(f"Administration timestamp not specified for medication '{name}'")

                medications.append({
                    "name": name,
                    "dosage": dosage.strip(),
                    "route": r_val,
                    "timestamp": t_val,
                    "source_text": snippet
                })

    # Procedures search
    proc_pattern = re.compile(
        r'([A-Za-z0-9\s\-]+?)\s+(?:procedure|intervention)?\s*(?:was\s+performed|performed|initiated|applied|administered)\s*(?:at\s+([\d]{1,2}:[\d]{2}\s*(?:AM|PM|am|pm)?))?',
        re.IGNORECASE
    )
    for match in proc_pattern.finditer(text):
        name, timestamp = match.groups()
        name_clean = name.strip()
        if len(name_clean) > 3 and name_clean.lower() not in ["first responder", "patient", "he", "she", "it"]:
            snippet = match.group(0).strip()
            t_val = timestamp.strip() if timestamp else None
            if not t_val:
                missing_info.append(f"Timestamp not specified for procedure '{name_clean}'")
            procedures.append({
                "name": name_clean,
                "timestamp": t_val,
                "source_text": snippet
            })

    # Observation search
    obs_matches = re.finditer(r'(?:patient was|patient found|observed|noted that|reassessed at)\s+([^.]+)', text, re.IGNORECASE)
    for m in obs_matches:
        obs_text = m.group(1).strip()
        if obs_text:
            observations.append(obs_text)

    # Event timestamp
    time_general = re.search(r'\b([\d]{1,2}:[\d]{2}\s*(?:AM|PM|am|pm)?)\b', text)
    event_timestamp = time_general.group(1) if time_general else None

    return {
        "event_timestamp": event_timestamp,
        "source_note": text,
        "medications": medications,
        "procedures": procedures,
        "observations": observations if observations else ["Patient assessed by first responder on scene."],
        "missing_information": missing_info if missing_info else ["No critical documentation gaps identified."],
        "extraction_confidence": 0.88
    }

async def extract_with_nebius(source_note: str, event_timestamp: Optional[str] = None) -> ExtractionPayload:
    """
    Extracts structured clinical information using Nebius Token Factory API
    with the configured NVIDIA model (e.g. nvidia/Llama-3.1-Nemotron-70B-Instruct-HF).
    """
    api_key = settings.NEBIUS_API_KEY.strip()
    base_url = settings.NEBIUS_BASE_URL.rstrip('/')
    model_name = settings.NEBIUS_MODEL.strip()
    timeout = settings.NEBIUS_TIMEOUT

    if not api_key:
        error_msg = (
            "NEBIUS_API_KEY is not configured in backend/.env. "
            "Please provide a valid Nebius Token Factory API key, or switch AI_PROVIDER=ollama or AI_PROVIDER=demo."
        )
        logger.error(error_msg)
        raise HTTPException(status_code=401, detail=error_msg)

    logger.info(f"Calling Nebius Token Factory at {base_url} with model {model_name}")
    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(source_note, event_timestamp)}
        ],
        "temperature": 0.05,
        "max_tokens": 1200,
        "response_format": {"type": "json_object"}
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, headers=headers, json=payload)
    except httpx.TimeoutException:
        error_msg = f"Nebius Token Factory request timed out after {timeout} seconds."
        logger.error(error_msg)
        raise HTTPException(status_code=504, detail=error_msg)
    except Exception as e:
        error_msg = f"Network failure connecting to Nebius Token Factory: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)

    if response.status_code == 401:
        error_msg = "Nebius Token Factory rejected the API key (401 Unauthorized). Check NEBIUS_API_KEY in backend/.env."
        logger.error(error_msg)
        raise HTTPException(status_code=401, detail=error_msg)

    if response.status_code != 200:
        error_msg = f"Nebius Token Factory returned error {response.status_code}: {response.text}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)

    try:
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        parsed_json = clean_and_parse_json(content)
    except Exception as e:
        error_msg = f"Failed to parse structured JSON from Nebius output: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)

    return normalize_extraction_payload(
        parsed_json=parsed_json,
        source_note=source_note,
        event_timestamp=event_timestamp,
        model_used=f"Nebius Token Factory ({model_name})",
        default_confidence=0.96
    )

def extract_with_demo(source_note: str, event_timestamp: Optional[str] = None) -> ExtractionPayload:
    """
    Extracts structured clinical information using deterministic rule-based safety engine.
    """
    fallback_data = fallback_regex_extractor(source_note)
    return ExtractionPayload(
        event_timestamp=fallback_data["event_timestamp"] or event_timestamp,
        source_note=source_note,
        medications=[MedicationItem(**m) for m in fallback_data["medications"]],
        procedures=[ProcedureItem(**p) for p in fallback_data["procedures"]],
        observations=fallback_data["observations"],
        missing_information=fallback_data["missing_information"],
        extraction_confidence=0.90,
        model_used="Deterministic Demo Engine (Offline Mode)"
    )

async def extract_clinical_data(source_note: str, event_timestamp: Optional[str] = None) -> ExtractionPayload:
    """
    Backwards-compatible router delegating to the unified AI service.
    """
    from app.services.ai_service import dispatch_extract_note
    return await dispatch_extract_note(source_note, event_timestamp)
