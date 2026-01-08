/*
  Windows-first, non-interactive branch setup script.
  Steps (sequential):
  - Ensure git is available; switch to main (create tracking if needed)
  - Fetch origin, prune, reset hard to origin/main
  - Clean workspace of build caches/reports
  - Install deps with frozen lockfile
  - Verify AI tools and environment
  - Typecheck then lint
  - Kick off helpful reports in the background (best-effort)
*/

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function run(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.status}`);
  }
}

function tryRun(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
  // Best-effort: do not throw; leave non-zero exit visible but continue
  if (result.status !== 0) {
    // no-op; keep going
  }
}

function background(name: string, command: string, args: string[]) {
  // Spawn detached where supported; inherit stdio so logs are visible without pagers
  const child = spawn(command, args, {
    stdio: 'ignore',
    shell: process.platform === 'win32',
    detached: true,
  });
  child.unref();
}

function ensureReportsDir() {
  const dir = join(process.cwd(), 'reports');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function main() {
  // 1) Ensure git present and switch to main
  tryRun('git', ['--version']);
  // Configure no pager for logs by default
  process.env['GIT_PAGER'] = '';

  // Ensure automatic pruning is enabled for repository hygiene
  const pruneCheck = spawnSync('git', ['config', '--get', 'fetch.prune'], {
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  });
  if (!pruneCheck.stdout?.trim()) {
    tryRun('git', ['config', 'fetch.prune', 'true']);
  }

  // Detect current branch
  const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf-8', shell: process.platform === 'win32' });
  const current = (branch.stdout || '').trim();
  if (current !== 'main') {
    // Ensure upstream main exists
    tryRun('git', ['fetch', 'origin', 'main', '--prune']);
    // Create local main if missing and track
    tryRun('git', ['rev-parse', '--verify', 'main']);
    if ((spawnSync('git', ['rev-parse', '--verify', 'main'], { shell: process.platform === 'win32' }).status ?? 1) !== 0) {
      run('git', ['checkout', '-b', 'main', '--track', 'origin/main']);
    } else {
      run('git', ['checkout', 'main']);
    }
  }

  // 2) Fetch/prune and reset to origin/main for a clean baseline
  run('git', ['fetch', '--all', '--prune']);
  tryRun('git', ['remote', 'prune', 'origin']);
  // Create origin/main if absent
  tryRun('git', ['show-ref', '--verify', '--quiet', 'refs/remotes/origin/main']);
  run('git', ['reset', '--hard', 'origin/main']);

  // 3) Clean common caches (Windows-safe)
  tryRun('pnpm', ['run', 'cleanup']);

  // 4) Install deps (frozen)
  run('pnpm', ['install', '--frozen-lockfile']);

  // 5) Verify tools and basic env
  tryRun('pnpm', ['run', 'verify:ai-tools']);
  tryRun('pnpm', ['run', 'validate:env']);

  // 6) Typecheck then lint (sequential)
  run('pnpm', ['run', 'typecheck']);
  run('pnpm', ['run', 'lint']);

  // 7) Background reports (best-effort, non-blocking)
  ensureReportsDir();
  background('jscpd-code', 'pnpm', ['run', 'jscpd:report']);
  background('jscpd-docs', 'pnpm', ['run', 'jscpd:docs']);
  background('depcheck', 'pnpm', ['run', 'audit:unused']);
  background('dependency-cruiser', 'pnpm', ['run', 'validate:dependencies']);
  background('ast-grep', 'pnpm', ['run', 'validate:ast-grep']);
  background('dead-code', 'pnpm', ['run', 'validate:dead-code:all']);

  // Optional: bundle size check in background
  background('bundlesize', 'pnpm', ['run', 'bundlesize']);

  // Optional: local quality gate (light)
  // background('quality-local', 'pnpm', ['run', 'quality:local']);

  // Done
  // Keep exit code 0 if we reached here without throws
}

try {
  main();
} catch (err) {
  // Error already printed by run(); ensure non-zero exit
  if (process.exitCode === 0) {
    process.exitCode = 1;
  }
}

