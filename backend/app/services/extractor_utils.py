import json
import re
from typing import Dict, Any, Optional
from app.schemas.clinical import ExtractionPayload, MedicationItem, ProcedureItem

def clean_and_parse_json(raw_content: str) -> Dict[str, Any]:
    """
    Cleans markdown formatting and extracts the JSON object from model outputs.
    """
    content = raw_content.strip()
    
    # Strip markdown code blocks if present
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()

    # If extra text precedes or follows the json object, isolate the outer {}
    if not (content.startswith("{") and content.endswith("}")):
        match = re.search(r'(\{[\s\S]*\})', content)
        if match:
            content = match.group(1).strip()

    return json.loads(content)

def normalize_extraction_payload(
    parsed_json: Dict[str, Any],
    source_note: str,
    event_timestamp: Optional[str],
    model_used: str,
    default_confidence: float = 0.95
) -> ExtractionPayload:
    """
    Defensively parses and validates dictionary into an ExtractionPayload instance.
    """
    meds = []
    for m in parsed_json.get("medications", []):
        if isinstance(m, dict) and m.get("name"):
            meds.append(MedicationItem(
                name=str(m["name"]).strip(),
                dosage=str(m["dosage"]).strip() if m.get("dosage") else None,
                route=str(m["route"]).strip() if m.get("route") else None,
                timestamp=str(m["timestamp"]).strip() if m.get("timestamp") else None,
                source_text=str(m["source_text"]).strip() if m.get("source_text") else None
            ))
        elif isinstance(m, str) and m.strip():
            meds.append(MedicationItem(name=m.strip()))

    procs = []
    for p in parsed_json.get("procedures", []):
        if isinstance(p, dict) and p.get("name"):
            procs.append(ProcedureItem(
                name=str(p["name"]).strip(),
                timestamp=str(p["timestamp"]).strip() if p.get("timestamp") else None,
                source_text=str(p["source_text"]).strip() if p.get("source_text") else None
            ))
        elif isinstance(p, str) and p.strip():
            procs.append(ProcedureItem(name=p.strip()))

    obs = [str(o).strip() for o in parsed_json.get("observations", []) if o]
    missing = [str(x).strip() for x in parsed_json.get("missing_information", []) if x]
    ts = parsed_json.get("event_timestamp") or event_timestamp
    conf = parsed_json.get("extraction_confidence", default_confidence)

    return ExtractionPayload(
        event_timestamp=ts,
        source_note=source_note,
        medications=meds,
        procedures=procs,
        observations=obs,
        missing_information=missing,
        extraction_confidence=conf,
        model_used=model_used
    )

