import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Response
from app.core.config import settings
from app.schemas.clinical import (
    ClinicalRecord,
    ExtractRequest,
    ExtractionPayload,
    CreateRecordRequest,
    UpdateRecordRequest,
    ConfirmRecordRequest
)
from app.services.ai_service import dispatch_extract_note, get_ai_service_status
from app.services.storage import (
    list_records,
    get_record,
    create_record,
    update_record,
    confirm_record
)
from app.services.fhir_converter import convert_to_fhir_lite, generate_readable_clinical_note

logger = logging.getLogger("fieldscribe.api")
router = APIRouter()

@router.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "provider": settings.AI_PROVIDER,
        "description": settings.DESCRIPTION,
        "hackathon": "Nebius x NVIDIA Global AI Hackathon 2026"
    }

@router.get("/health")
async def health_check():
    """
    Returns health status and AI engine configuration without exposing secrets.
    """
    ai_status = await get_ai_service_status()

    return {
        "status": "healthy",
        "version": settings.VERSION,
        "provider": ai_status["provider"],
        "active_engine": ai_status["active_engine"],
        "ollama": ai_status["ollama"],
        "nebius": ai_status["nebius"],
        # Backwards compatible block for older frontend versions & tests:
        "nebius_integration": ai_status["nebius_integration"],
        "target_hackathon": "Nebius x NVIDIA Global AI Hackathon 2026",
        "supported_features": [
            "Voice-to-Text via Web Speech API",
            "Local Ollama Inference (NVIDIA Nemotron-Mini / Open Models)",
            "Nebius Token Factory Cloud API Inference",
            "Pydantic Validation & Missing Information Flags",
            "Human-in-the-Loop Review & Attestation",
            "FHIR-Lite & Narrative Note Export"
        ]
    }

@router.post("/api/notes/transcribe")
async def transcribe_note():
    """
    Transcribe endpoint placeholder. Web Speech API is used client-side for low latency.
    """
    return {
        "message": "Web Speech API is preferred for real-time edge voice recognition in the browser.",
        "status": "active"
    }

@router.post("/api/notes/extract", response_model=ExtractionPayload)
async def extract_note(req: ExtractRequest):
    """
    Accepts typed or transcribed emergency medical note.
    Processes via the configured AI provider (Ollama, Nebius, or Demo).
    Returns validated structured extraction with missing information flags.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Source note text cannot be empty.")
    
    try:
        extraction = await dispatch_extract_note(req.text, req.event_timestamp)
        return extraction
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Extraction failed with unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"AI extraction error: {str(e)}")

@router.get("/api/records", response_model=List[ClinicalRecord])
async def get_all_records(
    search: Optional[str] = Query(None, description="Search term for note or medications"),
    status: Optional[str] = Query(None, description="Filter by review status: pending, reviewed, confirmed")
):
    """
    Returns list of clinical records with optional search and status filtering.
    """
    return list_records(search=search, status=status)

@router.get("/api/records/{record_id}", response_model=ClinicalRecord)
async def get_single_record(record_id: str):
    """
    Fetches a single clinical record by ID.
    """
    rec = get_record(record_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Record {record_id} not found.")
    return rec

@router.post("/api/records", response_model=ClinicalRecord)
async def create_new_record(req: CreateRecordRequest):
    """
    Creates a new draft clinical record from extracted data.
    """
    data = req.model_dump()
    new_rec = create_record(data)
    return new_rec

@router.patch("/api/records/{record_id}", response_model=ClinicalRecord)
async def update_existing_record(record_id: str, req: UpdateRecordRequest):
    """
    Updates record fields during human review.
    """
    updates = req.model_dump(exclude_unset=True)
    rec = update_record(record_id, updates)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Record {record_id} not found.")
    return rec

@router.post("/api/records/{record_id}/confirm", response_model=ClinicalRecord)
async def confirm_existing_record(record_id: str, req: ConfirmRecordRequest):
    """
    Marks a clinical record as verified and confirmed by a human responder.
    """
    rec = confirm_record(record_id, req.reviewer_notes)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Record {record_id} not found.")
    return rec

@router.get("/api/records/{record_id}/export")
async def export_record(
    record_id: str,
    format: str = Query("json", description="Export format: json | fhir | narrative")
):
    """
    Exports a clinical record in JSON, FHIR-lite, or plain-text clinical narrative format.
    """
    rec = get_record(record_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Record {record_id} not found.")
    
    if format.lower() == "fhir":
        fhir_bundle = convert_to_fhir_lite(rec)
        return fhir_bundle
    elif format.lower() == "narrative":
        narrative_text = generate_readable_clinical_note(rec)
        return Response(content=narrative_text, media_type="text/plain; charset=utf-8")
    else:
        # Default JSON export
        return rec.model_dump()
