#!/usr/bin/env node
/**
 * OpenAPI bundling wrapper that sanitizes npm_config_* environment variables
 * to prevent npm warnings about unknown config keys.
 *
 * Context: pnpm injects npm_config_* env vars (e.g., verify-deps-before-run, _jsr-registry)
 * that npm doesn't recognize. When redocly (or its dependencies) invokes npm,
 * these unknown keys trigger warnings. This wrapper removes them before execution.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// npm reads env vars as npm_config_<key> where <key> can have hyphens
// So "verify-deps-before-run" becomes "npm_config_verify-deps-before-run"
// We need to strip these keys case-insensitively and handle both hyphen and underscore variants
const STRIP_PATTERNS = [
  /^npm_config_verify[-_]deps[-_]before[-_]run$/i,
  /^npm_config__jsr[-_]registry$/i,
];

const env = { ...process.env };

// Delete keys matching our patterns (case-insensitive)
for (const k of Object.keys(env)) {
  for (const pattern of STRIP_PATTERNS) {
    if (pattern.test(k)) {
      delete env[k];
      break;
    }
  }
}

// Invoke redocly directly from node_modules to avoid pnpm exec injecting env vars

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '../..');
const redoclyBin = process.platform === 'win32'
  ? join(rootDir, 'node_modules/.bin/redocly.cmd')
  : join(rootDir, 'node_modules/.bin/redocly');

const args = [
  'bundle',
  'api/openapi.yml',
  '-o',
  'api/openapi.json',
  '--ext',
  'json',
];

const res = spawnSync(redoclyBin, args, {
  stdio: 'inherit',
  env,
  cwd: rootDir,
  shell: process.platform === 'win32',
});

process.exit(res.status ?? 1);
