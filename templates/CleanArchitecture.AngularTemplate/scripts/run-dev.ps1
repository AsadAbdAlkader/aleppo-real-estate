$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$rootDir = Resolve-Path "$scriptDir\.."

Write-Host "=== Starting Development Environment ===" -ForegroundColor Green
Write-Host "Starting ASP.NET Core Web API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\src\Web'; dotnet run"

Write-Host "Starting Angular ClientApp..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\src\Web\ClientApp'; npx ng serve"

Write-Host "`nDev environment started! API: http://localhost:5000 | Client: http://localhost:4200" -ForegroundColor Green
