import os
import json
from datetime import datetime
from typing import List, Optional, Dict
from app.schemas.clinical import ClinicalRecord, MedicationItem, ProcedureItem

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
DATA_FILE = os.path.join(DATA_DIR, "records.json")

# In-memory record store
_records_store: Dict[str, ClinicalRecord] = {}

def init_storage():
    """Initializes persistent storage without any hardcoded demo data."""
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                _records_store.clear()
                for item in data:
                    rec = ClinicalRecord(**item)
                    _records_store[rec.record_id] = rec
                return
        except Exception:
            pass

    _records_store.clear()
    save_storage()

def save_storage():
    """Saves records to local JSON file."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        data = [rec.model_dump() for rec in _records_store.values()]
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error persisting records: {e}")

def list_records(search: Optional[str] = None, status: Optional[str] = None) -> List[ClinicalRecord]:
    init_storage()
    records = list(_records_store.values())
    
    if status and status != "all":
        records = [r for r in records if r.review_status == status.lower()]
        
    if search:
        q = search.lower().strip()
        records = [
            r for r in records
            if q in r.record_id.lower()
            or q in r.source_note.lower()
            or any(q in m.name.lower() for m in r.medications)
            or any(q in p.name.lower() for p in r.procedures)
        ]
        
    # Sort descending by updated_at
    records.sort(key=lambda r: r.updated_at, reverse=True)
    return records

def get_record(record_id: str) -> Optional[ClinicalRecord]:
    init_storage()
    return _records_store.get(record_id)

def create_record(data: Dict) -> ClinicalRecord:
    init_storage()
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    # Generate sequential unique record ID: FS-REC-001, FS-REC-002, etc.
    existing_nums = []
    for r_id in _records_store.keys():
        if r_id.startswith("FS-"):
            try:
                existing_nums.append(int(r_id.split("-")[-1]))
            except ValueError:
                pass
    next_num = (max(existing_nums) + 1) if existing_nums else 1
    record_id = f"FS-REC-{next_num:03d}"

    rec = ClinicalRecord(
        record_id=record_id,
        event_timestamp=data.get("event_timestamp"),
        source_note=data.get("source_note", ""),
        medications=[MedicationItem(**m) if isinstance(m, dict) else m for m in data.get("medications", [])],
        procedures=[ProcedureItem(**p) if isinstance(p, dict) else p for p in data.get("procedures", [])],
        observations=data.get("observations", []),
        missing_information=data.get("missing_information", []),
        review_status=data.get("review_status", "pending"),
        extraction_confidence=data.get("extraction_confidence", 0.95),
        model_used=data.get("model_used"),
        created_at=now_iso,
        updated_at=now_iso,
        confirmed_at=None,
        reviewer_notes=None,
        human_edited=False
    )
    _records_store[record_id] = rec
    save_storage()
    return rec

def update_record(record_id: str, updates: Dict) -> Optional[ClinicalRecord]:
    init_storage()
    rec = _records_store.get(record_id)
    if not rec:
        return None
    
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    if "source_note" in updates and updates["source_note"] is not None:
        rec.source_note = updates["source_note"]
    if "event_timestamp" in updates:
        rec.event_timestamp = updates["event_timestamp"]
    if "medications" in updates and updates["medications"] is not None:
        rec.medications = [MedicationItem(**m) if isinstance(m, dict) else m for m in updates["medications"]]
        rec.human_edited = True
    if "procedures" in updates and updates["procedures"] is not None:
        rec.procedures = [ProcedureItem(**p) if isinstance(p, dict) else p for p in updates["procedures"]]
        rec.human_edited = True
    if "observations" in updates and updates["observations"] is not None:
        rec.observations = updates["observations"]
        rec.human_edited = True
    if "missing_information" in updates and updates["missing_information"] is not None:
        rec.missing_information = updates["missing_information"]
        rec.human_edited = True
    if "review_status" in updates and updates["review_status"] is not None:
        rec.review_status = updates["review_status"]
    if "reviewer_notes" in updates and updates["reviewer_notes"] is not None:
        rec.reviewer_notes = updates["reviewer_notes"]
        rec.human_edited = True
        
    rec.updated_at = now_iso
    save_storage()
    return rec

def confirm_record(record_id: str, reviewer_notes: Optional[str] = None) -> Optional[ClinicalRecord]:
    init_storage()
    rec = _records_store.get(record_id)
    if not rec:
        return None
    
    now_iso = datetime.utcnow().isoformat() + "Z"
    rec.review_status = "confirmed"
    rec.confirmed_at = now_iso
    rec.updated_at = now_iso
    rec.human_edited = True
    if reviewer_notes:
        rec.reviewer_notes = reviewer_notes
    save_storage()
    return rec
