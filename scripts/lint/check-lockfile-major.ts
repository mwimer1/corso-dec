#!/usr/bin/env tsx
import fs from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { readJsonSync } from '../utils/fs/read';
import { getRepoRoot, createLintResult } from './_utils';

function main() {
  const root = getRepoRoot();
  const pkg = readJsonSync(join(root, 'package.json')) as any;
  const lockPath = join(root, 'pnpm-lock.yaml');
  const result = createLintResult();

  if (!fs.existsSync(lockPath)) {
    result.addError('pnpm-lock.yaml not found.');
    result.report();
    return;
  }

  const lockRaw = fs.readFileSync(lockPath, 'utf8');
  let lockMajor = NaN;
  try {
    const doc = YAML.parse(lockRaw) as any;
    const v = doc?.lockfileVersion;
    if (typeof v === 'number') lockMajor = Math.floor(v);
    else if (typeof v === 'string') lockMajor = Math.floor(Number(v));
  } catch {
    // Fallback to regex if YAML parse fails
    const m = lockRaw.match(/lockfileVersion:\s*("?)(\d+)(?:\.\d+)?\1/);
    if (m) lockMajor = Number(m[2]);
  }

  if (!Number.isFinite(lockMajor)) {
    result.addError('Unable to read lockfileVersion from pnpm-lock.yaml');
    result.report();
    return;
  }

  const pm = pkg.packageManager ?? '';
  const pmMatch = pm.match(/pnpm@(\d+)/);
  const pnpmMajor = pmMatch ? Number(pmMatch[1]) : NaN;

  if (!Number.isFinite(pnpmMajor)) {
    result.addWarning('package.json:packageManager does not specify pnpm@<major>. Add it for deterministic installs.');
  } else if (lockMajor > pnpmMajor) {
    result.addError(
      `Lockfile major (${lockMajor}) is newer than configured pnpm major (${pnpmMajor}). ` +
      'Update packageManager pnpm@<version> or regenerate the lockfile using the configured pnpm.'
    );
  } else if (lockMajor < pnpmMajor) {
    result.addWarning(
      `Lockfile major (${lockMajor}) is older than pnpm major (${pnpmMajor}). ` +
      'Consider re-generating the lockfile with the configured pnpm.'
    );
  }

  // Preserve original output format
  if (result.hasErrors()) {
    for (const error of result.getErrors()) {
      console.error(error);
    }
    if (result.hasWarnings()) {
      for (const warning of result.getWarnings()) {
        console.warn(warning);
      }
    }
    process.exitCode = 1;
  } else {
    if (result.hasWarnings()) {
      for (const warning of result.getWarnings()) {
        console.warn(warning);
      }
    }
    console.log(`\u2713 pnpm-lock.yaml v${lockMajor} compatible with pnpm major ~${Number.isFinite(pnpmMajor) ? pnpmMajor : 'unknown'}`);
  }
}

main();



