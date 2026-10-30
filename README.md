# FieldScribe Edge — Voice-to-Structured Clinical Note Generator
### Built for the Nebius x NVIDIA Global AI Hackathon 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Local Inference: Ollama](https://img.shields.io/badge/Local_AI-Ollama_Nemotron-06b6d4)](https://ollama.com/)
[![Cloud Inference: Nebius Token Factory](https://img.shields.io/badge/Cloud_Inference-Nebius_Token_Factory-0284c7)](https://studio.nebius.ai/)
[![Model: NVIDIA Nemotron](https://img.shields.io/badge/Models-NVIDIA_Nemotron_Family-76b900)](https://build.nvidia.com/)
[![FHIR Interoperability: FHIR-Lite](https://img.shields.io/badge/Export-FHIR--Lite_R4-emerald)](https://hl7.org/fhir/)

---

## 🚑 1. Executive Summary & Problem Statement

First responders, paramedics, and emergency medical technicians (EMTs) operate in chaotic, high-pressure environments where every second counts. During cardiac arrests, severe trauma, anaphylaxis, or overdose emergencies, responders administer high-potency medications, perform rapid interventions, and constantly reassess vitals.

However, clinical documentation often lags:
- **High Cognitive Load:** Writing notes by hand or typing on clunky laptops while navigating traffic or patient transport is difficult and hazardous.
- **Lost Context & Omissions:** Critical variables—such as exact administration timestamps, medication routes (IV vs. IM vs. sublingual), and vital reassessments—are easily forgotten or omitted.
- **Handoff Delays:** Transferring care to the emergency department triage team requires a clear, standardized summary. Incomplete handoffs lead to redundant testing, delayed interventions, or dangerous medication errors.
- **AI Hallucination Hazards:** Conventional large language models frequently invent medical dosages, infer unstated routes, or fabricate diagnoses—an unacceptable danger in clinical care.

### The Solution: FieldScribe Edge
**FieldScribe Edge** is an AI-powered voice-to-structured clinical documentation assistant that allows first responders to speak or type natural-language notes and instantly converts them into validated, reviewable, timestamped clinical records.

> **Crucial Safety Principle:** FieldScribe Edge is an objective **documentation assistant**, never a diagnostic or treatment recommendation system. It enforces a strict **Zero-Hallucination Fidelity Guard**: if an attribute was not explicitly spoken or typed, the AI flags it as missing rather than inventing data. All records require human review and verification before export.

---

## ⚡ 2. Multi-Provider AI Architecture (Ollama & Nebius)

FieldScribe Edge supports three operational modes via the `AI_PROVIDER` environment variable:

```
                      ┌──────────────────────────────────────────────┐
                      │            First Responder Note              │
                      │         (Web Speech Audio or Text)           │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │       FastAPI Backend (/api/notes/extract)   │
                      │           AI Service Dispatcher              │
                      └───────┬──────────────┬──────────────┬────────┘
                              │              │              │
      AI_PROVIDER=ollama      │              │              │ AI_PROVIDER=demo
    (Local Edge Inference)    │              │              │ (Deterministic Guard)
              ▼               ▼              │              ▼
    ┌──────────────────┐                     │     ┌──────────────────┐
    │  Ollama Daemon   │  AI_PROVIDER=nebius │     │ Rule-Based Demo  │
    │ (localhost:11434)│ (Cloud Token Fact.) │     │   Safe Engine    │
    │  NVIDIA Nemotron │                     │     └────────┬─────────┘
    └─────────┬────────┘                     ▼              │
              │                 ┌──────────────────┐        │
              │                 │   Nebius Cloud   │        │
              │                 │ Token Factory API│        │
              │                 │  Nemotron-70B-HF │        │
              │                 └────────┬─────────┘        │
              │                          │                  │
              └──────────────────┬───────┴──────────────────┘
                                 │
                                 ▼
                      ┌──────────────────────────────────────────────┐
                      │         Pydantic Schema Validation           │
                      │          Zero-Hallucination Guard            │
                      └──────────────────┬───────────────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────────────┐
                      │    Human Review, Confirmation & Attestation  │
                      └──────────────────┬───────────────────────────┘
                                         │
                         ┌───────────────┼───────────────┐
                         ▼               ▼               ▼
                  [Standard JSON]  [FHIR-Lite R4]  [Narrative Text]
```

### Provider Details

| Provider Mode | Engine | Models Supported | Best For |
|---|---|---|---|
| `AI_PROVIDER=ollama` | **Local Ollama Daemon** (`http://localhost:11434`) | `nemotron`, `nemotron-mini`, `llama3.2:3b`, `mistral`, `qwen2.5-coder` | **Offline field use, zero cloud dependency, student laptops, local GPU/CPU execution** |
| `AI_PROVIDER=nebius` | **Nebius Token Factory Cloud** (`https://api.studio.nebius.ai/v1`) | `nvidia/Llama-3.1-Nemotron-70B-Instruct-HF`, `meta-llama/Meta-Llama-3.1-70B-Instruct` | **Enterprise high-throughput GPU cloud inference** |
| `AI_PROVIDER=demo` | **Deterministic Safety Engine** | Built-in regex clinical entity extractor | **Instant evaluation, unit testing, offline demonstrations** |

> **No Silent Fallbacks:** When `AI_PROVIDER=ollama` or `AI_PROVIDER=nebius` is active, the application does **not** silently swallow errors into demo mode. If Ollama is unreachable or a model is missing, the backend returns clear HTTP error codes (503 / 404 / 401) with explicit terminal remediation instructions.

---

## 💻 3. Local Setup with Ollama (Windows PowerShell)

FieldScribe Edge can run 100% locally on your computer with Ollama.

### Step 3.1: Install Ollama on Windows

If Ollama is not already installed, run in PowerShell:
```powershell
winget install Ollama.Ollama
```
*Or download the installer directly from [ollama.com](https://ollama.com/download).*

Verify installation:
```powershell
ollama --version
```

### Step 3.2: Start the Ollama Daemon
If Ollama is not running in your system tray, start it in a PowerShell terminal:
```powershell
ollama serve
```
*(Leave this window open or let the background process run).*

### Step 3.3: Download a Recommended Model

#### Recommended Models for Student Laptops:
- **`nemotron` / `nemotron:latest`** (NVIDIA Nemotron 4B / Mini, ~2.8 GB): **Recommended default!**
- **`llama3.2:3b`** (Meta Llama 3.2 3B, ~2.0 GB): Extremely fast on laptops with 8 GB RAM.
- **`nemotron-mini`** (NVIDIA Nemotron Mini): Compact NVIDIA reasoning model.

To download the NVIDIA Nemotron model, run:
```powershell
ollama pull nemotron
```

Verify your downloaded models:
```powershell
ollama list
```

---

## 🚀 4. Step-by-Step Application Run Guide

### Step 4.1: Clone and Configure Backend

Open a PowerShell window:
```powershell
cd "d:\FieldScribe Edge\backend"

# 1. Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure .env file
# (Copy template if .env does not already exist)
cp .env.example .env
```

#### Edit `backend/.env`:
Ensure your `backend/.env` has the following settings for Ollama:
```env
# Choose provider: "ollama", "nebius", or "demo"
AI_PROVIDER=ollama

# Ollama settings
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=nemotron
OLLAMA_TIMEOUT=120.0

# Nebius Token Factory settings (Optional when using Ollama)
NEBIUS_API_KEY=
NEBIUS_BASE_URL=https://api.studio.nebius.ai/v1
NEBIUS_MODEL=nvidia/Llama-3.1-Nemotron-70B-Instruct-HF

HOST=127.0.0.1
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

#### Start the FastAPI Server:
```powershell
$env:PYTHONPATH="."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API:** `http://127.0.0.1:8000`
- **Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **Health & Provider Check:** `http://127.0.0.1:8000/health`

---

### Step 4.2: Start the React + Vite Frontend

Open a second PowerShell window:
```powershell
cd "d:\FieldScribe Edge\frontend"

# Install frontend dependencies (if not already done)
npm install

# Start Vite development server
npm run dev
```
- **Frontend Application UI:** `http://localhost:5173`

---

### Step 4.3: One-Click Launch (Windows)
Alternatively, you can launch both backend and frontend simultaneously with a single command from the project root:
```powershell
cd "d:\FieldScribe Edge"
.\start.ps1
```
*(or double-click `start.bat` in File Explorer).*

---

## 🧪 5. Testing the AI Generation Workflow

### Option A: Via the Web UI (End-to-End)
1. Open your browser to `http://localhost:5173`.
2. Inspect the **Engine Indicator** in the top navigation bar:
   - Green pulsing dot: `Ollama: nemotron` (Connected to local daemon).
   - Amber dot: Ollama offline (Check `ollama serve`).
3. Click **"Create Clinical Note"** or navigate to `http://localhost:5173/create`.
4. Click the **"Fall & Trauma (Hackathon Prompt Example)"** 1-click scenario button to populate:
   > *"Patient found conscious after a fall. First responder administered 500 milligrams of a fictional demo medication named DemoMed by oral route at 10:15 AM. A basic wound dressing procedure was performed at 10:20 AM. Patient was reassessed at 10:30 AM."*
5. Click **"Generate Structured Note"**.
6. The app sends the note to your local Ollama instance (`nemotron`), validates the output against the Pydantic schema, and creates a draft record.
7. On the **Record Detail** page (`/records/:id`):
   - Review extracted medications (`DemoMed`, `500 milligrams`, `oral`, `10:15 AM`).
   - Review extracted procedures (`basic wound dressing`, `10:20 AM`).
   - Edit any field and add responder attestation notes.
   - Click **"Confirm & Lock Record"**.
   - Click **"Export"** to preview and download **Standard JSON**, **FHIR-Lite R4 Bundle**, or **Narrative Text (.txt)**.

---

### Option B: Automated Test Suites

#### 1. Multi-Provider & Ollama Test Suite (`backend/test_providers.py`)
Tests all provider modes, Ollama connectivity, model missing errors, malformed JSON handling, and Nebius validation:
```powershell
cd "d:\FieldScribe Edge\backend"
$env:PYTHONPATH="."
.\venv\Scripts\python.exe test_providers.py
```
*Expected Result:*
```
[Test 1] Testing Demo Mode (AI_PROVIDER=demo)... [PASS]
[Test 2] Testing Ollama: Server Unavailable handling... [PASS] (HTTP 503)
[Test 3] Testing Ollama: Model Not Installed (404)... [PASS] (HTTP 404 + ollama pull advice)
[Test 4] Testing Ollama: Malformed JSON output handling... [PASS] (HTTP 502)
[Test 5] Testing Ollama: Successful Structured JSON Generation... [PASS]
[Test 6] Testing Nebius: Missing API Key handling... [PASS] (HTTP 401)
[Test 7] Testing Nebius: Successful Extraction... [PASS]
[Test 8] Testing Provider Selection & Validation... [PASS] (HTTP 400 on invalid)
[Test 9] Testing GET /health endpoint... [PASS]
ALL 9 MULTI-PROVIDER & OLLAMA TESTS PASSED (100%)!
```

#### 2. End-to-End API Integration Suite (`backend/test_api.py`)
Tests all 10 FastAPI endpoints, record creation, review patching, confirmation, and multi-format exports:
```powershell
cd "d:\FieldScribe Edge\backend"
$env:PYTHONPATH="."
.\venv\Scripts\python.exe test_api.py
```

#### 3. Frontend Production Build Verification
Verifies TypeScript compilation and production bundling:
```powershell
cd "d:\FieldScribe Edge\frontend"
npm run build
```

---

## ⚙️ 6. Configuring a Different Ollama Model

To switch models, pull your desired model in Ollama:
```powershell
ollama pull llama3.2:3b
```

Then update `OLLAMA_MODEL` in `backend/.env`:
```env
OLLAMA_MODEL=llama3.2:3b
```
Restart the FastAPI backend—the application will automatically route inferences to the newly selected model and display `Ollama: llama3.2:3b` in the UI!

---

## 📡 7. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service health, metadata, and active provider |
| `GET` | `/health` | Live engine status for Ollama, Nebius, and active provider |
| `POST` | `/api/notes/extract` | Accepts note text, routes to configured provider, returns validated Pydantic JSON |
| `GET` | `/api/records` | Lists all clinical records with search (`?search=...`) and status filter (`?status=...`) |
| `GET` | `/api/records/{id}` | Fetches single record by ID |
| `POST` | `/api/records` | Creates a new draft clinical record |
| `PATCH` | `/api/records/{id}` | Updates record fields during human review |
| `POST` | `/api/records/{id}/confirm` | Attests and locks record as verified |
| `GET` | `/api/records/{id}/export` | Exports record in `?format=json`, `?format=fhir`, or `?format=narrative` |

---

## 🛡️ 8. Limitations & Safety Disclaimer

- **Prototype for Hackathon Evaluation:** FieldScribe Edge is an AI documentation prototype developed for the Nebius x NVIDIA Global AI Hackathon 2026.
- **Fictional Data Only:** All bundled sample records are fictional and do not depict real patients.
- **Documentation Only:** This application is strictly an administrative documentation assistant and does not provide clinical diagnosis, clinical decision support, or treatment recommendations.
- **Not HIPAA Certified:** This MVP does not claim HIPAA, GDPR, or SaMD certification and is not intended for live patient medical interchange.

---

## 📄 9. License

This project is open-source under the [MIT License](LICENSE).
