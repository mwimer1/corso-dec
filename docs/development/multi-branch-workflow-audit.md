---
title: "Multi-Branch Development & Auto-Merge Audit"
description: "Comprehensive audit and recommendations for parallel branch development and automated merging"
last_updated: "2026-01-15"
category: "development"
status: "active"
---

# Multi-Branch Development & Auto-Merge Audit

**Goal**: Enable parallel work on multiple changes (feature + bugfix + refactor) with minimal friction, and merge automatically once CI gates are satisfied.

**Constraints**: Keep it simple, boring, and low-maintenance (solo developer). Prefer built-in capabilities (Git + GitHub), avoid bespoke workflows/scripts unless truly necessary.

---

## 1. Current State Summary

### 1.1 Repository Identity

- **Default branch**: `main`
- **Git version**: 2.52.0.windows.1 (worktree support: ✅)
- **Remote**: `https://github.com/mwimer1/corso-dec.git`
- **Current branch**: `main`
- **Worktrees in use**: None (single working directory)
- **Git config**: Standard Windows setup (autocrlf, no symlinks)

### 1.2 Repository Layout

- **Monorepo**: Yes (pnpm workspace)
- **Package manager**: pnpm 10.17.1
- **Dev server**: Next.js on port 3000 (hardcoded in `dev:next` script)
- **Port management**: `scripts/maintenance/ensure-ports.ts` handles port cleanup
- **Environment files**: `.env.local`, `.env.test`, `.env.example` (per-worktree consideration needed)

### 1.3 CI/CD Pipeline

**Workflows that run on PRs:**
1. **Core CI** (`ci.yml`) - ~8-10 min
   - Edge/Node runtime boundaries
   - Setup & Build (multi-OS: Ubuntu, Windows)
   - Code Quality (lint, typecheck, guards)
   - Testing (coverage ≥80%)
   - Security Scan (CodeQL, dependency audit)
   - Coverage Gate

2. **PR Checks** (`pr-checks.yml`) - ~3-4 min
   - Bundle size analysis
   - Lighthouse performance audit
   - Test duplication guard

3. **Quality** (`quality.yml`) - ~2 min
   - Comprehensive quality checks

4. **Security Audit** (`security-audit.yml`) - ~3-5 min
   - Dependency vulnerabilities
   - CodeQL analysis

5. **Validate Cursor Rules** (`validate-cursor-rules.yml`) - ~1 min
   - AI agent rule validation

6. **Dead Code Audit** (`dead-code-audit.yml`) - Variable
   - Code duplication detection

**Total PR CI time**: ~17-22 minutes

**Key Quality Gates:**
- TypeScript compilation
- Linting (ESLint + ast-grep)
- Test coverage ≥80%
- Security audit
- Build verification
- Bundle size checks

### 1.4 GitHub Settings (Inferred)

- **GitHub CLI**: Not installed locally (cannot verify merge settings via API)
- **Branch protection**: Likely enabled (docs mention "requires CI pass")
- **Merge methods**: Unknown (need to verify in GitHub UI)
- **Auto-merge**: Unknown (need to verify in GitHub UI)

### 1.5 Port & Dev Server Configuration

**Current setup:**
- Dev server: `next dev --turbo --hostname localhost -p 3000` (hardcoded)
- Port cleanup: `predev` hook runs `ensure-ports.ts` before starting
- Playwright port: 9323 (for E2E tests)

**Multi-worktree consideration:**
- Port 3000 is hardcoded → **BLOCKER** for parallel dev servers
- Each worktree would need its own port (3000, 3001, 3002, etc.)

---

## 2. Pain Points Identified

### 2.1 Local Development

1. **No worktree support**: Currently using single working directory
   - Must stash/switch between branches
   - Cannot run multiple dev servers simultaneously
   - Context switching overhead

2. **Hardcoded dev port**: Port 3000 is hardcoded in `package.json`
   - Cannot run multiple dev servers without port conflicts
   - Would need environment variable or CLI flag support

3. **Environment file isolation**: `.env.local` is in `.gitignore`
   - Each worktree would share the same `.env.local` (may be desired, but worth noting)
   - Could use per-worktree env files if needed

