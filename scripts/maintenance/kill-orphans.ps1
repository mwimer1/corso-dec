param(
  [int]$MaxAgeMinutes = 480
)

$ErrorActionPreference = "SilentlyContinue"

# Processes that often linger: Next, Storybook, Vitest, tsc, tsx
$pattern = '(next\s+dev|storybook|vitest|tsc\s+-w|tsx\s+watch|nodemon)'

# Parents we consider "active" dev sessions
$keepParents = @('Code.exe','cursor.exe','pwsh.exe','powershell.exe','WindowsTerminal.exe','conhost.exe','git-bash.exe')

$now = Get-Date
$procs = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -match 'node.exe|deno.exe' -and
  $_.CommandLine -match $pattern
}

foreach ($p in $procs) {
  $start = [Management.ManagementDateTimeConverter]::ToDateTime($p.CreationDate)
  $age = ($now - $start).TotalMinutes
  $parent = (Get-Process -Id $p.ParentProcessId -ErrorAction SilentlyContinue).Name

  $isOld = $age -ge $MaxAgeMinutes
  $hasActiveParent = $keepParents -contains $parent

  if ($isOld -and -not $hasActiveParent) {
    try {
      Write-Host "Killing orphan PID $($p.ProcessId) ($([int]$age)m old): $($p.CommandLine)" -ForegroundColor Yellow
      Stop-Process -Id $p.ProcessId -Force
    } catch { }
  }
}

Write-Host "Orphan cleanup done." -ForegroundColor Green


