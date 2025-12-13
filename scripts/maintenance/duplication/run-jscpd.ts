#!/usr/bin/env tsx
/**
 * @deprecated This script is deprecated. Use `pnpm validate:duplication` instead.
 * 
 * The custom script used different settings (min-tokens=70, threshold=2) than the
 * standard .jscpd.json config. If you need the lenient check, use:
 *   pnpm dlx jscpd --min-tokens 70 --threshold 2 --reporters consoleFull,html
 * 
 * For standard validation, use:
 *   pnpm validate:duplication
 */

console.warn('⚠️  DEPRECATED: This script is deprecated. Use `pnpm validate:duplication` instead.');
console.warn('   The custom script used lenient settings. For standard validation, use:');
console.warn('   pnpm validate:duplication');
console.warn('   For lenient check, use: pnpm dlx jscpd --min-tokens 70 --threshold 2\n');

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// CLI argument parsing for output directory
const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const REPORTS_ROOT = process.env['REPORTS_ROOT'] ?? "reports";
const DEFAULT_OUT_DIR = path.join(REPORTS_ROOT, "duplication");
const outDir = arg("--out-dir", DEFAULT_OUT_DIR) ?? DEFAULT_OUT_DIR;

// Ensure output directory exists
fs.mkdirSync(outDir, { recursive: true });
execSync([
  'pnpm jscpd',
  '--mode', 'weak',
  '--min-tokens', '70',
  '--threshold', '2',
  '--reporters', 'consoleFull,html',
  `--output`, outDir,
  '--pattern', '"**/*.{ts,tsx}"',
  '--ignore', '"**/{.next,node_modules,dist,coverage}/**"',
].join(' '), { stdio: 'inherit', windowsHide: true });
console.log(`jscpd report written to ${outDir}`);



