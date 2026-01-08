[CmdletBinding(DefaultParameterSetName = 'ByNamed')]
param(
  [Parameter(ParameterSetName='ByPorts', Position=0, Mandatory=$true, ValueFromRemainingArguments=$true)]
  [int[]]$Ports,

  [Parameter(ParameterSetName='ByNamed')]
  [int]$DevPort = 3000,
  [Parameter(ParameterSetName='ByNamed')]
  [int]$PlaywrightPort = 9323,

  [Parameter()]
  [switch]$KillOnly
)

$ErrorActionPreference = "Stop"

if ($PSCmdlet.ParameterSetName -eq 'ByNamed') {
  $Ports = @($DevPort, $PlaywrightPort)
}

# Remove duplicates and non-positive values
$Ports = $Ports | Where-Object { $_ -is [int] -and $_ -gt 0 } | Select-Object -Unique
if (-not $Ports -or $Ports.Count -eq 0) {
  Write-Error "No valid ports provided."
  exit 1
}

function Kill-Port {
  param([int]$Port)
  $pids = @()
  try {
    $pids = Get-NetTCPConnection -LocalPort $Port -State Listen,Established,Bound -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
  } catch { }
  if (-not $pids -or $pids.Count -eq 0) {
    try {
      $pids = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    } catch { $pids = @() }
  }
  foreach ($processPID in $pids) {
    if ($processPID) {
      try {
        Write-Host "Killing PID $processPID on port $Port" -ForegroundColor Yellow
        Stop-Process -Id $processPID -Force
      } catch {
        Write-Warning "Failed to kill PID $processPID on port ${Port}: $($_.Exception.Message)"
      }
    }
  }
}

foreach ($p in $Ports) { Kill-Port -Port $p }

if ($KillOnly) {
  Write-Host "Ports cleared only. Done." -ForegroundColor Green
  exit 0
}

Write-Host "Ports cleared. Continuing…" -ForegroundColor Green


