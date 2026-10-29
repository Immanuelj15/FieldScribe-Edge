from typing import Dict, Any
from app.schemas.clinical import ClinicalRecord

def convert_to_fhir_lite(record: ClinicalRecord) -> Dict[str, Any]:
    """
    Transforms a FieldScribe Edge ClinicalRecord into a FHIR-lite JSON Bundle.
    DISCLAIMER: This is a demo-level FHIR R4-inspired representation intended for
    hackathon demonstration and interoperability illustration, not certified FHIR production exchange.
    """
    entries = []
    
    # 1. Document / Composition representation
    composition_entry = {
        "fullUrl": f"urn:uuid:composition-{record.record_id}",
        "resource": {
            "resourceType": "Composition",
            "id": f"composition-{record.record_id}",
            "status": "final" if record.review_status == "confirmed" else "preliminary",
            "type": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "67796-3",
                        "display": "EMS Patient Care Report narrative"
                    }
                ],
                "text": "Emergency Medical Services Encounter Note"
            },
            "date": record.event_timestamp or record.created_at,
            "title": f"FieldScribe Edge First Responder Report - {record.record_id}",
            "section": [
                {
                    "title": "Verbatim Source Note",
                    "text": {
                        "status": "additional",
                        "div": f"<div>{record.source_note}</div>"
                    }
                }
            ]
        }
    }
    entries.append(composition_entry)

    # 2. MedicationAdministration entries
    for idx, med in enumerate(record.medications, 1):
        med_entry = {
            "fullUrl": f"urn:uuid:medication-admin-{record.record_id}-{idx}",
            "resource": {
                "resourceType": "MedicationAdministration",
                "id": f"medadmin-{record.record_id}-{idx}",
                "status": "completed",
                "medicationCodeableConcept": {
                    "text": med.name
                },
                "effectiveDateTime": med.timestamp or record.event_timestamp,
                "dosage": {
                    "text": med.dosage or "Unspecified dose",
                    "route": {
                        "text": med.route or "Unspecified route"
                    }
                },
                "note": [
                    {
                        "text": f"Verbatim source: '{med.source_text}'" if med.source_text else "Extracted by FieldScribe Edge"
                    }
                ]
            }
        }
        entries.append(med_entry)

    # 3. Procedure entries
    for idx, proc in enumerate(record.procedures, 1):
        proc_entry = {
            "fullUrl": f"urn:uuid:procedure-{record.record_id}-{idx}",
            "resource": {
                "resourceType": "Procedure",
                "id": f"procedure-{record.record_id}-{idx}",
                "status": "completed",
                "code": {
                    "text": proc.name
                },
                "performedDateTime": proc.timestamp or record.event_timestamp,
                "note": [
                    {
                        "text": f"Verbatim source: '{proc.source_text}'" if proc.source_text else "Documented by responder"
                    }
                ]
            }
        }
        entries.append(proc_entry)

    # 4. Observation entries
    for idx, obs in enumerate(record.observations, 1):
        obs_entry = {
            "fullUrl": f"urn:uuid:observation-{record.record_id}-{idx}",
            "resource": {
                "resourceType": "Observation",
                "id": f"observation-{record.record_id}-{idx}",
                "status": "final",
                "code": {
                    "text": "First Responder Field Observation"
                },
                "valueString": obs
            }
        }
        entries.append(obs_entry)

    bundle = {
        "resourceType": "Bundle",
        "id": f"bundle-fieldscribe-{record.record_id}",
        "type": "document",
        "timestamp": record.updated_at,
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/Bundle"],
            "tag": [
                {
                    "system": "https://fieldscribe.edge/tags",
                    "code": "demo-fhir-lite",
                    "display": "FieldScribe Edge FHIR-Lite Prototype Format"
                }
            ]
        },
        "disclaimer": "FHIR-lite prototype representation for hackathon demonstration. Not certified for clinical interchange.",
        "entry": entries
    }

    return bundle

def generate_readable_clinical_note(record: ClinicalRecord) -> str:
    """
    Generates a standardized human-readable text EMS clinical summary note.
    """
    lines = [
        "=======================================================================",
        "        FIELDSCRIBE EDGE - FIRST RESPONDER CLINICAL SUMMARY NOTE",
        "=======================================================================",
        f"Record ID:        {record.record_id}",
        f"Event Timestamp:  {record.event_timestamp or 'Not explicitly documented'}",
        f"Review Status:    {record.review_status.upper()}",
        f"Confirmed At:     {record.confirmed_at or 'Pending Confirmation'}",
        f"AI Engine:        {record.model_used or 'NVIDIA Open-Source via Nebius'}",
        f"Extraction Conf:  {f'{int(record.extraction_confidence * 100)}%' if record.extraction_confidence else 'N/A'}",
        "-----------------------------------------------------------------------",
        "ORIGINAL FIRST-RESPONDER SOURCE NOTE (VERBATIM):",
        f"\"{record.source_note}\"",
        "-----------------------------------------------------------------------",
        "ADMINISTERED MEDICATIONS:"
    ]

    if record.medications:
        for idx, m in enumerate(record.medications, 1):
            route_str = f" via {m.route}" if m.route else " (route omitted)"
            dose_str = f" [{m.dosage}]" if m.dosage else " [dose omitted]"
            time_str = f" at {m.timestamp}" if m.timestamp else ""
            lines.append(f"  {idx}. {m.name}{dose_str}{route_str}{time_str}")
            if m.source_text:
                lines.append(f"     Source text: \"{m.source_text}\"")
    else:
        lines.append("  (None documented)")

    lines.extend([
        "-----------------------------------------------------------------------",
        "PROCEDURES & INTERVENTIONS:"
    ])

    if record.procedures:
        for idx, p in enumerate(record.procedures, 1):
            time_str = f" at {p.timestamp}" if p.timestamp else ""
            lines.append(f"  {idx}. {p.name}{time_str}")
            if p.source_text:
                lines.append(f"     Source text: \"{p.source_text}\"")
    else:
        lines.append("  (None documented)")

    lines.extend([
        "-----------------------------------------------------------------------",
        "EXPLICIT CLINICAL OBSERVATIONS:"
    ])

    if record.observations:
        for obs in record.observations:
            lines.append(f"  * {obs}")
    else:
        lines.append("  (None documented)")

    lines.extend([
        "-----------------------------------------------------------------------",
        "MISSING DOCUMENTATION / AUDIT FLAGS:"
    ])

    if record.missing_information:
        for miss in record.missing_information:
            lines.append(f"  ! {miss}")
    else:
        lines.append("  No documentation gaps flagged.")

    if record.reviewer_notes:
        lines.extend([
            "-----------------------------------------------------------------------",
            "HUMAN REVIEWER ATTESTATION & NOTES:",
            f"{record.reviewer_notes}"
        ])

    lines.extend([
        "=======================================================================",
        "DISCLAIMER: FieldScribe Edge is an AI documentation assistant developed",
        "for the Nebius x NVIDIA Hackathon 2026. This record is for demonstration",
        "and was reviewed by human responder. Not a diagnostic/treatment recommendation.",
        "======================================================================="
    ])

    return "\n".join(lines)
