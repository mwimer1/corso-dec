#!/usr/bin/env tsx
/**
 * Git worktree management helper for parallel branch development
 * 
 * Usage:
 *   pnpm worktree:create feat/auth/improvements
 *   pnpm worktree:list
 *   pnpm worktree:remove feat/auth/improvements
 *   pnpm worktree:cleanup
 * 
 * This script helps manage git worktrees for working on multiple branches
 * simultaneously without stashing/switching. Each worktree gets its own
 * directory and can run a dev server on a different port.
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(fileURLToPath(import.meta.url), '../../..');
const WORKTREE_BASE = join(REPO_ROOT, '..');

function runGit(args: string[], options: { cwd?: string; check?: boolean } = {}): string {
  const { cwd = REPO_ROOT, check = true } = options;
  try {
    const result = spawnSync('git', args, {
      cwd,
      encoding: 'utf-8',
      shell: process.platform === 'win32',
    });
    if (check && result.status !== 0) {
      console.error(`❌ git ${args.join(' ')} failed`);
      process.exitCode = result.status ?? 1;
      throw new Error(`Git command failed: ${args.join(' ')}`);
    }
    return result.stdout?.trim() ?? '';
  } catch (error) {
    if (check) {
      console.error(`❌ Error running git ${args.join(' ')}:`, error);
      process.exitCode = 1;
      throw error;
    }
    return '';
  }
}

function getWorktrees(): Array<{ path: string; branch: string; commit: string }> {
  const output = runGit(['worktree', 'list', '--porcelain']);
  const worktrees: Array<{ path: string; branch: string; commit: string }> = [];
  let current: { path?: string; branch?: string; commit?: string } = {};

  for (const line of output.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current.path) {
        worktrees.push({
          path: current.path ?? '',
          branch: current.branch ?? 'detached',
          commit: current.commit ?? '',
        });
      }
      current = { path: line.replace('worktree ', '') };
    } else if (line.startsWith('HEAD ')) {
      current.commit = line.replace('HEAD ', '');
    } else if (line.startsWith('branch ')) {
      current.branch = line.replace('branch refs/heads/', '');
    }
  }

  if (current.path) {
    worktrees.push({
      path: current.path ?? '',
      branch: current.branch ?? 'detached',
      commit: current.commit ?? '',
    });
  }

  return worktrees;
}

function createWorktree(branchName: string): void {
  // Validate branch name format (feat/scope/desc or fix/scope/desc)
  if (!/^(feat|fix|refactor|docs|test|chore)\/[^/]+\/.+$/.test(branchName)) {
    console.warn(`⚠️  Branch name "${branchName}" doesn't follow conventional format (feat/scope/desc)`);
  }

  // Check if branch exists locally or remotely
  const localBranch = runGit(['rev-parse', '--verify', `refs/heads/${branchName}`], { check: false });
  const remoteBranch = runGit(['ls-remote', '--heads', 'origin', branchName], { check: false });

  if (!localBranch && !remoteBranch) {
    console.error(`❌ Branch "${branchName}" doesn't exist locally or remotely.`);
    console.error(`   Create it first: git checkout -b ${branchName}`);
    process.exitCode = 1;
    return;
  }

  // Create worktree directory name
  const worktreeDir = join(WORKTREE_BASE, `corso-code-${branchName.replace(/\//g, '-')}`);

  if (existsSync(worktreeDir)) {
    console.error(`❌ Worktree directory already exists: ${worktreeDir}`);
    console.error(`   Remove it first: git worktree remove ${worktreeDir}`);
    process.exitCode = 1;
    return;
  }

  // Create worktree
  console.log(`📦 Creating worktree for branch "${branchName}"...`);
  runGit(['worktree', 'add', worktreeDir, branchName]);

  console.log(`✅ Worktree created: ${worktreeDir}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. cd ${worktreeDir}`);
  console.log(`   2. pnpm install`);
  console.log(`   3. PORT=3001 pnpm dev  # Use different port for parallel dev server`);
}

function listWorktrees(): void {
  const worktrees = getWorktrees();

  if (worktrees.length === 0) {
    console.log('📦 No worktrees found (only main working directory)');
    return;
  }

  console.log('📦 Active worktrees:');
  console.log('');
  for (const wt of worktrees) {
    const isMain = wt.path === REPO_ROOT;
    console.log(`  ${isMain ? '📍' : '  '} ${wt.branch.padEnd(30)} ${wt.path}`);
  }
}

function removeWorktree(branchName: string): void {
  const worktrees = getWorktrees();
  const worktreeDir = join(WORKTREE_BASE, `corso-code-${branchName.replace(/\//g, '-')}`);

  const found = worktrees.find(wt => wt.path === worktreeDir || wt.branch === branchName);

  if (!found) {
    console.error(`❌ No worktree found for branch "${branchName}"`);
    console.error(`   Available worktrees:`);
    for (const wt of worktrees) {
      if (wt.path !== REPO_ROOT) {
        console.error(`     - ${wt.branch} (${wt.path})`);
      }
    }
    process.exitCode = 1;
    return;
  }

  if (found.path === REPO_ROOT) {
    console.error(`❌ Cannot remove main working directory`);
    process.exitCode = 1;
    return;
  }

  console.log(`🗑️  Removing worktree: ${found.path}`);
  runGit(['worktree', 'remove', found.path]);
  console.log(`✅ Worktree removed`);
}

function cleanupWorktrees(): void {
  const worktrees = getWorktrees();
  const nonMain = worktrees.filter(wt => wt.path !== REPO_ROOT);

  if (nonMain.length === 0) {
    console.log('✅ No worktrees to clean up');
    return;
  }

  console.log(`🧹 Cleaning up ${nonMain.length} worktree(s)...`);
  for (const wt of nonMain) {
    console.log(`   Removing ${wt.branch}...`);
    runGit(['worktree', 'remove', wt.path], { check: false });
  }
  console.log('✅ Cleanup complete');
}

function showHelp(): void {
  console.log(`
Git Worktree Management Helper

Usage:
  pnpm worktree:create <branch-name>   Create worktree for branch
  pnpm worktree:list                    List all active worktrees
  pnpm worktree:remove <branch-name>   Remove worktree for branch
  pnpm worktree:cleanup                 Remove all worktrees (except main)

Examples:
  # Create worktree for feature branch
  pnpm worktree:create feat/auth/improvements

  # List all worktrees
  pnpm worktree:list

  # Remove specific worktree
  pnpm worktree:remove feat/auth/improvements

  # Clean up all worktrees
  pnpm worktree:cleanup

Notes:
  - Worktrees are created in ../corso-code-<branch-name>
  - Each worktree can run its own dev server on a different port
  - Use PORT=3001 pnpm dev in worktree to avoid port conflicts
  - Worktrees share the same .git directory but have separate working directories
`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
      if (!args[1]) {
        console.error('❌ Branch name required');
        console.error('   Usage: pnpm worktree:create <branch-name>');
        process.exitCode = 1;
        return;
      }
      createWorktree(args[1]);
      break;

    case 'list':
      listWorktrees();
      break;

    case 'remove':
      if (!args[1]) {
        console.error('❌ Branch name required');
        console.error('   Usage: pnpm worktree:remove <branch-name>');
        process.exitCode = 1;
        return;
      }
      removeWorktree(args[1]);
      break;

    case 'cleanup':
      cleanupWorktrees();
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      console.error(`❌ Unknown command: ${command ?? 'none'}`);
      showHelp();
      process.exitCode = 1;
  }
}

void main();
