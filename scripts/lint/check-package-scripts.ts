#!/usr/bin/env tsx
/**
 * Script-key linter:
 * - ERROR: same command string defined under multiple script keys (duplicates).
 * - WARN: non-standard script prefixes (nudges toward a consistent schema).
 * - Guarantees fast feedback on `pnpm lint` via "prelint".
 */
import { resolve } from 'node:path';
import { readJsonSync } from '../utils/fs/read';

type Pkg = { scripts?: Record<string, string> };
const pkgPath = resolve(process.cwd(), 'package.json');
const pkg = readJsonSync(pkgPath) as Pkg;
const scripts = pkg.scripts ?? {};
const keys = Object.keys(scripts);

const errors: string[] = [];
const warnings: string[] = [];

// Allowed prefixes (tuned to current repo conventions)
// Expanded to avoid false warnings for legitimate script groups
const allowedPrefixes = [
  'lint', 'typecheck', 'test', 'validate', 'build', 'start', 'dev',
  'ci', 'analysis', 'codemods', 'scripts', 'preview',
  'format', 'prettier', 'openapi', 'knip', 'madge', 'ast-grep', 'jscpd',
  // Newly allowed stable groups
  'a11y', 'audit', 'deps', 'docs', 'env', 'tools', 'cleanup',
  'bundlesize', 'sg', 'scan', 'dedupe', 'gen',
  // Added prefixes to cover all current scripts
  'fix', 'verify', 'plugin', 'guards', 'tailwind', 'hardening', 'update',
  'browsers', 'ast', 'tree', 'jd', 'json', 'lock', 'canary', 'setup',
  'ai', 'maintenance', 'quality', 'dep',
  'check',
  // Allow guard, scaffold, agent and rules groups used in this repo
  'guard', 'scaffold', 'agent', 'rules',
  // Diagnostic scripts for runtime and system checks
  'diag',
  // Monitoring scripts for production health checks
  'monitor',
  // Dead code analysis scripts (e.g., deadcode:test-only finds exports only used in tests)
  // Note: deadcode:test-only is intentionally kept as a specialized tool, distinct from validate:dead-code
  'deadcode'
];
const prefixRe = new RegExp(`^(${allowedPrefixes.join('|')})(:|$)`);

// Canonical names we prefer when duplicates occur
const canonicalKeys = new Set<string>([
  'lint:edge', 'lint:workflows:pnpm',
  'validate', 'validate:dead-code', 'validate:dead-code:all',
  'validate:orphans', 'validate:cycles', 'validate:ts-unused',
  'validate:duplication',
  'ast-grep:scan'
]);

// Known lifecycle scripts to ignore for prefix checking
const lifecycle = new Set([
  'prepare','prepublishOnly','postinstall','postpack','prepack','postversion','preversion','version'
]);
// Additionally allow any npm pre*/post* auto-hooks (e.g., prelint, posttest)
function isLifecycleHook(key: string): boolean {
  return lifecycle.has(key) || key.startsWith('pre') || key.startsWith('post');
}

// 1) Prefix guidance (warning only)
for (const k of keys) {
  if (!prefixRe.test(k) && !isLifecycleHook(k)) {
    warnings.push(
      `Non-standard script prefix: "${k}". ` +
      `Consider aligning with: ${allowedPrefixes.join(', ')}`
    );
  }
}

// 2) Duplicate command detection (error)
const commandToKeys = new Map<string, string[]>();
for (const k of keys) {
  const cmd = (scripts[k] || '').trim();
  const arr = commandToKeys.get(cmd) ?? [];
  arr.push(k);
  commandToKeys.set(cmd, arr);
}
for (const [cmd, ks] of commandToKeys.entries()) {
  if (!cmd) continue;
  if (ks.length > 1) {
    const preferred = ks.find(k => canonicalKeys.has(k)) ?? [...ks].sort((a, b) => a.length - b.length)[0];
    const others = ks.filter(k => k !== preferred);
    errors.push(
      `Duplicate script command detected: ${JSON.stringify(cmd)} is defined under [${ks.join(', ')}]. ` +
      `Prefer a single key: "${preferred}". Remove: ${others.map(o => `"${o}"`).join(', ')}`
    );
  }
}

// 3) Recommend core validate scripts exist (warning)
for (const req of ['validate','validate:dead-code','validate:dead-code:all']) {
  if (!scripts[req]) warnings.push(`Missing recommended script "${req}".`);
}

if (errors.length) {
  console.error('script-key linter: FAIL');
  for (const e of errors) console.error(' - ' + e);
  if (warnings.length) {
    console.error('Warnings:');
    for (const w of warnings) console.error(' - ' + w);
  }
  process.exit(1);
} else {
  console.log('script-key linter: OK');
  if (warnings.length) {
    console.log('Warnings:');
    for (const w of warnings) console.log(' - ' + w);
  }
}



