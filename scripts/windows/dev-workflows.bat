@echo off
setlocal enabledelayedexpansion

echo.
echo ===========================================
echo    Corso Development Workflow Scripts
echo ===========================================
echo.

:menu
echo Choose a workflow:
echo.
echo [SETUP & ENVIRONMENT]
echo [1]  🚀 Full Setup (Install + Verify + Setup Branch)
echo [2]  📦 Install Dependencies Only
echo [3]  🔧 Environment Check
echo [4]  🔍 Validate Cursor Rules
echo.
echo [DEVELOPMENT]
echo [5]  ⚡ Quick Dev Start
echo [6]  📊 OpenAPI Generate
echo [7]  📋 OpenAPI Validate
echo.
echo [QUALITY & TESTING]
echo [8]  🔍 Quality Gates (TypeCheck + Lint + Test)
echo [9]  ⚡ Fast TypeCheck
echo [10] 🧹 Lint All
echo [11] 🧪 Run All Tests
echo [12] 🛡️ Test Security Suite
echo.
echo [BUILD & CLEANUP]
echo [13] 🔧 Build Project
echo [14] 🧹 Clean Cache
echo [15] 🧹 Clean All Caches
echo.
echo [DOCUMENTATION]
echo [16] 📚 Generate Docs
echo [17] 🔍 AST-Grep Scan
echo [18] 🔧 Fix pnpm (Windows recovery)
echo [0] Exit
echo.
set /p choice="Enter your choice (0-18): "

if "%choice%"=="0" goto exit
if "%choice%"=="1" goto fullsetup
if "%choice%"=="2" goto install
if "%choice%"=="3" goto envcheck
if "%choice%"=="4" goto cursorrules
if "%choice%"=="5" goto devstart
if "%choice%"=="6" goto openapi_gen
if "%choice%"=="7" goto openapi_validate
if "%choice%"=="8" goto qualitygates
if "%choice%"=="9" goto fastcheck
if "%choice%"=="10" goto lintall
if "%choice%"=="11" goto testall
if "%choice%"=="12" goto securitytest
if "%choice%"=="13" goto build
if "%choice%"=="14" goto cleancache
if "%choice%"=="15" goto cleanall
if "%choice%"=="16" goto docs
if "%choice%"=="17" goto astgrep
if "%choice%"=="18" goto fixpnpm

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto menu

:fullsetup
echo Running Full Setup (Install + Verify + Setup Branch)...
pnpm install && pnpm run verify:ai-tools && pnpm run setup:branch
goto completed

:install
echo Installing Dependencies...
pnpm install
goto completed

:envcheck
echo Checking Environment...
pnpm validate:env
goto completed

:cursorrules
echo Validating Cursor Rules...
pnpm validate:cursor-rules
goto completed

:devstart
echo Starting Development Server...
start cmd /k "pnpm dev"
goto completed

:openapi_gen
echo Generating OpenAPI Documentation...
pnpm openapi:gen
goto completed

:openapi_validate
echo Validating OpenAPI RBAC...
pnpm openapi:rbac:check
goto completed

:qualitygates
echo Running Quality Gates (TypeCheck + Lint + Test)...
pnpm typecheck && pnpm lint && pnpm test
goto completed

:fastcheck
echo Running Fast TypeCheck...
pnpm typecheck
goto completed

:lintall
echo Running Lint on All Files...
pnpm lint
goto completed

:testall
echo Running All Tests...
pnpm test
goto completed

:securitytest
echo Running Security Tests...
pnpm test:security
goto completed

:build
echo Building Project...
pnpm build
goto completed

:cleancache
echo Cleaning TypeScript Cache...
pnpm typecheck:clean
goto completed

:cleanall
echo Cleaning Ports...
pnpm cleanup:ports
goto completed

:docs
echo Generating Documentation...
pnpm docs:index
goto completed

:astgrep
echo Running AST-Grep Scan...
pnpm ast-grep:scan
goto completed

:fixpnpm
echo Fixing Windows pnpm issues...
echo Note: fix-windows-pnpm.ps1 is Windows-only. On other platforms, use standard pnpm commands.
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\setup\fix-windows-pnpm.ps1
goto completed

:completed
echo.
echo ===========================================
echo           Workflow Completed!
echo ===========================================
echo Press any key to return to menu...
pause >nul
goto menu

:exit
echo.
echo Thank you for using Corso Development Workflows!
echo.
echo Keyboard shortcuts available in VS Code:
echo Ctrl+Shift+D  → Quick Dev Start
echo Ctrl+Shift+Q  → Quality Gates
echo Ctrl+Shift+T  → Fast TypeCheck
echo Ctrl+Shift+L  → Lint All
echo Ctrl+Shift+B  → Build Project
echo.
pause
exit /b 0
