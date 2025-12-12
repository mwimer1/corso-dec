param(
    [string]$Owner = $env:OWNER,
    [string]$Repo = $env:REPO,
    [int]$Days = 30,
    [string]$Token = $env:GITHUB_TOKEN,
    [switch]$Execute
)

if (-not $Token) {
    Write-Error "GITHUB_TOKEN env var is required"
    exit 1
}

$cutoff = (Get-Date).ToUniversalTime().AddDays(-$Days).ToString("u").Replace(' ', 'T') + "Z"
Write-Output "Repository: $Owner/$Repo"
Write-Output "Cutoff: $cutoff"
if (-not $Execute) { Write-Output "DRY RUN (no deletions). Rerun with -Execute to actually delete." }

$page = 1
while ($true) {
    $url = "https://api.github.com/repos/$Owner/$Repo/actions/runs?per_page=100&page=$page"
    $resp = Invoke-RestMethod -Headers @{ Authorization = "token $Token" } -Uri $url -Method Get
    if (-not $resp.workflow_runs) { break }

    $targets = $resp.workflow_runs | Where-Object { $_.created_at -lt $cutoff }
    if (-not $targets -or $targets.Count -eq 0) { break }

    foreach ($run in $targets) {
        Write-Output "Found run id=$($run.id) created_at=$($run.created_at)"
        if ($Execute) {
            Write-Output "Deleting run $($run.id) ..."
            Invoke-RestMethod -Headers @{ Authorization = "token $Token" } -Uri "https://api.github.com/repos/$Owner/$Repo/actions/runs/$($run.id)" -Method Delete | Out-Null
            Start-Sleep -Milliseconds 200
        }
    }

    $page++
}

Write-Output "Done."


