@echo off
echo Starting Corso development server...
set PATH=C:\Program Files\nodejs;%PATH%
set PATH=C:\Users\wimer\AppData\Local\Microsoft\WinGet\Packages\pnpm.pnpm_Microsoft.WinGet.Source_8wekyb3d8bbwe;%PATH%
echo Node version:
node --version
echo pnpm version:
pnpm --version
echo.
echo Starting dev server...
pnpm dev
pause
