import asyncio
import json
from app.main import app
from app.core.config import settings
from app.schemas.clinical import ExtractRequest, CreateRecordRequest, UpdateRecordRequest, ConfirmRecordRequest
from httpx import AsyncClient, ASGITransport

async def run_tests():
    # Save original provider and use demo for baseline CRUD/export pipeline verification
    original_provider = settings.AI_PROVIDER
    settings.AI_PROVIDER = "demo"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n--- 1. Testing GET / ---")
        r = await client.get("/")
        print("Status:", r.status_code, "Data:", r.json())
        assert r.status_code == 200

        print("\n--- 2. Testing GET /health ---")
        r = await client.get("/health")
        print("Status:", r.status_code, "Data:", r.json())
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

        print("\n--- 3. Testing POST /api/notes/extract ---")
        sample_note = "Patient found conscious after a fall. First responder administered 500 milligrams of a fictional demo medication named DemoMed by oral route at 10:15 AM. A basic wound dressing procedure was performed at 10:20 AM. Patient was reassessed at 10:30 AM."
        r = await client.post("/api/notes/extract", json={"text": sample_note, "event_timestamp": "10:15 AM"})
        print("Status:", r.status_code)
        extracted = r.json()
        print("Extracted Medications:", json.dumps(extracted["medications"], indent=2))
        print("Extracted Procedures:", json.dumps(extracted["procedures"], indent=2))
        print("Observations:", extracted["observations"])
        print("Missing info flags:", extracted["missing_information"])
        print("Model Used:", extracted["model_used"])
        assert r.status_code == 200
        assert len(extracted["medications"]) > 0
        assert extracted["medications"][0]["name"].lower() == "demomed"
        assert len(extracted["procedures"]) > 0

        print("\n--- 4. Testing POST /api/records (create new clinical record) ---")
        r = await client.post("/api/records", json={
            "source_note": sample_note,
            "event_timestamp": "10:15 AM",
            "medications": extracted["medications"],
            "procedures": extracted["procedures"],
            "observations": extracted["observations"],
            "missing_information": extracted["missing_information"],
            "model_used": extracted["model_used"]
        })
        new_rec = r.json()
        new_id = new_rec["record_id"]
        print("Created record ID:", new_id, "Status:", new_rec["review_status"])
        assert r.status_code == 200
        assert new_id.startswith("FS-REC-")

        print("\n--- 5. Testing GET /api/records/{new_id} ---")
        r = await client.get(f"/api/records/{new_id}")
        print("Status:", r.status_code, "ID:", r.json()["record_id"])
        assert r.status_code == 200
        assert r.json()["record_id"] == new_id

        print("\n--- 6. Testing GET /api/records ---")
        r = await client.get("/api/records")
        records = r.json()
        print("Status:", r.status_code, "Count:", len(records))
        assert r.status_code == 200
        assert len(records) >= 1

        print("\n--- 7. Testing PATCH /api/records/{new_id} (Human review edit) ---")
        r = await client.patch(f"/api/records/{new_id}", json={
            "reviewer_notes": "Reviewed and checked by Paramedic 402 on scene.",
            "review_status": "reviewed"
        })
        print("Status:", r.status_code, "Updated Review Status:", r.json()["review_status"])
        assert r.status_code == 200
        assert r.json()["review_status"] == "reviewed"

        print("\n--- 8. Testing POST /api/records/{new_id}/confirm ---")
        r = await client.post(f"/api/records/{new_id}/confirm", json={
            "reviewer_notes": "Officially confirmed and locked."
        })
        print("Status:", r.status_code, "Confirmed At:", r.json()["confirmed_at"])
        assert r.status_code == 200
        assert r.json()["review_status"] == "confirmed"

        print("\n--- 9. Testing GET /api/records/{new_id}/export?format=fhir ---")
        r = await client.get(f"/api/records/{new_id}/export?format=fhir")
        fhir = r.json()
        print("Status:", r.status_code, "FHIR ResourceType:", fhir["resourceType"], "Entries:", len(fhir["entry"]))
        assert r.status_code == 200
        assert fhir["resourceType"] == "Bundle"

        print("\n--- 10. Testing GET /api/records/{new_id}/export?format=narrative ---")
        r = await client.get(f"/api/records/{new_id}/export?format=narrative")
        print("Status:", r.status_code)
        print("Narrative snippet:\n", r.text[:250])
        assert r.status_code == 200
        assert "FIELDSCRIBE EDGE" in r.text

        # Restore original provider
        settings.AI_PROVIDER = original_provider
        print("\n ALL BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_tests())
