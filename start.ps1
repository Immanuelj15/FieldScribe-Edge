# FieldScribe Edge - One-Click Launcher (PowerShell)
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " FieldScribe Edge — Voice-to-Structured Clinical Records" -ForegroundColor White
Write-Host " Nebius x NVIDIA Global AI Hackathon 2026" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Start Backend in new process
Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$BackendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\Activate.ps1; $env:PYTHONPATH='.'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru

# 2. Start Frontend in new process
Write-Host "[2/2] Starting React + Vite Frontend on http://localhost:5173..." -ForegroundColor Green
$FrontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -PassThru

Write-Host "`nBoth services launched!" -ForegroundColor Cyan
Write-Host "API Backend Docs:   http://127.0.0.1:8000/docs" -ForegroundColor Gray
Write-Host "Frontend App:       http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Enter to exit this launcher window." -ForegroundColor Yellow
Read-Host
