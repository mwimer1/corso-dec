#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';
import { resolveFromRepo } from './_utils';
import { readJsonSync } from '../utils/fs/read';
import { createLintResult } from './_utils';

type PackageJson = { engines?: { node?: string }, packageManager?: string };

const pkgPath = resolveFromRepo('package.json');
const nodeVersionPath = resolveFromRepo('.node-version');

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

const result = createLintResult();

if (!packageManager.startsWith('pnpm@')) {
  result.addError(`package.json.packageManager must pin pnpm, e.g. "pnpm@10.15.0" (found "${packageManager || 'missing'}")`);
}

if (!enginesNode) {
  result.addWarning('package.json.engines.node is missing (recommend pinning to match .node-version).');
}

if (engineNorm && fileNorm && engineNorm.split('.')[0] !== fileNorm.split('.')[0]) {
  result.addWarning(`Node major mismatch: engines.node="${enginesNode}" vs .node-version="${nodeFile}". Recommend aligning.`);
}

function main() {
  // Preserve existing output format
  if (result.hasErrors()) {
    console.error('versions-guard: FAIL');
    for (const e of result.getErrors()) console.error(' - ' + e);
    if (result.hasWarnings()) {
      console.error('\nWarnings:');
      for (const w of result.getWarnings()) console.error(' - ' + w);
    }
    process.exitCode = 1;
  } else {
    console.log('versions-guard: OK');
    for (const w of result.getWarnings()) console.log(' - ' + w);
  }
}

main();



