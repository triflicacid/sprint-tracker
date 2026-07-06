# Full clean reinstall of dependencies:
# - removes node_modules
# - clears npm's cache
# - reinstalls from package-lock.json
# - runs `npm audit fix --force`

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

Run-Step "npm cache clean --force" "npm cache clean --force"

if ($failed) {
    Write-Host "`nCache clean failed - stopping before reinstalling." -ForegroundColor Red
    exit 1
}

Run-Step "npm install" "npm install"

if ($failed) {
    Write-Host "`nInstall failed - stopping before running audit fix." -ForegroundColor Red
    exit 1
}

Run-Step "npm audit fix --force" "npm audit fix --force"

if ($failed) {
    Write-Host "`nOne or more steps failed." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nDone. audit fix --force can bump major versions - review 'git diff package.json package-lock.json' before committing, and run .\scripts\run-checks.ps1 to confirm nothing broke." -ForegroundColor Yellow
}
