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

/**
 * Comprehensive patterns to detect forbidden server imports:
 * 1. @/lib/server (exact) or @/lib/server/...
 * 2. Dynamic imports: import('@/lib/server...')
 * 3. Relative imports: ../server/, ../../server/, ../lib/server/
 * 4. Type-only imports: import type from '@/lib/server...'
 */
const SERVER_IMPORT_PATTERNS = [
  // Pattern 1: @/lib/server (exact) or @/lib/server/... in from statements (including import type)
  /(?:import\s+type\s+.*\s+from|from)\s+['"]@\/lib\/server(?:\/|['"])/,
  // Pattern 2: Dynamic imports: import('@/lib/server...') or import("@/lib/server...")
  /import\s*\(\s*['"]@\/lib\/server/,
  // Pattern 3: Relative imports to ../server/ or ../../server/ (conservative: require ../ or ../.. prefix)
  // Also handles import type
  /(?:import\s+type\s+.*\s+from|from)\s+['"](\.[.]\/)+server(?:\/|['"])/,
  // Pattern 4: Relative imports to ../lib/server/ or ../../lib/server/
  // Also handles import type
  /(?:import\s+type\s+.*\s+from|from)\s+['"](\.[.]\/)+lib\/server(?:\/|['"])/,
];

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

/**
 * Check if source code contains any forbidden server import patterns
 */
function hasServerImport(src: string): boolean {
  const cleaned = stripComments(src);
  return SERVER_IMPORT_PATTERNS.some((pattern) => pattern.test(cleaned));
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
  describe('regex pattern validation', () => {
    it('detects exact @/lib/server import', () => {
      const code = "import x from '@/lib/server';";
      expect(hasServerImport(code)).toBe(true);
    });

    it('detects @/lib/server/ with path', () => {
      const code = "import x from '@/lib/server/env';";
      expect(hasServerImport(code)).toBe(true);
    });

    it('detects @/lib/server/ with double quotes', () => {
      const code = 'import x from "@/lib/server";';
      expect(hasServerImport(code)).toBe(true);
    });

    it('detects dynamic import("@/lib/server/...")', () => {
      const code = "const mod = await import('@/lib/server/env');";
      expect(hasServerImport(code)).toBe(true);
    });

    it('detects relative import ../server/', () => {
      const code = "import x from '../server/env';";
      expect(hasServerImport(code)).toBe(true);
    });

    it('detects relative import ../../server/', () => {
      const code = "import x from '../../server/env';";
      expect(hasServerImport(code)).toBe(true);
    });

    it('detects relative import ../lib/server/', () => {
      const code = "import x from '../lib/server/env';";
      expect(hasServerImport(code)).toBe(true);
    });

    it('detects relative import ../../lib/server/', () => {
      const code = "import x from '../../lib/server/env';";
      expect(hasServerImport(code)).toBe(true);
    });

    it('does NOT detect imports in single-line comments', () => {
      const code = "// import x from '@/lib/server';";
      expect(hasServerImport(code)).toBe(false);
    });

    it('does NOT detect imports in multi-line comments', () => {
      const code = "/* import x from '@/lib/server'; */";
      expect(hasServerImport(code)).toBe(false);
    });

    it('does NOT detect unrelated imports', () => {
      const code = "import x from '@/lib/shared/utils';";
      expect(hasServerImport(code)).toBe(false);
    });

    it('does NOT detect server in other contexts', () => {
      const code = "const serverUrl = 'https://api.example.com';";
      expect(hasServerImport(code)).toBe(false);
    });

    it('does NOT detect @/lib/server-side (different path)', () => {
      const code = "import x from '@/lib/server-side/utils';";
      expect(hasServerImport(code)).toBe(false);
    });

    it('detects import type from @/lib/server', () => {
      const code = "import type { Env } from '@/lib/server';";
      expect(hasServerImport(code)).toBe(true);
    });

    it('detects import type from @/lib/server/env', () => {
      const code = "import type { Env } from '@/lib/server/env';";
      expect(hasServerImport(code)).toBe(true);
    });

    it('detects import type with relative path ../server/', () => {
      const code = "import type { Config } from '../server/config';";
      expect(hasServerImport(code)).toBe(true);
    });

    it('detects import type with relative path ../../lib/server/', () => {
      const code = "import type { Env } from '../../lib/server/env';";
      expect(hasServerImport(code)).toBe(true);
    });

    it('does NOT detect import type from unrelated paths', () => {
      const code = "import type { Config } from '@/lib/shared/config';";
      expect(hasServerImport(code)).toBe(false);
    });
  });

  it('lib/middleware/edge/** must not import from @/lib/server/**', () => {
    const offenders: string[] = [];
    for (const file of walk(join(ROOT, 'lib/middleware/edge'))) {
      const src = readFileSync(file, 'utf8');
      if (hasServerImport(src)) {
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
      const src = readFileSync(file, 'utf8');
      if (hasServerImport(src)) {
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
      const src = readFileSync(file, 'utf8');
      if (hasServerImport(src)) {
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
