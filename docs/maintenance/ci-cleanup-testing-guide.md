---
title: "CI Cleanup Workflow Testing Guide"
last_updated: "2026-01-07"
category: "maintenance"
status: "draft"
---

# CI Cleanup Workflow Testing Guide

## Quick Start

The automated cleanup workflow is now active and will run weekly. Follow these steps to test it manually first.

## Testing the Workflow

### Step 1: Verify Workflow is Available

1. Go to GitHub: `https://github.com/mwimer1/corso-dec/actions`
2. Look for "Cleanup Old Workflow Runs" in the workflows list
3. Click on it to view the workflow

### Step 2: Test with Dry Run (Recommended First)

1. Go to Actions → "Cleanup Old Workflow Runs"
2. Click "Run workflow" dropdown
3. Set parameters:
   - **days_old**: `30` (default)
   - **dry_run**: `true` ✅ (IMPORTANT: Enable this first!)
4. Click "Run workflow"
5. Wait for completion and review the output

**Expected Output**:
- Lists all workflow runs older than 30 days
- Shows run IDs, names, and creation dates
- **No deletions performed** (dry run mode)

### Step 3: Review Dry Run Results

Check the workflow run output:
- How many runs would be deleted?
- Are the dates correct?
- Are only completed runs listed?

### Step 4: Run Actual Cleanup (After Verification)

Once you've verified the dry run looks correct:

1. Go to Actions → "Cleanup Old Workflow Runs"
2. Click "Run workflow" dropdown
3. Set parameters:
   - **days_old**: `30` (or your preferred retention period)
   - **dry_run**: `false` (or leave default)
4. Click "Run workflow"
5. Monitor the run for completion

**Expected Output**:
- Lists runs being deleted
- Shows deletion status (✅ or ❌)
- Provides summary of deleted runs

## Verification Commands

### Check Current Workflow Runs Count

```bash
gh run list --limit 1000 --json id,createdAt,status,name | jq 'length'
```

### List Old Runs (30+ days)

```bash
CUTOFF=$(date -u -d "30 days ago" +%Y-%m-%dT%H:%M:%SZ)
gh run list --limit 1000 --json id,createdAt,status,name | \
  jq --arg cutoff "$CUTOFF" '[.[] | select(.createdAt < $cutoff and .status == "completed")] | length'
```

### View Workflow Run History

```bash
gh run list --workflow="Cleanup Old Workflow Runs" --limit 10
```

## Scheduled Execution

The workflow runs automatically:
- **Schedule**: Every Sunday at 2 AM UTC
- **Retention**: Deletes runs older than 30 days
- **Status**: Only completed runs are deleted

## Monitoring

### After First Run

1. Check GitHub Actions storage usage (Settings → Actions → Usage)
2. Verify old runs are being cleaned up
3. Confirm recent runs (within 30 days) are preserved

### Weekly Check

After a few weeks, verify:
- Old runs are being automatically deleted
- Storage usage is not accumulating
- Recent history is maintained for debugging

## Troubleshooting

### Workflow Not Appearing

- Ensure the workflow file is in `.github/workflows/cleanup-old-runs.yml`
- Check that it's been pushed to the `main` branch
- Verify GitHub Actions is enabled for the repository

### No Runs Deleted

- Check if there are any runs older than the specified days
- Verify runs have `status: "completed"` (in-progress runs are skipped)
- Review workflow logs for errors

### Rate Limit Issues

The workflow includes rate limit protection:
- Automatically pauses when API limit is low
- Uses exponential backoff for retries
- Processes runs with delays to avoid spikes

If you see rate limit errors:
- Reduce the `days_old` parameter to process fewer runs at once
- Run the workflow more frequently with smaller batches
- Contact GitHub support if consistently hitting limits

## Customization

### Change Retention Period

Edit the workflow or use manual trigger:
- Default: 30 days
- Recommended range: 7-60 days
- Balance between storage savings and history needs

### Change Schedule

Edit `.github/workflows/cleanup-old-runs.yml`:

```yaml
schedule:
  # Run monthly instead of weekly
  - cron: '0 2 1 * *'  # First day of month at 2 AM UTC
```

### Exclude Specific Workflows

Modify the workflow to skip certain workflow names:

```bash
# In the deletion step, add a filter:
runs=$(echo "$runs_json" | jq -r --arg cutoff "$CUTOFF" '
  .workflow_runs[]? | 
  select(.created_at < $cutoff and .status == "completed" and .name != "Important Workflow") | 
  "\(.id)|\(.created_at)|\(.name)"
')
```

## Related Documentation

- [CI History Tracking Audit](./ci-history-tracking-audit.md) - Full audit and recommendations
- [GitHub Actions Cleanup Scripts](../.github/scripts/README.md) - Manual cleanup tools
