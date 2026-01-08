#!/usr/bin/env pwsh
# Build ChatGPT Docs Context Pack
# Creates a temporary folder with all documentation files needed for ChatGPT analysis

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Configuration
$TEMP_FOLDER = ".tmp/chatgpt-docs-context-pack"
$MAX_FILE_SIZE = 2MB
$ROOT_DIR = $PWD

# Files to copy
$FILES_TO_COPY = @{
    # Root-level markdown/governance
    RootMarkdown = @(
        "README.md",
        "CHANGELOG.md",
        "CONTRIBUTING.md",
        "SECURITY.md",
        "CODE_OF_CONDUCT.md",
        "DOCUMENTATION.md",
        "RELEASE.md",
        "RELEASE_NOTES.md",
        "docs.md"
    )
    
    # Docs build/site config
    DocsConfig = @(
        "mkdocs.yml",
        "mkdocs.yaml",
        "docusaurus.config.js",
        "docusaurus.config.ts",
        "docusaurus.config.json",
        "sidebars.js",
        "sidebars.ts",
        "sidebars.json",
        "next.config.js",
        "next.config.mjs",
        "next.config.ts",
        ".markdownlint.json",
        ".markdownlint.jsonc",
        ".markdownlint.yaml",
        ".markdownlint.yml",
        ".remarkrc",
        ".remarkrc.js",
        ".remarkrc.json",
        "vale.ini",
        ".vale.ini",
        "cspell.json",
        ".cspell.json",
        "prettier.config.js",
        "prettier.config.mjs",
        ".prettierrc",
        ".prettierrc.json"
    )
    
    # Docs entry points
    DocsEntryPoints = @(
        "docs/README.md",
        "docs/index.md",
        "docs/SUMMARY.md",
        "docs/navigation.md",
        "docs/_sidebar.md",
        "docs/_index.md",
        "docs/CONTRIBUTING.md",
        "docs/CONTRIBUTING-DOCS.md"
    )
    
    # Clone-report implicated files
    CloneReportFiles = @(
        "docs/maintenance/powershell-performance-fixes/powershell-fixes-implemented.md",
        "docs/maintenance/powershell-performance-fixes/pr-structure.md",
        "docs/ai/rules/AFTER_TOKEN_REPORT.md",
        "docs/ai/rules/BEFORE_TOKEN_REPORT.md",
        "docs/security/auth-patterns.md",
        "docs/reference/api-specification.md",
        "docs/ai/rules/openapi-vendor-extensions.md",
        "docs/error-handling/error-handling-guide.md",
        "docs/monitoring/monitoring-guide.md",
        "docs/development/coding-standards.md",
        "docs/typescript/typescript-guide.md",
        "docs/database/clickhouse-hardening.md",
        "docs/database/backup-and-recovery.md",
        "docs/architecture/codebase-structure.md",
        "docs/ai/rules/security-standards.md",
        "docs/architecture-design/domain-driven-architecture.md",
        "docs/analytics/clickhouse-recommendations.md"
    )
}

# Directories to exclude
$EXCLUDE_DIRS = @(
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    ".git",
    "reports",
    ".tmp"
)

Write-Host "[*] Building ChatGPT Docs Context Pack..." -ForegroundColor Cyan
Write-Host "Root directory: $ROOT_DIR" -ForegroundColor Gray

# Clean and create temp folder
if (Test-Path $TEMP_FOLDER) {
    Remove-Item -Path $TEMP_FOLDER -Recurse -Force
}
New-Item -ItemType Directory -Path $TEMP_FOLDER -Force | Out-Null
Write-Host "[OK] Created temp folder: $TEMP_FOLDER" -ForegroundColor Green

# Track files
$manifest = @()
$stats = @{
    total_files = 0
    total_bytes = 0
    missing_count = 0
    skipped_large_count = 0
    copied_count = 0
}

