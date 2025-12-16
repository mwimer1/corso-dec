#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { readJsonSync } from '../utils/fs/read';

const root = process.cwd();
const pkg = readJsonSync(path.join(root, 'package.json')) as any;
const lockPath = path.join(root, 'pnpm-lock.yaml');

if (!fs.existsSync(lockPath)) {
  console.error('pnpm-lock.yaml not found.');
  process.exit(1);
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
  console.error('Unable to read lockfileVersion from pnpm-lock.yaml');
  process.exit(1);
}

const pm = pkg.packageManager ?? '';
const pmMatch = pm.match(/pnpm@(\d+)/);
const pnpmMajor = pmMatch ? Number(pmMatch[1]) : NaN;

if (!Number.isFinite(pnpmMajor)) {
  console.warn('package.json:packageManager does not specify pnpm@<major>. Add it for deterministic installs.');
} else if (lockMajor > pnpmMajor) {
  console.error(
    `Lockfile major (${lockMajor}) is newer than configured pnpm major (${pnpmMajor}). ` +
    'Update packageManager pnpm@<version> or regenerate the lockfile using the configured pnpm.'
  );
  process.exit(1);
} else if (lockMajor < pnpmMajor) {
  console.warn(
    `Lockfile major (${lockMajor}) is older than pnpm major (${pnpmMajor}). ` +
    'Consider re-generating the lockfile with the configured pnpm.'
  );
}

console.log(`\u2713 pnpm-lock.yaml v${lockMajor} compatible with pnpm major ~${Number.isFinite(pnpmMajor) ? pnpmMajor : 'unknown'}`);



