from typing import List, Optional
from pydantic import BaseModel, Field

class MedicationItem(BaseModel):
    name: str = Field(description="Generic or brand name of medication explicitly mentioned")
    dosage: Optional[str] = Field(default=None, description="Dosage and unit, e.g., '500 mg', '0.4 mg sublingual'")
    route: Optional[str] = Field(default=None, description="Administration route, e.g., 'oral', 'IV', 'IM', 'sublingual'")
    timestamp: Optional[str] = Field(default=None, description="Time medication was given, e.g., '10:15 AM' or ISO format")
    source_text: Optional[str] = Field(default=None, description="Exact verbatim text snippet from source note")

class ProcedureItem(BaseModel):
    name: str = Field(description="Name of clinical procedure performed")
    timestamp: Optional[str] = Field(default=None, description="Time procedure was performed")
    source_text: Optional[str] = Field(default=None, description="Exact verbatim text snippet from source note")

class ExtractionPayload(BaseModel):
    event_timestamp: Optional[str] = None
    source_note: str
    medications: List[MedicationItem] = []
    procedures: List[ProcedureItem] = []
    observations: List[str] = []
    missing_information: List[str] = []
    extraction_confidence: Optional[float] = None
    model_used: Optional[str] = None

class ClinicalRecord(BaseModel):
    record_id: str
    event_timestamp: Optional[str] = None
    source_note: str
    medications: List[MedicationItem] = []
    procedures: List[ProcedureItem] = []
    observations: List[str] = []
    missing_information: List[str] = []
    review_status: str = Field(default="pending", description="'pending' | 'reviewed' | 'confirmed'")
    extraction_confidence: Optional[float] = None
    model_used: Optional[str] = None
    created_at: str
    updated_at: str
    confirmed_at: Optional[str] = None
    reviewer_notes: Optional[str] = None
    human_edited: bool = False

class ExtractRequest(BaseModel):
    text: str
    event_timestamp: Optional[str] = None

class CreateRecordRequest(BaseModel):
    source_note: str
    event_timestamp: Optional[str] = None
    medications: List[MedicationItem] = []
    procedures: List[ProcedureItem] = []
    observations: List[str] = []
    missing_information: List[str] = []
    extraction_confidence: Optional[float] = None
    model_used: Optional[str] = None

class UpdateRecordRequest(BaseModel):
    source_note: Optional[str] = None
    event_timestamp: Optional[str] = None
    medications: Optional[List[MedicationItem]] = None
    procedures: Optional[List[ProcedureItem]] = None
    observations: Optional[List[str]] = None
    missing_information: Optional[List[str]] = None
    review_status: Optional[str] = None
    reviewer_notes: Optional[str] = None

class ConfirmRecordRequest(BaseModel):
    reviewer_notes: Optional[str] = None
