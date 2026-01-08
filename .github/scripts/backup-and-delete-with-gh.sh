#!/usr/bin/env bash
set -euo pipefail

# Backup and delete workflow runs using the GitHub CLI (`gh`). This provides
# better auth handling (uses gh auth) and pagination via `--paginate`.
# Usage:
#   OWNER=Corso222 REPO=corso-app DAYS=30 DRY_RUN=true ./backup-and-delete-with-gh.sh

OWNER="${OWNER:?Need OWNER env var}"
REPO="${REPO:?Need REPO env var}"
DAYS="${DAYS:-30}"
DRY_RUN="${DRY_RUN:-true}"

cutoff=$(date -u -d "$DAYS days ago" +%Y-%m-%dT%H:%M:%SZ)

echo "Using gh CLI. Repo: $OWNER/$REPO. Cutoff: $cutoff"
if [ "$DRY_RUN" = "true" ]; then
  echo "DRY_RUN=true — no deletions will be performed. Set DRY_RUN=false to actually delete."
fi

# backup file
backup_dir=".github/scripts/backups"
mkdir -p "$backup_dir"
backup_file="$backup_dir/workflow-runs-backup-$(date -u +%Y%m%dT%H%M%SZ).json"

echo "Exporting runs to $backup_file"
gh api repos/$OWNER/$REPO/actions/runs --paginate --jq '.workflow_runs' > "$backup_file"

echo "Filtering runs older than cutoff and deleting (if not dry-run)"
gh api repos/$OWNER/$REPO/actions/runs --paginate --jq '.workflow_runs[] | select(.created_at < "'"$cutoff"'" ) | .id' \
  | while read -r rid; do
    echo "Found run $rid"
    if [ "$DRY_RUN" = "false" ]; then
      echo "Deleting $rid"
      gh api -X DELETE repos/$OWNER/$REPO/actions/runs/$rid
      sleep 0.2
    fi
  done

echo "Done. Backup stored at $backup_file"


