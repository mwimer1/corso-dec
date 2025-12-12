# PowerShell script to install Node.js and pnpm
# Run this script as Administrator: Right-click -> Run as Administrator

Write-Host "🚀 Installing Node.js and pnpm..." -ForegroundColor Cyan

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script needs to run as Administrator" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell -> Run as Administrator, then run this script" -ForegroundColor Yellow
    exit 1
}

# Install Node.js LTS
Write-Host "`n📦 Installing Node.js LTS..." -ForegroundColor Yellow
try {
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    Write-Host "✅ Node.js installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Node.js: $_" -ForegroundColor Red
    exit 1
}

# Refresh PATH
Write-Host "`n🔄 Refreshing environment variables..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify Node.js
Write-Host "`n📦 Verifying Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Node.js installed but not in PATH. Please restart your terminal." -ForegroundColor Yellow
    Write-Host "After restarting, run: npm install -g pnpm@10.17.1" -ForegroundColor Cyan
    exit 0
}

# Install pnpm
Write-Host "`n📦 Installing pnpm..." -ForegroundColor Yellow
try {
    npm install -g pnpm@10.17.1
    Write-Host "✅ pnpm installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install pnpm: $_" -ForegroundColor Red
    exit 1
}

# Verify pnpm
Write-Host "`n📦 Verifying pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm installed: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  pnpm installed but not in PATH. Please restart your terminal." -ForegroundColor Yellow
    exit 0
}

Write-Host "`n✨ Installation complete!" -ForegroundColor Green
Write-Host "You can now run: pnpm install" -ForegroundColor Cyan
Write-Host "Then: pnpm dev" -ForegroundColor Cyan

