---
title: "Scripts"
description: "Documentation and resources for documentation functionality. Located in scripts/."
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
---
## Public Exports
| File | Purpose | Location |
|------|---------|----------|
| `audit-record-template` | GitHub file | `.github/scripts`
| `delete-workflow-runs.ps1` | GitHub file | `.github/scripts`
| `update-action-shas` | GitHub file | `.github/scripts`


## Purpose

Small admin utilities to export and (optionally) delete GitHub Actions workflow runs for compliance/audit housekeeping.

Security & process
------------------
- **Obtain written sign-off** from Compliance/Legal/Repo owners before running deletions.
- **Dry-run first**: the script defaults to dry-run. Confirm output and backups before executing.
- **Audit**: Save `workflow-runs-backup.json` and note approver, timestamp, and reason.
- **Token scope**: Use a PAT with `repo` scope (or repo-admin token). Keep tokens secure.

Usage examples
--------------

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

Note: A manual GitHub Actions workflow (`force-delete-workflow-runs.yml`) is also available in this repository for fully automated run deletion via workflow dispatch (uses GitHub CLI). Use it with caution and the same approval process.
