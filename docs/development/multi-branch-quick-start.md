---
status: "active"
last_updated: "2026-01-03"
category: "documentation"
title: "Development"
description: "Documentation and resources for documentation functionality. Located in development/."
---
# Multi-Branch Development Quick Start

**TL;DR**: Use git worktrees to work on multiple branches simultaneously. Each worktree can run its own dev server on a different port.

---

## Quick Commands

```bash
# Create worktree for a branch
pnpm worktree:create feat/auth/improvements

# List all worktrees
pnpm worktree:list

# Remove a worktree
pnpm worktree:remove feat/auth/improvements

# Clean up all worktrees
pnpm worktree:cleanup
```

---

## Typical Workflow

### 1. Create Worktree

```bash
# Create worktree for feature branch
pnpm worktree:create feat/auth/improvements

# Output shows worktree location:
# ✅ Worktree created: ../corso-code-feat-auth-improvements
```

### 2. Setup Worktree

```bash
# Navigate to worktree
cd ../corso-code-feat-auth-improvements

# Install dependencies
pnpm install

# Copy environment file (if needed)
cp ../corso-code/.env.local .env.local
```

### 3. Run Dev Server (Different Port)

```bash
# Run dev server on port 3001 (main worktree uses 3000)
PORT=3001 pnpm dev

# Or on Windows PowerShell:
$env:PORT=3001; pnpm dev
```

### 4. Work in Parallel

- **Terminal 1** (main worktree): `pnpm dev` → `http://localhost:3000`
- **Terminal 2** (feature worktree): `PORT=3001 pnpm dev` → `http://localhost:3001`

### 5. Cleanup

```bash
# Remove worktree when done
pnpm worktree:remove feat/auth/improvements

# Or remove all worktrees at once
pnpm worktree:cleanup
```

---

## Port Management

Each worktree should use a different port to avoid conflicts:

| Worktree | Port | URL |
|----------|------|-----|
| Main | 3000 | `http://localhost:3000` |
| Feature 1 | 3001 | `http://localhost:3001` |
| Feature 2 | 3002 | `http://localhost:3002` |
| Bugfix | 3003 | `http://localhost:3003` |

**Set port via environment variable:**
```bash
# Unix/Mac/Git Bash
PORT=3001 pnpm dev

# Windows PowerShell
$env:PORT=3001; pnpm dev

# Windows CMD
set PORT=3001 && pnpm dev
```

---

## Auto-Merge Setup

### 1. Verify GitHub Settings

Go to **Settings → General → Pull Requests**:
- ✅ Enable "Allow rebase merging"
- ✅ Enable "Allow auto-merge"

Go to **Settings → Branches → Branch protection rules → main**:
- ✅ Require status checks to pass before merging
- ✅ Select required checks (Core CI jobs)
- ✅ Require branches to be up to date before merging

### 2. Enable Auto-Merge on PR

**Via GitHub UI:**
1. Open PR
2. Click "Enable auto-merge"
3. Select "Rebase and merge"
4. PR will merge automatically when CI passes

**Via GitHub CLI** (if installed):
```bash
gh pr merge --auto --rebase <pr-number>
```

---

## Common Patterns

### Working on Feature + Bugfix Simultaneously

```bash
# Create worktrees
pnpm worktree:create feat/auth/improvements
pnpm worktree:create fix/bug/critical-fix

# Terminal 1: Feature
cd ../corso-code-feat-auth-improvements
pnpm install
PORT=3001 pnpm dev

# Terminal 2: Bugfix
cd ../corso-code-fix-bug-critical-fix
pnpm install
PORT=3002 pnpm dev

# Terminal 3: Main (if needed)
cd ../corso-code
pnpm dev  # Uses port 3000
```

### Switching Between Worktrees

```bash
# List all worktrees
pnpm worktree:list

# Navigate to worktree
cd ../corso-code-feat-auth-improvements

# Work normally (git commands work as expected)
git status
git add .
git commit -m "feat(auth): improve login flow"
git push origin feat/auth/improvements
```

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port (Windows)
netstat -ano | findstr :3001
taskkill /PID <pid> /F

# Kill process on port (Unix/Mac)
lsof -ti:3001 | xargs kill -9
```

### Worktree Directory Already Exists

```bash
# Remove existing worktree
git worktree remove ../corso-code-feat-auth-improvements

# Or manually delete directory (if git worktree remove fails)
rm -rf ../corso-code-feat-auth-improvements
```

### Environment Variables Not Working

**Windows PowerShell:**
```powershell
# Set for current session
$env:PORT=3001

# Verify
echo $env:PORT

# Run command
pnpm dev
```

**Windows CMD:**
```cmd
set PORT=3001
pnpm dev
```

---

## Best Practices

1. **Use descriptive branch names**: Follow `feat/scope/description` format
2. **Clean up worktrees**: Remove when done to save disk space
3. **Use different ports**: Avoid conflicts between worktrees
4. **Share .env.local carefully**: Each worktree can have its own `.env.local` if needed
5. **Enable auto-merge**: Let CI handle merging automatically

---

## See Also

- [Multi-Branch Workflow Audit](multi-branch-workflow-audit.md) - Detailed audit and recommendations
- [Git Worktrees Documentation](https://git-scm.com/docs/git-worktree)
- [GitHub Auto-Merge Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)
