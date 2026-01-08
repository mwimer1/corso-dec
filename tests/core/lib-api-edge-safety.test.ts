/**
 * @fileoverview Tests to enforce edge-safety of lib/api helpers
 * @description Prevents server-only code from leaking into edge-intended API utilities
 *              that must remain compatible with Edge runtime.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const isCode = (p: string) => /\.(ts|tsx|js|jsx)$/.test(p);

/**
 * Edge-safe files in lib/api that must not contain server-only imports
 */
const EDGE_SAFE_API_FILES = [
  'lib/api/index.ts',
  'lib/api/edge.ts',
  'lib/api/data.ts', // Optional, but included as edge-safe
];

const EDGE_SAFE_API_DIRS = [
  'lib/api/response',
  'lib/api/shared',
];

/**
 * Patterns to detect forbidden server-only imports in edge-safe code:
 * 1. @/lib/server imports (barrel and subpaths)
 * 2. import 'server-only' directive
 * 3. Node.js builtin imports (node:fs, node:path, etc.)
 */
const SERVER_ONLY_PATTERNS = [
  // Pattern 1: @/lib/server imports (exact or subpaths)
  /from\s+['"]@\/lib\/server(?:\/|['"])/,
  /import\s*\(\s*['"]@\/lib\/server/,
  // Pattern 2: import 'server-only' directive
  /import\s+['"]server-only['"]/,
  // Pattern 3: Node.js builtin imports
  /from\s+['"]node:/,
  /import\s+['"]node:/,
  /import\s*\(\s*['"]node:/,
  // Pattern 4: Relative imports to server (belt-and-suspenders)
  /from\s+['"](\.[.]\/)+server(?:\/|['"])/,
  /from\s+['"](\.[.]\/)+lib\/server(?:\/|['"])/,
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
 * Check if source code contains any forbidden server-only patterns
 */
function hasServerOnlyImport(src: string): boolean {
  const cleaned = stripComments(src);
  return SERVER_ONLY_PATTERNS.some((pattern) => pattern.test(cleaned));
}

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
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

describe('lib/api edge-safety guards', () => {
  describe('regex pattern validation', () => {
    it('detects @/lib/server import', () => {
      const code = "import x from '@/lib/server';";
      expect(hasServerOnlyImport(code)).toBe(true);
    });

    it('detects @/lib/server/ subpath import', () => {
      const code = "import x from '@/lib/server/env';";
      expect(hasServerOnlyImport(code)).toBe(true);
    });

    it('detects import "server-only" directive', () => {
      const code = "import 'server-only';";
      expect(hasServerOnlyImport(code)).toBe(true);
    });

    it('detects Node.js builtin import', () => {
      const code = "import fs from 'node:fs';";
      expect(hasServerOnlyImport(code)).toBe(true);
    });

    it('detects Node.js builtin from import', () => {
      const code = "import { readFile } from 'node:fs';";
      expect(hasServerOnlyImport(code)).toBe(true);
    });

    it('detects relative import to server', () => {
      const code = "import x from '../server/env';";
      expect(hasServerOnlyImport(code)).toBe(true);
    });

    it('does NOT detect imports in comments', () => {
      const code = "// import x from '@/lib/server';";
      expect(hasServerOnlyImport(code)).toBe(false);
    });

    it('does NOT detect unrelated imports', () => {
      const code = "import x from '@/lib/shared/utils';";
      expect(hasServerOnlyImport(code)).toBe(false);
    });

    it('does NOT detect edge-safe patterns', () => {
      const code = "import { http } from './response/http';";
      expect(hasServerOnlyImport(code)).toBe(false);
    });
  });

  describe('edge-safe API files', () => {
    for (const filePath of EDGE_SAFE_API_FILES) {
      it(`${filePath} must not import server-only code`, () => {
        const fullPath = join(ROOT, filePath);
        try {
          const src = readFileSync(fullPath, 'utf8');
          expect(
            hasServerOnlyImport(src),
            `${filePath} contains forbidden server-only imports. Edge-safe API files must not import from @/lib/server, 'server-only', or Node.js builtins.`
          ).toBe(false);
        } catch (error) {
          // File doesn't exist, skip test
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return;
          }
          throw error;
        }
      });
    }
  });

  describe('edge-safe API directories', () => {
    for (const dirPath of EDGE_SAFE_API_DIRS) {
      it(`${dirPath}/** must not import server-only code`, () => {
        const fullDir = join(ROOT, dirPath);
        const offenders: string[] = [];

        try {
          for (const file of walk(fullDir)) {
            const src = readFileSync(file, 'utf8');
            if (hasServerOnlyImport(src)) {
              const rel = file.replace(ROOT, '').replace(/\\/g, '/');
              offenders.push(rel);
            }
          }
        } catch (error) {
          // Directory doesn't exist, skip test
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return;
          }
          throw error;
        }

        expect(
          offenders,
          `${dirPath}/** contains files with forbidden server-only imports.\nViolations:\n${offenders.join('\n')}\n\nEdge-safe API files must not import from @/lib/server, 'server-only', or Node.js builtins.`
        ).toHaveLength(0);
      });
    }
  });
});

