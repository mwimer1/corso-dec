#!/usr/bin/env tsx
/**
 * Verifies ESLint plugin TypeScript declaration file structure.
 * 
 * Validates that eslint-plugin-corso/dist/index.d.ts has proper exports structure:
 * - Top-level rules export as concrete value (not alias)
 * - Namespace configs export rules as values (not aliases)
 * 
 * Intent: Ensure ESLint plugin TypeScript definitions are correct
 * Files: eslint-plugin-corso/dist/index.d.ts
 * Invocation: pnpm verify:plugin:dts
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readTextSync } from '../utils/fs/read';

function die(msg: string): void {
  console.error(`[verify-eslint-plugin-dts] ${msg}`);
  process.exitCode = 1;
}

function main(): void {
  const local = join(process.cwd(), 'dist', 'index.d.ts');
  const dtsPath = existsSync(local) ? local : join(process.cwd(), 'eslint-plugin-corso', 'dist', 'index.d.ts');
  const dts = readTextSync(dtsPath);

  const hasTopRules = /export\s+let\s+rules\s*:\s*\{[\s\S]*?\};/m.test(dts);
  if (!hasTopRules) {
    die("Missing top-level 'export let rules: { ... };' declaration");
    return;
  }

  const badAlias = /rules_\d+\s+as\s+rules/.test(dts);
  if (badAlias) {
    die("Found alias export 'rules_# as rules' – should be concrete value export");
    return;
  }

  // Inside namespaces (configs.recommended/strict), ensure rules is exported as a value
  const nsAlias = /namespace\s+(recommended|strict)[\s\S]*?export\s*\{\s*rules_\d+\s+as\s+rules\s*\};/m.test(dts);
  if (nsAlias) {
    die('Found alias export inside configs namespace');
    return;
  }

  console.log('[verify-eslint-plugin-dts] OK');
}

main();



