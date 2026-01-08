#!/usr/bin/env tsx
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readTextSync, writeTextSync } from '../utils/fs';

/**
 * Post-build fixer for eslint-plugin-corso d.ts
 *
 * Goal: eliminate namespace alias exports like `rules_1 as rules` inside
 * configs namespaces by converting them into concrete value declarations.
 *
 * Effectively transforms patterns like:
 *   let rules_1: { ... };
 *   export { rules_1 as rules };
 * into:
 *   export let rules: { ... };
 */

function main(): void {
  // Prefer local package dist when running from eslint-plugin-corso
  const local = join(process.cwd(), 'dist', 'index.d.ts');
  const fallback = join(process.cwd(), 'eslint-plugin-corso', 'dist', 'index.d.ts');
  const dtsPath = existsSync(local) ? local : fallback;
  let src: string;
  try {
    src = readTextSync(dtsPath);
  } catch (e) {
    console.error(`[fix-eslint-plugin-dts] Unable to read ${dtsPath}:`, (e as Error).message);
    process.exit(1);
    return;
  }

  // Replace alias exports inside namespaces with concrete value export
  const nsPattern = /let\s+rules_\d+\s*:\s*({[\s\S]*?});\s*export\s*\{\s*rules_\d+\s+as\s+rules\s*\};/g;
  let next = src.replace(nsPattern, (_m, group1: string) => `export let rules: ${group1};`);

  // Normalize top-level 'export declare let rules' to 'export let rules' for parity check
  next = next.replace(/export\s+declare\s+let\s+rules\s*:\s*({[\s\S]*?});/m, (_m, group1: string) => `export let rules: ${group1};`);

  if (next !== src) {
    writeTextSync(dtsPath, next);
    console.log('[fix-eslint-plugin-dts] Rewrote alias exports in dist/index.d.ts');
  } else {
    console.log('[fix-eslint-plugin-dts] No changes needed');
  }
}

main();



