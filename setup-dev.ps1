# Setup script for Corso development environment
# Run this AFTER installing Node.js

Write-Host "🚀 Setting up Corso development environment..." -ForegroundColor Cyan

# Check Node.js
Write-Host "`n📦 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
    
    # Check if version is >= 20
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 20) {
        Write-Host "⚠️  Warning: Node.js version should be >= 20.19.4" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "`n📦 Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Install pnpm
Write-Host "`n📦 Installing pnpm..." -ForegroundColor Yellow
try {
    npm install -g pnpm@10.17.1
    Write-Host "✅ pnpm installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install pnpm" -ForegroundColor Red
    exit 1
}

# Verify pnpm
Write-Host "`n📦 Verifying pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm installed: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm verification failed" -ForegroundColor Red
    exit 1
}

# Install project dependencies
Write-Host "`n📦 Installing project dependencies..." -ForegroundColor Yellow
try {
    pnpm install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Verify AI tools
Write-Host "`n🔧 Verifying AI tools..." -ForegroundColor Yellow
try {
    pnpm run verify:ai-tools
    Write-Host "✅ AI tools verified" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Some AI tools may be missing (this is okay for now)" -ForegroundColor Yellow
}

Write-Host "`n✨ Setup complete! You can now run:" -ForegroundColor Green
Write-Host "   pnpm dev          - Start development server" -ForegroundColor Cyan
Write-Host "   pnpm build        - Build for production" -ForegroundColor Cyan
Write-Host "   pnpm test         - Run tests" -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor Cyan

