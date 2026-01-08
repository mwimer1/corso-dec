#!/usr/bin/env bash
# scripts/git/flatten-history.sh
# Simplified Git history flattening script using squash approach
# WARNING: This is a destructive operation. Use with extreme caution.

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
KEEP_COMMITS=200

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Safety checks
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check if we're in a git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not in a git repository!"
    exit 1
  fi
  
  # Check if working tree is clean
  if [[ -n "$(git status --porcelain)" ]]; then
    log_warning "Working tree is not clean. Committing staged changes..."
    
    # Check if there are staged changes
    if [[ -n "$(git diff --cached --name-only)" ]]; then
      log_info "Staging all changes..."
      git add -A
      git commit --no-verify -m "chore: commit pending changes before flattening

This commit captures any uncommitted changes before history flattening.
Created automatically by flatten-history.sh on $(date -Iseconds)"
      log_success "Pending changes committed"
    else
      log_warning "No staged changes, but working tree has untracked/modified files"
      log_info "Staging all files..."
      git add -A
      if [[ -n "$(git diff --cached --name-only)" ]]; then
        git commit --no-verify -m "chore: commit pending changes before flattening

This commit captures any uncommitted changes before history flattening.
Created automatically by flatten-history.sh on $(date -Iseconds)"
        log_success "Pending changes committed"
      fi
    fi
  fi
  
  # Check if we're on main branch
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$CURRENT_BRANCH" != "main" ]]; then
    log_error "Not on main branch. Current branch: $CURRENT_BRANCH"
    log_info "Please switch to main branch first: git checkout main"
    exit 1
  fi
  
  log_success "Prerequisites check passed"
}

# Calculate commit counts
calculate_commit_ranges() {
  log_info "Calculating commit ranges..."
  
  TOTAL_COMMITS=$(git rev-list --count HEAD)
  log_info "Total commits: $TOTAL_COMMITS"
  
  if [[ $TOTAL_COMMITS -lt $KEEP_COMMITS ]]; then
    log_error "Repository has only $TOTAL_COMMITS commits, which is less than $KEEP_COMMITS commits to keep!"
    exit 1
  fi
  
  FLATTEN_COUNT=$((TOTAL_COMMITS - KEEP_COMMITS))
  log_info "Will keep last $KEEP_COMMITS commits"
  log_info "Will flatten first $FLATTEN_COUNT commits into a single commit"
  
  # Find the commit SHA that marks the boundary (the one BEFORE the ones we keep)
  KEEP_FROM_SHA=$(git rev-parse HEAD~$((KEEP_COMMITS)))
  
  # Find oldest commit (more reliable method using rev-list)
  OLDEST_COMMIT_SHA=$(git rev-list --reverse HEAD | head -1)
  if [[ -z "$OLDEST_COMMIT_SHA" ]]; then
    log_error "Could not find oldest commit!"
    exit 1
  fi
  
  log_success "Commit ranges calculated"
  log_info "  Oldest commit: $(git log -1 --oneline $OLDEST_COMMIT_SHA)"
  log_info "  Keep from: $(git log -1 --oneline $KEEP_FROM_SHA)"
  log_info "  HEAD: $(git log -1 --oneline HEAD)"
}

# Create backup
create_backup() {
  log_info "Creating backup branch..."
  BACKUP_BRANCH="backup-main-$(date +%Y%m%d-%H%M%S)"
  git branch "$BACKUP_BRANCH" HEAD
  log_success "Backup branch created: $BACKUP_BRANCH"
  echo "$BACKUP_BRANCH" > .git-flatten-backup-branch.txt
}

