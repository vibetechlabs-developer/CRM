param(
  [int]$BackendPort = 8000,
  [int]$FrontendPort = 8080
)

$ErrorActionPreference = "Stop"

Write-Host "Starting backend on port $BackendPort..."
Start-Process powershell -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "cd C:\CRM\backend; python manage.py runserver 0.0.0.0:$BackendPort"
)

Write-Host "Starting frontend..."
Start-Process powershell -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "cd C:\CRM\frontend; npm run dev -- --host 0.0.0.0 --port $FrontendPort"
)

Write-Host "Done. Open http://localhost:$FrontendPort/login"

