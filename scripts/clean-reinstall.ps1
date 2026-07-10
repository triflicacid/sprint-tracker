# Full clean reinstall of dependencies:
# - removes node_modules
# - clears npm's cache
# - reinstalls from pnpm-lock.yaml

$ErrorActionPreference = "Stop"
$failed = $false

function Run-Step {
    param([string]$Name, [string]$Command)
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    & cmd /c $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $Name" -ForegroundColor Red
        $script:failed = $true
    }
}

Write-Host "`n=== removing node_modules ===" -ForegroundColor Cyan
if (Test-Path node_modules) {
    Remove-Item -Recurse -Force node_modules
    Write-Host "removed node_modules"
} else {
    Write-Host "node_modules not present, skipping"
}

Run-Step "pnpm cache clean --force" "pnpm cache clean --force"

if ($failed) {
    Write-Host "`nCache clean failed - stopping before reinstalling." -ForegroundColor Red
    exit 1
}

Run-Step "pnpm install" "pnpm install"

if ($failed) {
    Write-Host "`nInstall failed - stopping before running audit fix." -ForegroundColor Red
    exit 1
}

