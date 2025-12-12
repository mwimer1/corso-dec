#!/usr/bin/env bash
set -euo pipefail

# Delete GitHub Actions workflow runs older than N days for a repository
# Usage:
#   GITHUB_TOKEN=ghp_xxx OWNER=Corso222 REPO=corso-app DAYS=30 DRY_RUN=true ./delete-workflow-runs.sh
# Notes:
# - By default DRY_RUN=true (no deletions). Set DRY_RUN=false to actually delete.
# - Uses GitHub CLI (gh) for better performance and authentication handling.
# - GitHub API rate limit: 5000 requests/hour, so minimal delay needed.

: "${GITHUB_TOKEN:?Need GITHUB_TOKEN env var (PAT or repo admin token)}"
: "${OWNER:?Need OWNER env var}"
: "${REPO:?Need REPO env var}"
DAYS="${DAYS:-30}"
DRY_RUN="${DRY_RUN:-true}"
DELETE_ALL="${DELETE_ALL:-false}"

# GitHub API allows 5000 requests/hour = ~1.4 requests/second
# Using 0.1s delay instead of 0.2s for 2x speed improvement
API_DELAY="${API_DELAY:-0.1}"

cutoff=$(date -u -d "$DAYS days ago" +%Y-%m-%dT%H:%M:%SZ)

echo "Repository: $OWNER/$REPO"
if [ "$DELETE_ALL" = "true" ]; then
  echo "Mode: DELETE_ALL=true — targeting ALL workflow runs."
else
  echo "Cutoff: $cutoff (will target runs created before this)"
fi
if [ "$DRY_RUN" = "true" ]; then
  echo "DRY_RUN=true — no deletions will be performed. Set DRY_RUN=false to actually delete."
fi

# Use GitHub CLI with pagination for better performance
echo "Fetching workflow runs..."
if [ "$DELETE_ALL" = "true" ]; then
  # Get all run IDs
  ids=$(gh api repos/$OWNER/$REPO/actions/runs --paginate --jq '.workflow_runs[].id' 2>/dev/null || echo "")
else
  # Get run IDs older than cutoff
  ids=$(gh api repos/$OWNER/$REPO/actions/runs --paginate --jq ".workflow_runs[] | select(.created_at < \"$cutoff\") | .id" 2>/dev/null || echo "")
fi

if [ -z "$ids" ]; then
  echo "No runs to delete."
  exit 0
fi

echo "Found $(echo "$ids" | wc -l) runs to process"

# Process each run ID
run_count=0
while IFS= read -r id; do
  if [ -z "$id" ] || [ "$id" = "null" ]; then
    continue
  fi

  run_count=$((run_count + 1))
  echo "[$run_count] Processing run $id"

  if [ "$DRY_RUN" = "false" ]; then
    echo "  Deleting run $id..."
    if gh api -X DELETE repos/$OWNER/$REPO/actions/runs/$id >/dev/null 2>&1; then
      echo "  ✓ Deleted run $id"
    else
      echo "  ✗ Failed to delete run $id"
    fi
    # Minimal delay to respect API rate limits
    sleep "$API_DELAY"
  else
    echo "  (DRY RUN) Would delete run $id"
  fi
done <<< "$ids"

echo "Done. Processed $run_count runs."


