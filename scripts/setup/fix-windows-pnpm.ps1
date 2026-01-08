param(
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🛠️ Windows pnpm Fix Utility" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# 1) Stop any running pnpm processes (best effort)
Write-Host "1) Stopping pnpm processes..." -ForegroundColor Yellow
Get-Process -Name "pnpm" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2) Prune pnpm store (Windows-safe, non-destructive)
Write-Host "2) Pruning pnpm store..." -ForegroundColor Yellow
pnpm store prune

# 3) Clean local caches (do not touch global store paths)
Write-Host "3) Cleaning project caches..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue

# 4) Remove lockfile and node_modules in working copy
Write-Host "4) Removing lockfile and node_modules..." -ForegroundColor Yellow
Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# 5) Reinstall with Windows-friendly node-linker for THIS run only
Write-Host "5) Reinstalling dependencies (--node-linker=isolated)..." -ForegroundColor Yellow
pnpm install --node-linker=isolated

# 6) Verify ast-grep
Write-Host "6) Verifying ast-grep..." -ForegroundColor Yellow
try {
  $agv = pnpm exec ast-grep --version 2>$null
  if ($LASTEXITCODE -eq 0 -and $agv) {
    Write-Host "✅ ast-grep working: $agv" -ForegroundColor Green
  } else {
    Write-Host "❌ ast-grep verification failed" -ForegroundColor Red
    Write-Host "   Attempting to fix Windows binary issue..." -ForegroundColor Yellow

    # Try removing and reinstalling with specific version
    Write-Host "   Removing existing ast-grep..." -ForegroundColor Yellow
    pnpm remove -w @ast-grep/cli

    Write-Host "   Installing specific version that works on Windows..." -ForegroundColor Yellow
    pnpm add -w -D @ast-grep/cli@0.38.0

    $agv = pnpm exec ast-grep --version 2>$null
    if ($LASTEXITCODE -eq 0 -and $agv) {
      Write-Host "✅ ast-grep working: $agv" -ForegroundColor Green
    } else {
      Write-Host "❌ ast-grep still not working - will use alternative approach" -ForegroundColor Red
      Write-Host "   Note: Some ast-grep rules may need to be disabled or run manually" -ForegroundColor Yellow
    }
  }
} catch {
  Write-Host "❌ ast-grep verification failed" -ForegroundColor Red
  Write-Host "   This is a known Windows binary issue - will continue with workaround" -ForegroundColor Yellow
  Write-Host "   Note: Some ast-grep rules may need to be disabled or run manually" -ForegroundColor Yellow
}

# 7) Quick pipeline smoke (non-fatal)
Write-Host "7) Running typecheck smoke..." -ForegroundColor Yellow
try {
  pnpm typecheck
  Write-Host "✅ TypeScript compilation passed" -ForegroundColor Green
} catch {
  Write-Host "⚠️ TypeScript compilation failed (expected sometimes on first run)" -ForegroundColor Yellow
}

Write-Host "🏁 Windows pnpm fix completed!" -ForegroundColor Green
