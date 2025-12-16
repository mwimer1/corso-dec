#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readJsonSync } from '../utils/fs/read';

type PackageJson = { engines?: { node?: string }, packageManager?: string };

const pkgPath = resolve(process.cwd(), 'package.json');
const nodeVersionPath = resolve(process.cwd(), '.node-version');

const pkg = readJsonSync(pkgPath) as PackageJson;
const packageManager = pkg.packageManager || '';
const enginesNode = pkg.engines?.node || '';

let nodeFile = '';
try {
  nodeFile = readFileSync(nodeVersionPath, 'utf8').trim();
} catch {
  // Optional: .node-version may be missing in some contexts
}

// Extract pnpm major from packageManager, e.g. "pnpm@10.15.0"
const pmMatch = packageManager.match(/^pnpm@(\d+)\./);
const pnpmMajor = pmMatch ? pmMatch[1] : '';

function normalizeNode(version: string): string {
  // Accept ">=20.19.0" or "^20.19.0" or "20.19.4" → compare loosely
  return version.replace(/^[^\d]*/, '').trim();
}

const engineNorm = normalizeNode(enginesNode);
const fileNorm = normalizeNode(nodeFile);

const errors: string[] = [];
const warnings: string[] = [];

if (!packageManager.startsWith('pnpm@')) {
  errors.push(`package.json.packageManager must pin pnpm, e.g. "pnpm@10.15.0" (found "${packageManager || 'missing'}")`);
}

if (!enginesNode) {
  warnings.push('package.json.engines.node is missing (recommend pinning to match .node-version).');
}

if (engineNorm && fileNorm && engineNorm.split('.')[0] !== fileNorm.split('.')[0]) {
  warnings.push(`Node major mismatch: engines.node="${enginesNode}" vs .node-version="${nodeFile}". Recommend aligning.`);
}

if (errors.length) {
  console.error('versions-guard: FAIL');
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
} else {
  console.log('versions-guard: OK');
  for (const w of warnings) console.log(' - ' + w);
}



