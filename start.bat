@echo off
echo ============================================================
echo  FieldScribe Edge - Voice-to-Structured Clinical Records
echo  Nebius x NVIDIA Global AI Hackathon 2026
echo ============================================================

echo Starting FastAPI Backend...
start "FieldScribe Backend" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\activate.bat && set PYTHONPATH=. && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite Frontend...
start "FieldScribe Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Services launched!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
pause
