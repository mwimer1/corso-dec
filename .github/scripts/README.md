---
title: "Scripts"
description: "Documentation and resources for documentation functionality. Located in scripts/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
## Public Exports
| File | Purpose | Location |
|------|---------|----------|
| `audit-record-template` | GitHub file | `.github/scripts`
| `backup-and-delete-with-gh` | GitHub file | `.github/scripts`
| `delete-workflow-runs` | GitHub file | `.github/scripts`
| `update-action-shas` | GitHub file | `.github/scripts`


## Purpose

Small admin utilities to export and (optionally) delete GitHub Actions workflow runs for compliance/audit housekeeping.

Security & process
------------------
- **Obtain written sign-off** from Compliance/Legal/Repo owners before running deletions.
- **Dry-run first**: both scripts default to dry-run. Confirm output and backups before executing.
- **Audit**: Save `workflow-runs-backup.json` and note approver, timestamp, and reason.
- **Token scope**: Use a PAT with `repo` scope (or repo-admin token). Keep tokens secure.

Usage examples
--------------

Unix (Git Bash / WSL / Linux / macOS):
```bash
GITHUB_TOKEN=ghp_xxx OWNER=Corso222 REPO=corso-app DAYS=30 DRY_RUN=true ./delete-workflow-runs.sh
```

To actually delete, set `DRY_RUN=false`.

PowerShell (Windows):
```powershell
# $env:GITHUB_TOKEN = 'ghp_xxx'
.\delete-workflow-runs.ps1 -Owner Corso222 -Repo corso-app -Days 30    # dry-run
.\delete-workflow-runs.ps1 -Owner Corso222 -Repo corso-app -Days 30 -Execute  # actually delete
```

Backups
-------
Export the list of workflow runs before deleting (example):
```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/actions/runs?per_page=100" \
  | jq '.' > .github/scripts/workflow-runs-backup-page-1.json
```

Support
-------
If you have >10k workflow runs or need GitHub Enterprise assistance, contact GitHub Support or your enterprise admin to request a server-side purge.
