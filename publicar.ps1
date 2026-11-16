# publicar.ps1: sincroniza el vault de Obsidian y publica el portfolio en GitHub Pages.
# Uso:  .\publicar.ps1            (mensaje por defecto)
#       .\publicar.ps1 "Agrego writeup de Cap"
param([string]$Mensaje = "Actualizo informe (sync vault de Obsidian)")

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Carpeta de adjuntos del vault (donde Obsidian guarda las capturas pegadas)
$Adjuntos = "C:\Programacion\Cybersecurity\Cybersecurity\Recursos\Adjuntos"

Write-Host "[1/4] Censurando capturas (tapo IP/datos de la barra del prompt)..." -ForegroundColor Green
python -I tools\censurar_capturas.py $Adjuntos
if ($LASTEXITCODE -ne 0) { throw "Falló la censura de capturas" }

Write-Host "[2/4] Sincronizando vault de Obsidian..." -ForegroundColor Green
python -I tools\sync_vault.py
if ($LASTEXITCODE -ne 0) { throw "Falló la sincronización del vault" }

Write-Host "[3/4] Commit..." -ForegroundColor Green
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) { Write-Host "No hay cambios para publicar."; exit 0 }
git commit -m $Mensaje

Write-Host "[4/4] Push a GitHub Pages..." -ForegroundColor Green
git push
Write-Host "Listo: https://inakisarobe.github.io (tarda ~1 min en actualizarse)" -ForegroundColor Green
