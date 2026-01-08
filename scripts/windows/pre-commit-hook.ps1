# PowerShell pre-commit hook to prevent large files from being committed
# Blocks files >2MB that aren't tracked by Git LFS

param(
    [int]$MaxKB = 2048
)

# Get staged files
$stagedFiles = & git diff --cached --name-status

foreach ($line in $stagedFiles) {
    if ($line -match "^([MADRT])\s+(.+)$") {
        $mode = $matches[1]
        $path = $matches[2]

        # Skip deleted files
        if ($mode -eq "D") {
            continue
        }

        if (Test-Path $path -PathType Leaf) {
            $size = (Get-Item $path).Length
            if ($size -gt ($MaxKB * 1024)) {
                # Check if file is tracked by LFS
                $lfsCheck = & git check-attr filter -- $path
                if ($lfsCheck -notmatch "filter: lfs") {
                    Write-Host "❌ $path is $([math]::Round($size / 1KB, 2))KB (> ${MaxKB}KB) and not tracked by Git LFS" -ForegroundColor Red
                    Write-Host "💡 To fix: either reduce file size or run: git lfs track `"$([System.IO.Path]::GetFileName($path))`"" -ForegroundColor Yellow
                    exit 1
                }
            }
        }
    }
}

Write-Host "✅ No large files detected" -ForegroundColor Green
exit 0
