/**
 * @fileoverview Tests to enforce lib boundary guards
 * @description Prevents regressions of server imports in edge/shared/actions modules
 *              that were fixed in Sprint 2-3 of lib structure cleanup.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const IGNORE = new Set(['node_modules', '.next', 'dist', 'coverage', 'public', '__test_lib_structure__']);
const isCode = (p: string) => /\.(ts|tsx|js|jsx)$/.test(p);
const SERVER_IMPORT_PATTERN = /from\s+['"]@\/lib\/server\//;

/**
 * Strip comments from source code to avoid false positives from import examples in comments
 */
function stripComments(src: string): string {
  // Remove single-line comments (// ...)
  let result = src.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments (/* ... */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  return result;
}

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    if (IGNORE.has(e)) continue;
    const full = join(dir, e);
    try {
      const st = statSync(full);
      if (st.isDirectory()) yield* walk(full);
      else if (isCode(full)) yield full;
    } catch {
      // Skip files/directories that don't exist or can't be accessed
      continue;
    }
  }
}

describe('lib boundary guards', () => {
  it('lib/middleware/edge/** must not import from @/lib/server/**', () => {
    const offenders: string[] = [];
    for (const file of walk(join(ROOT, 'lib/middleware/edge'))) {
      const src = stripComments(readFileSync(file, 'utf8'));
      if (SERVER_IMPORT_PATTERN.test(src)) {
        const rel = file.replace(ROOT, '').replace(/\\/g, '/');
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `lib/middleware/edge/** must not import from @/lib/server/**.\nViolations:\n${offenders.join('\n')}`
    ).toHaveLength(0);
  });

  it('lib/shared/** must not import from @/lib/server/**', () => {
    const offenders: string[] = [];
    for (const file of walk(join(ROOT, 'lib/shared'))) {
      const src = stripComments(readFileSync(file, 'utf8'));
      if (SERVER_IMPORT_PATTERN.test(src)) {
        const rel = file.replace(ROOT, '').replace(/\\/g, '/');
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `lib/shared/** must not import from @/lib/server/**.\nViolations:\n${offenders.join('\n')}`
    ).toHaveLength(0);
  });

  it('lib/actions/** must not import from @/lib/server/**', () => {
    const offenders: string[] = [];
    for (const file of walk(join(ROOT, 'lib/actions'))) {
      const src = stripComments(readFileSync(file, 'utf8'));
      if (SERVER_IMPORT_PATTERN.test(src)) {
        const rel = file.replace(ROOT, '').replace(/\\/g, '/');
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `lib/actions/** must not import from @/lib/server/**.\nViolations:\n${offenders.join('\n')}`
    ).toHaveLength(0);
  });
});