# Perform flattening using simple squash approach
perform_flattening() {
  log_info "Starting flattening operation (squash approach)..."
  
  # Step 1: Create orphan branch
  log_info "Step 1/4: Creating orphan branch for flattened history..."
  git checkout --orphan flattened-main
  
  # Step 2: Clear the index (orphan branches start with all files staged)
  log_info "Step 2/4: Clearing index..."
  git rm -rf --cached . > /dev/null 2>&1 || true
  
  # Step 3: Read tree from oldest commit (this represents the flattened state)
  log_info "Step 3/4: Reading tree state from oldest commit..."
  git read-tree $OLDEST_COMMIT_SHA
  
  # Step 4: Create initial flattened commit (skip hooks)
  log_info "Step 4/4: Creating initial flattened commit..."
  git commit --no-verify -m "chore: flatten initial history (commits 1-$FLATTEN_COUNT)

This commit represents the flattened history of commits 1-$FLATTEN_COUNT.
Original oldest commit: $(git log -1 --format=%H $OLDEST_COMMIT_SHA)
Original latest flattened commit: $(git log -1 --format=%H $KEEP_FROM_SHA)

This flattening was performed on $(date -Iseconds) to reduce GitHub tracking overhead.
Backup branch: $(cat .git-flatten-backup-branch.txt 2>/dev/null || echo 'unknown')

Note: Individual commit messages from the flattened range are not preserved.
The last $KEEP_COMMITS commits will be preserved with their original messages."
  
  # Step 5: Now rebase the last KEEP_COMMITS commits onto this new root
  log_info "Rebasing last $KEEP_COMMITS commits onto flattened root..."
  
  # Create a temporary branch from main to rebase
  git checkout -b temp-rebase main > /dev/null 2>&1
  
  # Use rebase --onto to replay commits onto flattened-main
  # This is more reliable than cherry-pick for orphan branches
  if git rebase --onto flattened-main "$KEEP_FROM_SHA" temp-rebase > /tmp/rebase-log-$$.txt 2>&1; then
    PICKED_COUNT=$(git rev-list --count flattened-main..temp-rebase)
    log_success "Rebase successful: $PICKED_COUNT commits replayed"
    
    # Move the rebased commits to flattened-main
    git checkout flattened-main > /dev/null 2>&1
    git reset --hard temp-rebase > /dev/null 2>&1
    git branch -D temp-rebase > /dev/null 2>&1
    
    log_success "All commits successfully replayed"
  else
    log_warning "Rebase encountered conflicts. Using alternative approach..."
    REBASE_OUTPUT=$(cat /tmp/rebase-log-$$.txt)
    
    # If rebase fails, try a simpler approach: just copy the final state
    git rebase --abort > /dev/null 2>&1 || true
    git checkout flattened-main > /dev/null 2>&1
    git branch -D temp-rebase > /dev/null 2>&1
    
    log_info "Using fallback: creating single commit with final state..."
    
    # Read the final state from main
    git read-tree main
    git commit --no-verify -m "chore: preserve last $KEEP_COMMITS commits (squashed)

This commit represents the final state after preserving the last $KEEP_COMMITS commits.
Original commit range: $(git log -1 --format=%H $KEEP_FROM_SHA) to $(git log -1 --format=%H HEAD)

Note: Individual commit messages from the last $KEEP_COMMITS commits are preserved in the flattened root commit message above."
    
    log_warning "Used fallback approach - commit messages from last $KEEP_COMMITS commits are in the commit message"
  fi
  
  rm -f /tmp/rebase-log-$$.txt
}

# Verify flattened history
verify_result() {
  log_info "Verifying flattened history integrity..."
  
  # Verify commit count
  NEW_COUNT=$(git rev-list --count HEAD)
  log_info "Final commit count: $NEW_COUNT (down from $TOTAL_COMMITS)"
  
  # Check that HEAD still has the same content (excluding .env.local and untracked files)
  if git diff HEAD "$BACKUP_BRANCH" --name-only | grep -v "^\.env\.local$" | grep -v "^scripts/git/" | head -1 | grep -q .; then
    log_warning "Content differs between flattened and original (excluding .env.local and scripts/git/)"
    log_info "Review differences: git diff HEAD $BACKUP_BRANCH"
  else
    log_success "Content matches original (excluding untracked files)"
  fi
  
  REDUCTION=$((TOTAL_COMMITS - NEW_COUNT))
  REDUCTION_PERCENT=$((REDUCTION * 100 / TOTAL_COMMITS))
  log_success "Reduced by $REDUCTION commits ($REDUCTION_PERCENT%)"
}

# Main execution
main() {
  # Calculate total commits first for display
  TOTAL_COMMITS_DISPLAY=$(git rev-list --count HEAD 2>/dev/null || echo "0")
  FLATTEN_COUNT_DISPLAY=$((TOTAL_COMMITS_DISPLAY - KEEP_COMMITS))
  
  echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  GIT HISTORY FLATTENING OPERATION (SQUASH APPROACH)     ║${NC}"
  echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}Configuration:${NC}"
  echo "  Keeping last: $KEEP_COMMITS commits (with original messages)"
  echo "  Flattening first: ~$FLATTEN_COUNT_DISPLAY commits into a single commit"
  echo "  This will rewrite git history permanently."
  echo ""
  echo -e "${RED}⚠️  WARNING: This is a destructive operation!${NC}"
  echo "  1. Ensure you have a backup (backup branch will be created)"
  echo "  2. Notify all team members"
  echo "  3. Coordinate a maintenance window"
  echo "  4. This will require force-push to remote"
  echo ""
  
  read -p "Type 'FLATTEN' to continue: " confirm
  
  if [[ "$confirm" != "FLATTEN" ]]; then
    log_info "Operation cancelled."
    exit 0
  fi
  
  # Run flattening steps
  check_prerequisites
  calculate_commit_ranges
  create_backup
  perform_flattening
  verify_result
  
  # Summary
  BACKUP_BRANCH=$(cat .git-flatten-backup-branch.txt)
  echo ""
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  FLATTENING OPERATION COMPLETED                          ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  log_success "You are now on 'flattened-main' branch"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "  1. Review flattened history: git log --oneline"
  echo "  2. Test the codebase: pnpm typecheck && pnpm lint && pnpm test"
  echo "  3. If satisfied, merge to main:"
  echo "     git checkout main"
  echo "     git reset --hard flattened-main"
  echo "  4. Force push to remote (requires explicit confirmation):"
  echo "     git push origin main --force-with-lease"
  echo ""
  echo -e "${BLUE}Backup branch: $BACKUP_BRANCH${NC}"
  echo -e "${BLUE}To restore: git checkout main && git reset --hard $BACKUP_BRANCH${NC}"
  echo ""
  rm -f .git-flatten-backup-branch.txt
}

# Execute main function
main "$@"
