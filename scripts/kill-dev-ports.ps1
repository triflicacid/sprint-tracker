# Kills any process listening on the sprint-tracker dev ports (Express :4000, Vite :5173).
param(
    [int[]]$Ports = @(4000, 5173)
)

foreach ($port in $Ports) {
    $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique

    if (-not $pids) {
        Write-Host "port $port : nothing listening"
        continue
    }

    foreach ($processId in $pids) {
        $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
        $name = if ($proc) { $proc.ProcessName } else { "unknown" }
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "port $port : killed $name (pid $processId)"
    }
}
