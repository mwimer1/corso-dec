#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rulesDir = resolve(process.cwd(), 'scripts/rules/ast-grep');

function scanRule(rulePath, extraPaths = []) {
  const args = ['scan', '-r', rulePath, ...extraPaths];
  const result = spawnSync('sg', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status || 0;
}

let exitCode = 0;

try {
  if (!existsSync(rulesDir)) {
    console.error('[runtime-boundaries] rules dir not found:', rulesDir);
    process.exit(1);
  }

  // Explicit allowlist of runtime-boundary consolidated rules
  const ruleFiles = [
    'consolidated-no-server-import-in-edge-runtime.yml',
    'consolidated-forbid-security-barrel-in-client-or-edge.yml',
    'consolidated-no-server-reexports.yml',
    'consolidated-forbid-server-only-in-shared.yml',
  ]
    .map((name) => resolve(rulesDir, name))
    .filter((file) => existsSync(file));

  if (ruleFiles.length === 0) {
    console.error('[runtime-boundaries] No consolidated runtime rule files found in', rulesDir);
    process.exit(1);
  }

  for (const file of ruleFiles) {
    // Scope the server re-export rule to client/shared only to avoid false positives in server barrels
    const extra = file.endsWith('consolidated-no-server-reexports.yml')
      ? ['components', 'lib/shared']
      : [];
    const code = scanRule(file, extra);
    if (code !== 0) exitCode = code;
  }
} catch (err) {
  console.error('[runtime-boundaries] Failed to execute scans:', err?.message || err);
  exitCode = 1;
}

process.exit(exitCode);


