import asyncio
import sys
import httpx
from app.main import app
from app.core.config import settings

async def verify_e2e_workflow():
    print("=" * 65)
    print(" FIELDSCRIBE EDGE - END-TO-END WORKFLOW INTEGRITY TEST")
    print("=" * 65)

    original_provider = settings.AI_PROVIDER
    settings.AI_PROVIDER = "demo"

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://127.0.0.1:8000") as client:
        
        # 1. Health & Config Verification
        print("\n[Step 1] Verifying Backend Health & Provider Config...")
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.status_code}"
        health = res.json()
        print(f" Status: {health['status']}")
        print(f" Active Provider: {health['provider']}")
        print(f" Active Engine: {health['active_engine']}")
        print(f" Ollama Config: {health['ollama']}")
        print(f" Nebius API Endpoint: {health['nebius']['api_endpoint']}")

        # 2. Extract Note
        test_note = (
            "Patient found conscious after a fall. First responder administered 500 milligrams "
            "of a fictional demo medication named DemoMed by oral route at 10:15 AM. "
            "A basic wound dressing procedure was performed at 10:20 AM. "
            "Patient was reassessed at 10:30 AM."
        )
        print("\n[Step 2] Sending Note to /api/notes/extract...")
        print(f" Source Note: \"{test_note}\"")
        res = await client.post("/api/notes/extract", json={"text": test_note, "event_timestamp": "10:15 AM"})
        assert res.status_code == 200, f"Extract failed: {res.status_code}"
        extracted = res.json()
        print(f" Model Used: {extracted['model_used']}")
        print(f" Extracted Medications ({len(extracted['medications'])}):")
        for m in extracted['medications']:
            print(f"   - Name: {m['name']}, Dose: {m['dosage']}, Route: {m['route']}, Time: {m['timestamp']}")
        print(f" Extracted Procedures ({len(extracted['procedures'])}):")
        for p in extracted['procedures']:
            print(f"   - Name: {p['name']}, Time: {p['timestamp']}")
        print(f" Observations: {extracted['observations']}")
        print(f" Missing Info Flags: {extracted['missing_information']}")

        # Assertions
        assert len(extracted['medications']) >= 1
        assert extracted['medications'][0]['name'].lower() == 'demomed'
        assert extracted['medications'][0]['dosage'] == '500 milligrams'
        assert extracted['medications'][0]['route'].lower() == 'oral'
        assert extracted['medications'][0]['timestamp'] == '10:15 AM'
        assert len(extracted['procedures']) >= 1
        assert 'dressing' in extracted['procedures'][0]['name'].lower()

        # 3. Create Draft Record
        print("\n[Step 3] Persisting Draft Record via POST /api/records...")
        res = await client.post("/api/records", json={
            "source_note": extracted["source_note"],
            "event_timestamp": extracted["event_timestamp"],
            "medications": extracted["medications"],
            "procedures": extracted["procedures"],
            "observations": extracted["observations"],
            "missing_information": extracted["missing_information"],
            "extraction_confidence": extracted["extraction_confidence"],
            "model_used": extracted["model_used"]
        })
        assert res.status_code == 200
        record = res.json()
        rec_id = record["record_id"]
        print(f" Created Record: {rec_id} (Status: {record['review_status']})")

        # 4. Human-in-the-Loop Edit
        print("\n[Step 4] Simulating Human-in-the-Loop Review Edit via PATCH...")
        res = await client.patch(f"/api/records/{rec_id}", json={
            "reviewer_notes": "Responder reviewed with triage nurse. Dose confirmed.",
            "review_status": "reviewed"
        })
        assert res.status_code == 200
        updated = res.json()
        print(f" Updated Status: {updated['review_status']}")
        print(f" Human Edited Flag: {updated['human_edited']}")
        print(f" Reviewer Notes: {updated['reviewer_notes']}")
        assert updated['review_status'] == 'reviewed'
        assert updated['human_edited'] is True

        # 5. Confirm and Lock Record
        print("\n[Step 5] Confirming & Locking Record via POST .../confirm...")
        res = await client.post(f"/api/records/{rec_id}/confirm", json={
            "reviewer_notes": "Official attestation complete by Paramedic Unit 4."
        })
        assert res.status_code == 200
        confirmed = res.json()
        print(f" Confirmed Status: {confirmed['review_status']}")
        print(f" Confirmed At: {confirmed['confirmed_at']}")
        assert confirmed['review_status'] == 'confirmed'
        assert confirmed['confirmed_at'] is not None

        # 6. Export to FHIR-Lite R4
        print("\n[Step 6] Exporting to HL7 FHIR-Lite R4 Bundle...")
        res = await client.get(f"/api/records/{rec_id}/export?format=fhir")
        assert res.status_code == 200
        fhir_bundle = res.json()
        print(f" ResourceType: {fhir_bundle['resourceType']}")
        print(f" Bundle Type: {fhir_bundle['type']}")
        print(f" Profile: {fhir_bundle['meta']['profile']}")
        print(f" Total FHIR Resources: {len(fhir_bundle['entry'])}")
        types_in_bundle = [e['resource']['resourceType'] for e in fhir_bundle['entry']]
        print(f" Resources Included: {', '.join(types_in_bundle)}")
        assert fhir_bundle['resourceType'] == 'Bundle'
        assert 'Composition' in types_in_bundle
        assert 'MedicationAdministration' in types_in_bundle
        assert 'Procedure' in types_in_bundle

        # 7. Export Narrative Note
        print("\n[Step 7] Exporting Human-Readable Narrative Clinical Summary...")
        res = await client.get(f"/api/records/{rec_id}/export?format=narrative")
        assert res.status_code == 200
        narrative = res.text
        print(" Narrative Excerpt:")
        for line in narrative.splitlines()[:14]:
            print(f"   | {line}")
        assert "FIELDSCRIBE EDGE" in narrative
        assert "DEMOMED" in narrative.upper()

        settings.AI_PROVIDER = original_provider
        print("\n" + "=" * 65)
        print(" ALL 7 END-TO-END WORKFLOW INTEGRITY CHECKS PASSED 100%!")
        print("=" * 65)

if __name__ == "__main__":
    asyncio.run(verify_e2e_workflow())