### 2.2 CI & Merging

1. **No auto-merge configured**: Manual merge required after CI passes
   - Developer must wait for CI, then manually merge
   - No automation for "merge when ready"

2. **GitHub settings unknown**: Cannot verify merge methods or branch protection
   - Need to check GitHub UI to confirm rebase merging is enabled
   - Need to verify required status checks are configured

3. **CI duration**: ~17-22 minutes per PR
   - Reasonable, but means auto-merge wait time is ~20 minutes
   - Could optimize by moving some checks off PR (e.g., dead-code-audit)

---

## 3. Recommendations

### 3.1 Local Development: Use Git Worktrees (✅ Must-Have)

**Why**: Native Git feature, zero maintenance, Cursor-friendly, allows parallel dev servers.

**Implementation**:
1. Use `git worktree` to create separate directories for each branch
2. Each worktree gets its own `node_modules` and build cache
3. Run dev servers on different ports per worktree

**Example workflow**:
```bash
# Create worktree for feature
git worktree add ../corso-code-feat-auth feat/auth/improvements

# Create worktree for bugfix
git worktree add ../corso-code-fix-bug fix/bug/critical-fix

# Work in Terminal 1 (feature)
cd ../corso-code-feat-auth
PORT=3000 pnpm dev

# Work in Terminal 2 (bugfix)
cd ../corso-code-fix-bug
PORT=3001 pnpm dev

# Cleanup when done
git worktree remove ../corso-code-feat-auth
git worktree remove ../corso-code-fix-bug
```

### 3.2 Port Configuration: Support PORT Environment Variable (✅ Must-Have)

**Why**: Enables multiple dev servers without conflicts.

**Implementation**:
- Update `dev:next` script to use `PORT` env var with fallback to 3000
- Update `ensure-ports.ts` to accept port as argument
- Document port usage in README

### 3.3 Auto-Merge: Use Native GitHub Auto-Merge (✅ Must-Have)

**Why**: Built-in, zero maintenance, works with branch protection.

**Implementation**:
1. Verify GitHub repo settings:
   - ✅ Rebase merging enabled
   - ✅ Auto-merge enabled (Settings → General → Pull Requests)
   - ✅ Branch protection: Required status checks configured

2. Enable auto-merge on PRs:
   - Via GitHub UI: "Enable auto-merge" button on PR
   - Via GitHub CLI: `gh pr merge --auto --rebase <number>`

**Required status checks** (minimal set for auto-merge):
- `Core CI / edge-boundaries`
- `Core CI / quality`
- `Core CI / test`
- `Core CI / security`
- `Core CI / coverage_gate`

**Optional checks** (nice-to-have, but not blocking):
- `PR Checks / bundle-size`
- `PR Checks / lighthouse`
- `Security Audit / dependency-audit`

### 3.4 CI Optimization: Move Non-Critical Checks Off PR (✅ Nice-to-Have)

**Why**: Reduce PR CI time, faster feedback loop.

**Implementation**:
- Move `dead-code-audit.yml` to run only on `push:main` or `schedule`
- Keep critical checks on PR: typecheck, lint, test, security

---

## 4. Implementation Steps

### Step 1: Port Configuration (15 minutes)

**File**: `package.json`

```json
{
  "scripts": {
    "dev:next": "cross-env NODE_OPTIONS=--no-deprecation next dev --turbo --hostname localhost -p ${PORT:-3000}"
  }
}
```

**File**: `scripts/maintenance/ensure-ports.ts`
- Already supports `--DevPort` flag ✅
- No changes needed

**File**: `README.md`
- Add section on multi-branch development

### Step 2: GitHub Settings Verification (5 minutes)

**Manual steps** (GitHub UI):
1. Go to Settings → General → Pull Requests
   - ✅ Enable "Allow rebase merging"
   - ✅ Enable "Allow auto-merge"
   - ✅ Set default merge method to "Rebase and merge"

2. Go to Settings → Branches → Branch protection rules → `main`
   - ✅ Require status checks to pass before merging
   - ✅ Select required checks:
     - `Core CI / edge-boundaries`
     - `Core CI / quality`
     - `Core CI / test`
     - `Core CI / security`
     - `Core CI / coverage_gate`
   - ✅ Require branches to be up to date before merging
   - ✅ Require linear history (if desired)

