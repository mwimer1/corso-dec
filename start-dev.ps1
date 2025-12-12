# Corso Development Server Launcher
Write-Host "Starting Corso development server..." -ForegroundColor Green

# Add Node.js and pnpm to PATH
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
$env:PATH = "C:\Users\wimer\AppData\Local\Microsoft\WinGet\Packages\pnpm.pnpm_Microsoft.WinGet.Source_8wekyb3d8bbwe;$env:PATH"

# Verify installations
Write-Host "Node version: " -NoNewline
node --version
Write-Host "pnpm version: " -NoNewline
pnpm --version
Write-Host ""

# Start development server
Write-Host "Starting dev server..." -ForegroundColor Yellow
pnpm dev
