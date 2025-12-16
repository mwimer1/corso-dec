#!/usr/bin/env tsx
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readTextSync } from '../utils/fs/read';

function die(msg: string): never {
  console.error(`[verify-eslint-plugin-dts] ${msg}`);
  process.exit(1);
}

function main(): void {
  const local = join(process.cwd(), 'dist', 'index.d.ts');
  const dtsPath = existsSync(local) ? local : join(process.cwd(), 'eslint-plugin-corso', 'dist', 'index.d.ts');
  const dts = readTextSync(dtsPath);

  const hasTopRules = /export\s+let\s+rules\s*:\s*\{[\s\S]*?\};/m.test(dts);
  if (!hasTopRules) die("Missing top-level 'export let rules: { ... };' declaration");

  const badAlias = /rules_\d+\s+as\s+rules/.test(dts);
  if (badAlias) die("Found alias export 'rules_# as rules' – should be concrete value export");

  // Inside namespaces (configs.recommended/strict), ensure rules is exported as a value
  const nsAlias = /namespace\s+(recommended|strict)[\s\S]*?export\s*\{\s*rules_\d+\s+as\s+rules\s*\};/m.test(dts);
  if (nsAlias) die('Found alias export inside configs namespace');

  console.log('[verify-eslint-plugin-dts] OK');
}

main();