# Function to copy file with checks
function Copy-FileWithCheck {
    param(
        [string]$SourcePath,
        [string]$Category
    )
    
    $fullSourcePath = Join-Path $ROOT_DIR $SourcePath
    
    if (-not (Test-Path $fullSourcePath)) {
        $manifest += @{
            path = $SourcePath
            category = $Category
            status = "MISSING"
            bytes = 0
        }
        $stats.missing_count++
        return
    }
    
    $fileInfo = Get-Item $fullSourcePath
    if ($fileInfo.Length -gt $MAX_FILE_SIZE) {
        $manifest += @{
            path = $SourcePath
            category = $Category
            status = "SKIPPED_LARGE"
            bytes = $fileInfo.Length
        }
        $stats.skipped_large_count++
        return
    }
    
    # Check if in excluded directory
    $relativePath = $SourcePath
    foreach ($excludeDir in $EXCLUDE_DIRS) {
        if ($relativePath -like "*\$excludeDir\*" -or $relativePath -like "$excludeDir\*") {
            $manifest += @{
                path = $SourcePath
                category = $Category
                status = "SKIPPED_EXCLUDED"
                bytes = $fileInfo.Length
            }
            return
        }
    }
    
    # Copy file preserving directory structure
    $destPath = Join-Path $TEMP_FOLDER $SourcePath
    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    
    Copy-Item -Path $fullSourcePath -Destination $destPath -Force
    $manifest += @{
        path = $SourcePath
        category = $Category
        status = "COPIED"
        bytes = $fileInfo.Length
    }
    $stats.copied_count++
    $stats.total_files++
    $stats.total_bytes += $fileInfo.Length
}

# Copy root markdown files
Write-Host "`n[*] Copying root markdown files..." -ForegroundColor Cyan
foreach ($file in $FILES_TO_COPY.RootMarkdown) {
    Copy-FileWithCheck -SourcePath $file -Category "RootMarkdown"
}

# Copy docs config files
Write-Host "[*] Copying docs config files..." -ForegroundColor Cyan
foreach ($file in $FILES_TO_COPY.DocsConfig) {
    Copy-FileWithCheck -SourcePath $file -Category "DocsConfig"
}

# Copy docs entry points
Write-Host "[*] Copying docs entry points..." -ForegroundColor Cyan
foreach ($file in $FILES_TO_COPY.DocsEntryPoints) {
    Copy-FileWithCheck -SourcePath $file -Category "DocsEntryPoints"
}

# Copy clone report files
Write-Host "[*] Copying clone-report implicated files..." -ForegroundColor Cyan
foreach ($file in $FILES_TO_COPY.CloneReportFiles) {
    Copy-FileWithCheck -SourcePath $file -Category "CloneReportFiles"
}

# Copy docs config directories (if they exist)
Write-Host "[*] Copying docs config directories..." -ForegroundColor Cyan
$docsConfigDirs = @(
    "docs/.vitepress",
    "docs/.docusaurus",
    "docs/.vuepress",
    "vale"
)

foreach ($dir in $docsConfigDirs) {
    $fullDirPath = Join-Path $ROOT_DIR $dir
    if (Test-Path $fullDirPath) {
        $destDir = Join-Path $TEMP_FOLDER $dir
        Copy-Item -Path $fullDirPath -Destination $destDir -Recurse -Force -Exclude $EXCLUDE_DIRS
        Write-Host "  [OK] Copied $dir" -ForegroundColor Gray
    }
}

