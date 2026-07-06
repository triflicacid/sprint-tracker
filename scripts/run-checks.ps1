# Runs the checks used while developing:
# - typecheck (client + server)
# - unit tests
# - integration tests
# - OPTIONALLY: e2e tests / a specific e2e spec.
#
# Usage:
#   .\run-checks.ps1                          # typecheck + unit + integration
#   .\run-checks.ps1 -E2e                     # ...plus the full e2e suite
#   .\run-checks.ps1 -E2eSpec e2e\foo.spec.ts # ...plus just one e2e spec file
#                                              # (backslash or forward slash both work - see normalization below)
param(
    [switch]$E2e,
    [string]$E2eSpec
)

if ($E2eSpec) {
    $E2eSpec = $E2eSpec -replace '\\', '/'
}

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

Run-Step "typecheck (client)" "npx tsc -p tsconfig.json --noEmit"
Run-Step "typecheck (server)" "npx tsc -p server\tsconfig.json --noEmit"
Run-Step "typecheck (electron)" "npx tsc -p electron\tsconfig.json --noEmit"
Run-Step "unit tests" "npm run test:unit"
Run-Step "integration tests" "npm run test:integration"

if ($E2eSpec) {
    Run-Step "e2e ($E2eSpec)" "npx playwright test $E2eSpec"
} elseif ($E2e) {
    Run-Step "e2e (full suite)" "npm run test:e2e"
}

if ($failed) {
    Write-Host "`nOne or more steps failed." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nAll steps passed." -ForegroundColor Green
}