### Step 3: Create Helper Script (Optional, 30 minutes)

**File**: `scripts/dev/worktree.ts`

```typescript
#!/usr/bin/env tsx
/**
 * Git worktree management helper
 * 
 * Usage:
 *   pnpm worktree:create feat/auth/improvements
 *   pnpm worktree:list
 *   pnpm worktree:remove feat/auth/improvements
 */
```

**Benefits**: 
- Consistent worktree naming
- Automatic port assignment
- Cleanup helpers

**Priority**: Nice-to-have (manual `git worktree` commands work fine)

### Step 4: Documentation Updates (20 minutes)

**Files to update**:
1. `README.md` - Add multi-branch workflow section
2. `.cursor/rules/ai-agent-development-environment.mdc` - Add worktree guidance
3. `docs/development/setup-guide.md` - Add worktree examples

### Step 5: Test Workflow (10 minutes)

**Validation checklist**:
- [ ] Create worktree: `git worktree add ../corso-test feat/test`
- [ ] Run dev server in worktree on port 3001: `PORT=3001 pnpm dev`
- [ ] Verify no port conflicts with main worktree
- [ ] Create PR and enable auto-merge
- [ ] Verify auto-merge works after CI passes

---

## 5. Rollback Plan

If worktrees cause issues:

1. **Remove worktrees**: `git worktree remove <path>`
2. **Revert port changes**: Restore hardcoded port 3000 in `package.json`
3. **Disable auto-merge**: GitHub UI → Settings → General → Pull Requests

**No permanent changes**: All changes are reversible.

---

## 6. Decision Matrix

### Must-Have (Core)
- ✅ **Git worktrees**: Native, zero maintenance, Cursor-friendly
- ✅ **PORT env var**: Required for parallel dev servers
- ✅ **GitHub auto-merge**: Built-in, zero maintenance

### Nice-to-Have
- ⚠️ **Helper script**: Convenience, but manual commands work
- ⚠️ **CI optimization**: Faster feedback, but current time is acceptable

### Avoid for Now
- ❌ **Custom auto-merge bot**: Unnecessary complexity
- ❌ **Merge queue**: Only needed for high-volume PRs
- ❌ **Port allocator service**: Over-engineering

---

## 7. Expected Outcomes

### Before
- ❌ Must stash/switch between branches
- ❌ Cannot run multiple dev servers
- ❌ Manual merge after CI passes
- ❌ ~20 minute wait + manual merge = ~25 minutes per PR

### After
- ✅ Parallel work on multiple branches
- ✅ Multiple dev servers (ports 3000, 3001, 3002, etc.)
- ✅ Auto-merge after CI passes
- ✅ ~20 minute wait, automatic merge = ~20 minutes per PR (5 min saved)

### Developer Experience
- **Context switching**: Eliminated (worktrees)
- **Port conflicts**: Eliminated (PORT env var)
- **Manual merge**: Eliminated (auto-merge)
- **Maintenance burden**: Zero (all native features)

---

## 8. Next Steps

1. **Immediate** (Today):
   - [ ] Update `package.json` to support PORT env var
   - [ ] Verify GitHub settings (merge methods, auto-merge, branch protection)
   - [ ] Test worktree workflow locally

2. **This Week**:
   - [ ] Update documentation (README, setup guide)
   - [ ] Create helper script (optional)
   - [ ] Test auto-merge on a real PR

3. **Ongoing**:
   - [ ] Monitor auto-merge success rate
   - [ ] Optimize CI checks if needed
   - [ ] Gather feedback and iterate

---

## 9. References

- [Git Worktrees Documentation](https://git-scm.com/docs/git-worktree)
- [GitHub Auto-Merge Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Cursor Worktrees](https://cursor.sh/docs) (Cursor uses worktrees for parallel agents)

---

**Audit completed**: 2026-01-15  
**Status**: Ready for implementation  
**Complexity**: Low (all native features)  
**Maintenance**: Zero (no custom automation)
