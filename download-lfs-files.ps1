# PowerShell script to download LFS files from GitHub
# This attempts to download files directly, bypassing LFS restrictions

$baseUrl = "https://raw.githubusercontent.com/Corso222/corso-mvp/main"
$files = @(
    "db/addresses.csv",
    "db/companies.csv", 
    "db/projects.csv",
    "public/demos/addresses-interface.png",
    "public/demos/companies-interface.png",
    "public/demos/corso-ai-interface.png",
    "public/demos/projects-interface.png",
    "public/insights/insights-construction-trends.png",
    "supabase/migrations/20240101000000_add_chat_messages_table.sql",
    "supabase/migrations/20240429000000_create_saved_tables.sql",
    "supabase/migrations/20250115000000_add_checkout_sessions_table.sql",
    "supabase/migrations/20250129000000_create_saved_searches_table.sql",
    "supabase/migrations/20250501231031_add_saved_views_table.sql",
    "supabase/migrations/20250502061640_add_saved_views_and_watchlists.sql",
    "supabase/migrations/20250503000000_add_rls_user_payment_api_keys.sql",
    "supabase/migrations/20250612000100_create_set_rls_context_function.sql",
    "supabase/migrations/20250613000100_add_clerk_webhook_events_table.sql",
    "supabase/migrations/202506141600_dev_metrics.sql",
    "supabase/migrations/20250615000001_enable_rls_all_remaining.sql",
    "supabase/migrations/20250615000002_idx_projects.sql",
    "supabase/migrations/20250615000003_audit_log.sql",
    "supabase/migrations/20250616000000_enable_rls_org_isolation.sql",
    "supabase/migrations/20250813120000_add_missing_tenant_indexes.sql",
    "supabase/migrations/20250813121000_mv_projects_daily_counts.sql",
    "supabase/migrations/20250814090000_presence_v2.sql"
)

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $localPath = $file
    
    # Create directory if it doesn't exist
    $dir = Split-Path -Parent $localPath
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    Write-Host "Downloading: $file"
    try {
        Invoke-WebRequest -Uri $url -OutFile $localPath -ErrorAction Stop
        Write-Host "  ✓ Success" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Note: This file is in LFS. You may need to increase your LFS budget or download manually from GitHub web interface." -ForegroundColor Yellow
    }
}

Write-Host "`nDownload complete. Note: LFS files may only download as pointer files." -ForegroundColor Cyan
Write-Host "To get actual file content, increase LFS budget at: https://github.com/organizations/Corso222/settings/billing" -ForegroundColor Cyan