# Generate TREE_SNAPSHOT.txt
Write-Host "`n[*] Generating docs tree snapshot..." -ForegroundColor Cyan
$treeSnapshot = @()
if (Test-Path "docs") {
    Get-ChildItem -Path "docs" -Recurse -File | ForEach-Object {
        $fullPath = $_.FullName
        $relativePath = $fullPath.Replace("$ROOT_DIR\", "").Replace("$ROOT_DIR/", "")
        $treeSnapshot += $relativePath
    }
}
$treeSnapshot = $treeSnapshot | Sort-Object
$treeSnapshotPath = Join-Path $TEMP_FOLDER "TREE_SNAPSHOT.txt"
$treeSnapshot | Out-File -FilePath $treeSnapshotPath -Encoding UTF8
Write-Host "  [OK] Created TREE_SNAPSHOT.txt ($($treeSnapshot.Count) files)" -ForegroundColor Green

# Generate ROOT_MD_LIST.txt
Write-Host "[*] Generating root markdown list..." -ForegroundColor Cyan
$rootMdList = @()
Get-ChildItem -Path "." -File -Filter "*.md" | ForEach-Object {
    $rootMdList += $_.Name
}
$rootMdList = $rootMdList | Sort-Object
$rootMdListPath = Join-Path $TEMP_FOLDER "ROOT_MD_LIST.txt"
$rootMdList | Out-File -FilePath $rootMdListPath -Encoding UTF8
Write-Host "  [OK] Created ROOT_MD_LIST.txt ($($rootMdList.Count) files)" -ForegroundColor Green

# Generate MANIFEST.json
Write-Host "[*] Generating manifest..." -ForegroundColor Cyan
$manifestPath = Join-Path $TEMP_FOLDER "MANIFEST.json"
$manifest | ConvertTo-Json -Depth 10 | Out-File -FilePath $manifestPath -Encoding UTF8
Write-Host "  [OK] Created MANIFEST.json ($($manifest.Count) entries)" -ForegroundColor Green

# Generate STATS.json
Write-Host "[*] Generating stats..." -ForegroundColor Cyan
$statsPath = Join-Path $TEMP_FOLDER "STATS.json"
$stats | ConvertTo-Json | Out-File -FilePath $statsPath -Encoding UTF8
Write-Host "  [OK] Created STATS.json" -ForegroundColor Green

# Create zip file
Write-Host "`n[*] Creating zip archive..." -ForegroundColor Cyan
$zipPath = "$TEMP_FOLDER.zip"
if (Test-Path $zipPath) {
    Remove-Item -Path $zipPath -Force
}
Compress-Archive -Path $TEMP_FOLDER -DestinationPath $zipPath -Force
$zipSize = (Get-Item $zipPath).Length
Write-Host "  [OK] Created $zipPath ($([math]::Round($zipSize / 1MB, 2)) MB)" -ForegroundColor Green

# Print summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "[SUCCESS] Context Pack Created Successfully!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
Write-Host "Temp folder: $TEMP_FOLDER" -ForegroundColor Yellow
Write-Host "Zip file: $zipPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Statistics:" -ForegroundColor Cyan
Write-Host "  - Total files copied: $($stats.copied_count)" -ForegroundColor White
Write-Host "  - Total bytes: $([math]::Round($stats.total_bytes / 1KB, 2)) KB" -ForegroundColor White
Write-Host "  - Missing files: $($stats.missing_count)" -ForegroundColor $(if ($stats.missing_count -gt 0) { "Yellow" } else { "Green" })
Write-Host "  - Skipped (large): $($stats.skipped_large_count)" -ForegroundColor $(if ($stats.skipped_large_count -gt 0) { "Yellow" } else { "Green" })
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Cyan
Write-Host "  - TREE_SNAPSHOT.txt - Complete docs file tree" -ForegroundColor White
Write-Host "  - ROOT_MD_LIST.txt - Root markdown files" -ForegroundColor White
Write-Host "  - MANIFEST.json - File copy manifest" -ForegroundColor White
Write-Host "  - STATS.json - Statistics summary" -ForegroundColor White
Write-Host ""

if ($stats.missing_count -gt 0) {
    Write-Host "[WARNING] Missing files:" -ForegroundColor Yellow
    $manifest | Where-Object { $_.status -eq "MISSING" } | ForEach-Object {
        Write-Host "    - $($_.path)" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($stats.skipped_large_count -gt 0) {
    Write-Host "[WARNING] Skipped (large) files:" -ForegroundColor Yellow
    $manifest | Where-Object { $_.status -eq "SKIPPED_LARGE" } | ForEach-Object {
        Write-Host "    - $($_.path) ($([math]::Round($_.bytes / 1MB, 2)) MB)" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "[SUCCESS] Ready for drag/drop into ChatGPT!" -ForegroundColor Green
Write-Host ""
