$ErrorActionPreference = "Stop"

Write-Host "=== Building Single Production Package (CleanArchitecture.AngularTemplate) ===" -ForegroundColor Green

$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$rootDir = Resolve-Path "$scriptDir\.."
$webProj = "$rootDir\src\Web\Web.csproj"
$publishDir = "$rootDir\publish"

Write-Host "1. Running dotnet publish on $webProj ..." -ForegroundColor Yellow
dotnet publish $webProj -c Release -o $publishDir

Write-Host "`n=== Single Production Package Built Successfully! ===" -ForegroundColor Green
Write-Host "Output Directory: $publishDir"
Write-Host "To launch production server:"
Write-Host "  cd $publishDir"
Write-Host "  dotnet Web.dll"
