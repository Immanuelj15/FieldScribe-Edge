import os
import json
from datetime import datetime
from typing import List, Optional, Dict
from app.schemas.clinical import ClinicalRecord, MedicationItem, ProcedureItem

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
DATA_FILE = os.path.join(DATA_DIR, "records.json")

# In-memory record store
_records_store: Dict[str, ClinicalRecord] = {}

SEED_RECORDS: List[Dict] = [
    {
        "record_id": "FS-DEMO-001",
        "event_timestamp": "10:15 AM",
        "source_note": "Patient found conscious after a fall. First responder administered 500 milligrams of a fictional demo medication named DemoMed by oral route at 10:15 AM. A basic wound dressing procedure was performed at 10:20 AM. Patient was reassessed at 10:30 AM.",
        "medications": [
            {
                "name": "DemoMed",
                "dosage": "500 milligrams",
                "route": "oral",
                "timestamp": "10:15 AM",
                "source_text": "administered 500 milligrams of a fictional demo medication named DemoMed by oral route at 10:15 AM"
            }
        ],
        "procedures": [
            {
                "name": "basic wound dressing",
                "timestamp": "10:20 AM",
                "source_text": "basic wound dressing procedure was performed at 10:20 AM"
            }
        ],
        "observations": [
            "Patient found conscious after a fall",
            "Patient was reassessed at 10:30 AM"
        ],
        "missing_information": [
            "No secondary vital signs (BP, SpO2) recorded in verbatim note"
        ],
        "review_status": "confirmed",
        "extraction_confidence": 0.98,
        "model_used": "Nebius Token Factory (nvidia/Llama-3.1-Nemotron-70B-Instruct-HF)",
        "created_at": "2026-10-29T10:32:00Z",
        "updated_at": "2026-10-29T10:35:12Z",
        "confirmed_at": "2026-10-29T10:35:12Z",
        "reviewer_notes": "Verified dosages and times against field dispatch logs. All accurate.",
        "human_edited": True
    },
    {
        "record_id": "FS-DEMO-002",
        "event_timestamp": "14:05",
        "source_note": "En route to severe allergic reaction. Administered 0.3 mg Epinephrine auto-injector by intramuscular route in right thigh at 14:05. High-flow oxygen via non-rebreather mask applied at 14:08. Wheezing decreased by 14:15.",
        "medications": [
            {
                "name": "Epinephrine auto-injector",
                "dosage": "0.3 mg",
                "route": "intramuscular (right thigh)",
                "timestamp": "14:05",
                "source_text": "Administered 0.3 mg Epinephrine auto-injector by intramuscular route in right thigh at 14:05"
            }
        ],
        "procedures": [
            {
                "name": "High-flow oxygen via non-rebreather mask",
                "timestamp": "14:08",
                "source_text": "High-flow oxygen via non-rebreather mask applied at 14:08"
            }
        ],
        "observations": [
            "En route to severe allergic reaction",
            "Wheezing decreased by 14:15"
        ],
        "missing_information": [
            "Oxygen flow rate in LPM omitted from source note"
        ],
        "review_status": "reviewed",
        "extraction_confidence": 0.95,
        "model_used": "Nebius Token Factory (nvidia/Llama-3.1-Nemotron-70B-Instruct-HF)",
        "created_at": "2026-10-29T14:18:00Z",
        "updated_at": "2026-10-29T14:22:00Z",
        "confirmed_at": None,
        "reviewer_notes": "Reviewed with attending paramedic. Awaiting physician sign-off.",
        "human_edited": False
    },
    {
        "record_id": "FS-DEMO-003",
        "event_timestamp": "18:40",
        "source_note": "Adult male experiencing chest tightness. Gave 324 mg chewable Aspirin orally at 18:40. 12-lead ECG procedure was performed at 18:45 showing sinus tachycardia. Nitroglycerin 0.4 mg sublingual administered at 18:48.",
        "medications": [
            {
                "name": "Aspirin (chewable)",
                "dosage": "324 mg",
                "route": "oral",
                "timestamp": "18:40",
                "source_text": "Gave 324 mg chewable Aspirin orally at 18:40"
            },
            {
                "name": "Nitroglycerin",
                "dosage": "0.4 mg",
                "route": "sublingual",
                "timestamp": "18:48",
                "source_text": "Nitroglycerin 0.4 mg sublingual administered at 18:48"
            }
        ],
        "procedures": [
            {
                "name": "12-lead ECG",
                "timestamp": "18:45",
                "source_text": "12-lead ECG procedure was performed at 18:45"
            }
        ],
        "observations": [
            "Adult male experiencing chest tightness",
            "ECG showed sinus tachycardia"
        ],
        "missing_information": [
            "Blood pressure reading prior to Nitroglycerin not explicitly stated in note"
        ],
        "review_status": "pending",
        "extraction_confidence": 0.94,
        "model_used": "Nebius Token Factory (nvidia/Llama-3.1-Nemotron-70B-Instruct-HF)",
        "created_at": "2026-10-29T18:52:00Z",
        "updated_at": "2026-10-29T18:52:00Z",
        "confirmed_at": None,
        "reviewer_notes": None,
        "human_edited": False
    }
]

def init_storage():
    """Initializes persistent storage and seeds if empty."""
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    rec = ClinicalRecord(**item)
                    _records_store[rec.record_id] = rec
                if _records_store:
                    return
        except Exception:
            pass

    # Seed default demo records
    for raw in SEED_RECORDS:
        rec = ClinicalRecord(**raw)
        _records_store[rec.record_id] = rec
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
    
    # Generate sequential unique record ID
    existing_nums = []
    for r_id in _records_store.keys():
        if r_id.startswith("FS-DEMO-"):
            try:
                existing_nums.append(int(r_id.split("-")[2]))
            except ValueError:
                pass
    next_num = (max(existing_nums) + 1) if existing_nums else 1
    record_id = f"FS-DEMO-{next_num:03d}"

    rec = ClinicalRecord(
        record_id=record_id,
        event_timestamp=data.get("event_timestamp"),
        source_note=data.get("source_note", ""),
        medications=[MedicationItem(**m) if isinstance(m, dict) else m for m in data.get("medications", [])],
        procedures=[ProcedureItem(**p) if isinstance(p, dict) else p for p in data.get("procedures", [])],
        observations=data.get("observations", []),
        missing_information=data.get("missing_information", []),
        review_status=data.get("review_status", "pending"),
        extraction_confidence=data.get("extraction_confidence", 0.92),
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
    if reviewer_notes:
        rec.reviewer_notes = reviewer_notes
    save_storage()
    return rec

