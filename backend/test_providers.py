import asyncio
import json
from httpx import AsyncClient, ASGITransport, Response
from unittest.mock import patch, MagicMock
from app.main import app
from app.core.config import settings
from app.services.ollama_client import check_ollama_health, extract_with_ollama
from app.services.nebius_client import extract_with_nebius, extract_with_demo
from app.services.ai_service import dispatch_extract_note
from fastapi import HTTPException

SAMPLE_NOTE = (
    "Patient found conscious after a fall. First responder administered 500 milligrams "
    "of a fictional demo medication named DemoMed by oral route at 10:15 AM. "
    "A basic wound dressing procedure was performed at 10:20 AM. "
    "Patient was reassessed at 10:30 AM."
)

SAMPLE_LLM_JSON = {
    "event_timestamp": "10:15 AM",
    "source_note": SAMPLE_NOTE,
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
        "Vital signs not documented"
    ],
    "extraction_confidence": 0.98
}

async def run_all_provider_tests():
    print("=" * 70)
    print(" FIELDSCRIBE EDGE - MULTI-PROVIDER & OLLAMA TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. Test Demo Mode Extraction (Zero Cloud/Offline Mode)
    # -------------------------------------------------------------
    print("\n[Test 1] Testing Demo Mode (AI_PROVIDER=demo)...")
    settings.AI_PROVIDER = "demo"
    demo_res = await dispatch_extract_note(SAMPLE_NOTE, "10:15 AM")
    print(f"  Model Used: {demo_res.model_used}")
    print(f"  Medications Found: {[m.name for m in demo_res.medications]}")
    assert len(demo_res.medications) >= 1
    assert demo_res.medications[0].name.lower() == "demomed"
    assert demo_res.medications[0].dosage == "500 milligrams"
    assert demo_res.medications[0].route == "oral"
    assert len(demo_res.procedures) >= 1
    print("  [PASS] Demo Mode extracted clinical entities accurately.")

    # -------------------------------------------------------------
    # 2. Test Ollama: Server Unavailable (503 Service Unavailable)
    # -------------------------------------------------------------
    print("\n[Test 2] Testing Ollama: Server Unavailable handling...")
    settings.AI_PROVIDER = "ollama"
    settings.OLLAMA_BASE_URL = "http://127.0.0.1:59999"  # Non-existent port
    
    server_down_caught = False
    try:
        await extract_with_ollama(SAMPLE_NOTE, "10:15 AM")
    except HTTPException as e:
        server_down_caught = True
        print(f"  Captured Expected HTTPException ({e.status_code}): {e.detail[:90]}...")
        assert e.status_code == 503
        assert "unavailable" in e.detail.lower() or "ollama serve" in e.detail.lower()
    assert server_down_caught, "Expected HTTPException 503 for unavailable Ollama daemon."
    print("  [PASS] Ollama unavailable handled cleanly with actionable instructions.")

    # Reset base URL
    settings.OLLAMA_BASE_URL = "http://localhost:11434"

    # -------------------------------------------------------------
    # 3. Test Ollama: Model Not Found (404 Not Found)
    # -------------------------------------------------------------
    print("\n[Test 3] Testing Ollama: Model Not Installed (404)...")
    mock_404_resp = MagicMock()
    mock_404_resp.status_code = 404
    mock_404_resp.text = '{"error": "model \'nemotron-nonexistent\' not found, try pulling it first"}'

    model_404_caught = False
    with patch("httpx.AsyncClient.post", return_value=mock_404_resp):
        try:
            await extract_with_ollama(SAMPLE_NOTE, "10:15 AM")
        except HTTPException as e:
            model_404_caught = True
            print(f"  Captured Expected HTTPException ({e.status_code}): {e.detail}")
            assert e.status_code == 404
            assert "ollama pull" in e.detail
    assert model_404_caught, "Expected HTTPException 404 for missing model."
    print("  [PASS] Ollama model-not-found returns explicit 'ollama pull' command guidance.")

    # -------------------------------------------------------------
    # 4. Test Ollama: Malformed/Invalid JSON Response (502 Bad Gateway)
    # -------------------------------------------------------------
    print("\n[Test 4] Testing Ollama: Malformed JSON output handling...")
    mock_bad_resp = MagicMock()
    mock_bad_resp.status_code = 200
    mock_bad_resp.json.return_value = {
        "model": "nemotron-mini",
        "message": {"role": "assistant", "content": "This is raw unformatted text without braces or JSON structure"}
    }

    malformed_caught = False
    with patch("httpx.AsyncClient.post", return_value=mock_bad_resp):
        try:
            await extract_with_ollama(SAMPLE_NOTE, "10:15 AM")
        except HTTPException as e:
            malformed_caught = True
            print(f"  Captured Expected HTTPException ({e.status_code}): {e.detail[:80]}...")
            assert e.status_code == 502
            assert "malformed or unparseable" in e.detail
    assert malformed_caught, "Expected HTTPException 502 for malformed JSON."
    print("  [PASS] Ollama malformed output rejected safely without silent failure.")

    # -------------------------------------------------------------
    # 5. Test Ollama: Successful Structured Generation
    # -------------------------------------------------------------
    print("\n[Test 5] Testing Ollama: Successful Structured JSON Generation...")
    mock_good_resp = MagicMock()
    mock_good_resp.status_code = 200
    mock_good_resp.json.return_value = {
        "model": "nemotron-mini",
        "message": {
            "role": "assistant",
            "content": f"```json\n{json.dumps(SAMPLE_LLM_JSON)}\n```"
        }
    }

    with patch("httpx.AsyncClient.post", return_value=mock_good_resp):
        result = await extract_with_ollama(SAMPLE_NOTE, "10:15 AM")
        print(f"  Model Used: {result.model_used}")
        print(f"  Extracted Meds: {[m.name for m in result.medications]}")
        print(f"  Extracted Procedures: {[p.name for p in result.procedures]}")
        assert result.model_used == f"Ollama Local ({settings.OLLAMA_MODEL})"
        assert len(result.medications) == 1
        assert result.medications[0].name == "DemoMed"
        assert result.medications[0].dosage == "500 milligrams"
        assert result.medications[0].route == "oral"
        assert len(result.procedures) == 1
        assert result.procedures[0].name == "basic wound dressing"
        assert len(result.observations) == 2
        assert len(result.missing_information) == 1
    print("  [PASS] Ollama structured JSON extraction and Pydantic validation successful.")

    # -------------------------------------------------------------
    # 6. Test Nebius: Missing API Key (401 Unauthorized)
    # -------------------------------------------------------------
    print("\n[Test 6] Testing Nebius: Missing API Key handling...")
    settings.AI_PROVIDER = "nebius"
    settings.NEBIUS_API_KEY = ""
    nebius_key_caught = False
    try:
        await extract_with_nebius(SAMPLE_NOTE, "10:15 AM")
    except HTTPException as e:
        nebius_key_caught = True
        print(f"  Captured Expected HTTPException ({e.status_code}): {e.detail}")
        assert e.status_code == 401
        assert "NEBIUS_API_KEY is not configured" in e.detail
    assert nebius_key_caught, "Expected 401 when NEBIUS_API_KEY is missing."
    print("  [PASS] Nebius unconfigured key raises explicit 401 without silent fallback.")

    # -------------------------------------------------------------
    # 7. Test Nebius: Successful Structured Extraction (Mocked)
    # -------------------------------------------------------------
    print("\n[Test 7] Testing Nebius: Successful Extraction...")
    settings.NEBIUS_API_KEY = "test_mock_key_nebius_12345"
    mock_nebius_resp = MagicMock()
    mock_nebius_resp.status_code = 200
    mock_nebius_resp.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": json.dumps(SAMPLE_LLM_JSON)
                }
            }
        ]
    }
    with patch("httpx.AsyncClient.post", return_value=mock_nebius_resp):
        nebius_res = await extract_with_nebius(SAMPLE_NOTE, "10:15 AM")
        print(f"  Model Used: {nebius_res.model_used}")
        assert "Nebius Token Factory" in nebius_res.model_used
        assert len(nebius_res.medications) == 1
    print("  [PASS] Nebius Token Factory extraction and validation verified.")

    # -------------------------------------------------------------
    # 8. Test Provider Selection & Unknown Provider Error
    # -------------------------------------------------------------
    print("\n[Test 8] Testing Provider Selection & Validation...")
    settings.AI_PROVIDER = "unknown_provider_xyz"
    unknown_caught = False
    try:
        await dispatch_extract_note(SAMPLE_NOTE)
    except HTTPException as e:
        unknown_caught = True
        print(f"  Captured Expected HTTPException ({e.status_code}): {e.detail}")
        assert e.status_code == 400
        assert "Unsupported AI_PROVIDER" in e.detail
    assert unknown_caught
    print("  [PASS] Invalid AI_PROVIDER safely rejected with 400 Bad Request.")

    # -------------------------------------------------------------
    # 9. Test GET /health with Provider Details
    # -------------------------------------------------------------
    print("\n[Test 9] Testing GET /health endpoint...")
    settings.AI_PROVIDER = "ollama"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/health")
        assert r.status_code == 200
        data = r.json()
        print(f"  Status: {data['status']}")
        print(f"  Provider: {data['provider']}")
        print(f"  Active Engine: {data['active_engine']}")
        print(f"  Ollama Config: {data['ollama']}")
        assert data["provider"] == "ollama"
        assert "ollama" in data
        assert "nebius" in data
        assert "nebius_integration" in data
    print("  [PASS] GET /health accurately reflects active multi-provider architecture.")

    # Restore default provider
    settings.AI_PROVIDER = "ollama"
    settings.NEBIUS_API_KEY = ""

    print("\n" + "=" * 70)
    print(" ALL 9 MULTI-PROVIDER & OLLAMA TESTS PASSED (100%)!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_all_provider_tests())
