---
title: "CI History Tracking Audit & Recommendations"
last_updated: "2026-01-07"
category: "maintenance"
status: "draft"
---

# CI History Tracking Audit & Recommendations

## Executive Summary

**Status**: ✅ **No local CI tracking detected** - Your local git repository is NOT tracking CI history.

**Findings**:
- Local git repository size: ~7.68 MiB (883 commits)
- Git fetch configuration: Only tracks branches, NOT CI refs
- CI history is stored on GitHub's servers only (not in local git)
- Artifact retention policies: 7-30 days (reasonable)
- Cleanup tools exist but may not be automated

## Current State

### Local Git Repository
- **Repository size**: ~7.68 MiB (6.20 MiB packed + 1.48 MiB loose objects)
- **Total commits**: 883
- **Git fetch config**: `+refs/heads/*:refs/remotes/origin/*` (branches only)
- **CI refs tracked**: None
- **Prune enabled**: Yes (`fetch.prune true`)

### GitHub Actions CI Storage
- **Location**: GitHub's servers only (not in local git)
- **Artifact retention**:
  - Coverage reports: 7 days (`.github/workflows/deploy.yml`)
  - Dead code audit: 30 days (`.github/workflows/dead-code-audit.yml`)
  - Build artifacts: Default (90 days GitHub limit)
- **Workflow run history**: Stored indefinitely on GitHub (unless manually deleted)

## Recommendations

### Option 1: Automated Workflow Run Cleanup (Recommended)

Set up a scheduled workflow to automatically delete old workflow runs.

**Implementation**: Create `.github/workflows/cleanup-old-runs.yml`:

```yaml
name: Cleanup Old Workflow Runs
on:
  schedule:
    # Run weekly on Sunday at 2 AM UTC
    - cron: '0 2 * * 0'
  workflow_dispatch:

permissions:
  contents: read
  actions: write

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Delete workflow runs older than 30 days
        uses: actions/github-script@v7
        with:
          script: |
            const { data: runs } = await github.rest.actions.listWorkflowRunsForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              per_page: 100
            });
            
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            
            for (const run of runs.workflow_runs) {
              const createdAt = new Date(run.created_at);
              if (createdAt < cutoff && run.status === 'completed') {
                await github.rest.actions.deleteWorkflowRun({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  run_id: run.id
                });
                console.log(`Deleted run ${run.id} from ${run.created_at}`);
              }
            }
```

**Benefits**:
- Automatic cleanup of old runs
- Reduces GitHub storage usage
- Maintains recent history (30 days)
- No manual intervention required

### Option 2: Reduce Artifact Retention

Update artifact retention to shorter periods:

```yaml
# In .github/workflows/deploy.yml
- uses: actions/upload-artifact@v4
  with:
    name: coverage-reports
    retention-days: 3  # Reduced from 7
```

**Benefits**:
- Faster cleanup of large artifacts
- Reduces GitHub storage usage
- Trade-off: Less historical artifact access

### Option 3: Manual Cleanup (Current State)

Use existing cleanup tools when needed:

**Via GitHub Actions Workflow**:
1. Go to Actions → `Force delete all workflow runs`
2. Run workflow with `confirm: IRREVOCABLE_DELETE`
3. Optionally set `dry_run: true` first to preview

**Via PowerShell Script**:
```powershell
$env:GITHUB_TOKEN = 'ghp_xxx'
.\github\scripts\delete-workflow-runs.ps1 -Owner mwimer1 -Repo corso-dec -Days 30
.\github\scripts\delete-workflow-runs.ps1 -Owner mwimer1 -Repo corso-dec -Days 30 -Execute
```

### Option 4: Prevent Future CI Tracking (Already Configured)

Your git configuration is already optimal:
- ✅ Only tracking branches (`+refs/heads/*`)
- ✅ Not tracking CI refs (`refs/pull/*`, `refs/gh-actions/*`, etc.)
- ✅ Prune enabled for cleanup

**To explicitly prevent CI ref tracking** (defensive):

```bash
# Add to .git/config or run:
git config --add remote.origin.fetch "^refs/heads/*"
git config --add remote.origin.fetch "^!refs/pull/*"
git config --add remote.origin.fetch "^!refs/gh-actions/*"
```

**Note**: This is already the default behavior, but makes it explicit.

## Memory Impact Analysis

### Local Repository
- **Current size**: ~7.68 MiB
- **CI tracking overhead**: 0 bytes (no CI refs tracked)
- **Recommendation**: ✅ No action needed

### GitHub Server Storage
- **Workflow runs**: Stored indefinitely (unless deleted)
- **Artifacts**: Retained per retention policy (7-30 days)
- **Impact**: Server-side only, no local memory burden
- **Recommendation**: Implement Option 1 (automated cleanup)

## Verification Commands

### Check Local Git Size
```bash
git count-objects -vH
```

### Verify No CI Refs
```bash
git for-each-ref --format="%(refname)" | grep -i "ci\|workflow\|actions"
# Should return: No CI-related refs found
```

### Check Fetch Configuration
```bash
git config --get-regexp "fetch|remote"
# Should show: +refs/heads/*:refs/remotes/origin/*
```

### Count Workflow Runs on GitHub
```bash
gh run list --limit 1000 --json id,createdAt,status | jq 'length'
```

## Implementation Priority

1. **High**: Implement Option 1 (automated cleanup) - Prevents accumulation
2. **Medium**: Review artifact retention (Option 2) - Reduces storage
3. **Low**: Explicit CI ref prevention (Option 4) - Already configured correctly

## Related Documentation

- [Git History Flattening](../../scripts/git/flatten-history.sh) - Reduces git history size
- [GitHub Actions Cleanup Scripts](../../.github/scripts/README.md) - Manual cleanup tools
- [Workflow Run Deletion Workflow](../../.github/workflows/cleanup-old-runs.yml) - Manual deletion workflow

## Conclusion

**Your local repository is NOT tracking CI history** - the memory concern is about GitHub's server-side storage, not local git.

**Recommended Action**: Implement automated workflow run cleanup (Option 1) to prevent accumulation of old CI runs on GitHub's servers while maintaining 30 days of recent history for debugging and auditing.
