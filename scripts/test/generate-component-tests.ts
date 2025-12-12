// #!/usr/bin/env tsx

/**
 * Component Test Generator
 *
 * Generates non-destructive skeleton tests for components, mirroring
 * `components/**` into `tests/components/**` with `.gen.test.tsx` files.
 *
 * Rules:
 * - Skips files marked with `@no-test` in component source
 * - Won't overwrite manual tests; only refreshes files containing `// @generated`
 * - Flags:
 *   --dry-run   Show planned actions without writing
 *   --overwrite Refresh only @generated files
 *   --clean     Remove orphaned generated tests for deleted components
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import process from 'node:process';

const DRY_RUN = process.argv.includes('--dry-run');
const OVERWRITE = process.argv.includes('--overwrite');
const CLEAN = process.argv.includes('--clean');

const COMPONENTS_DIR = 'components';
const TESTS_ROOT = 'tests/components';

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function isTypeScriptReactFile(file: string): boolean {
  return file.endsWith('.tsx');
}

function* walk(dir: string): Generator<string> {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function hasNoTestMarker(source: string): boolean {
  return /@no-test/.test(source);
}

function buildTestPathFor(componentPath: string): string {
  const rel = relative(COMPONENTS_DIR, componentPath);
  const dir = dirname(rel);
  const fileBase = basename(rel).replace(/\.[^.]+$/, '');
  const testDir = join(TESTS_ROOT, dir);
  ensureDir(testDir);
  return join(testDir, `${fileBase}.gen.test.tsx`);
}

function buildTestSource(importPath: string, componentNameGuess: string): string {
  // Choose specialized factories for common categories
  const isIcon = /\/icon\//.test(importPath);
  const isForm = /\/(form|input|select)\//.test(importPath) || /forms\//.test(importPath);

  if (isIcon) {
    return [
      `// @generated - auto-generated skeleton test using shared factory. Remove this line to convert to manual test.`,
      `import * as Component from '${importPath}';`,
      `import { createIconComponentTests } from '@tests/support/test-factories/component-test-factory';`,
      '',
      `// Use shared test factory to eliminate duplication`,
      `createIconComponentTests('${componentNameGuess}', Component);`,
      '',
    ].join('\n');
  }

  if (isForm) {
    return [
      `// @generated - auto-generated skeleton test using shared factory. Remove this line to convert to manual test.`,
      `import * as Component from '${importPath}';`,
      `import { createFormComponentTests } from '@tests/support/test-factories/component-test-factory';`,
      '',
      `// Use specialized form test factory to eliminate duplication`,
      `createFormComponentTests('${componentNameGuess}', Component);`,
      '',
    ].join('\n');
  }

  return [
    `// @generated - auto-generated skeleton test using shared factory. Remove this line to convert to manual test.`,
    `import * as Component from '${importPath}';`,
    `import { createComponentTests } from '@tests/support/test-factories/component-test-factory';`,
    '',
    `// Use shared test factory to eliminate duplication`,
    `createComponentTests({`,
    `  componentName: '${componentNameGuess}',`,
    `  componentImport: Component,`,
    `  defaultProps: {},`,
    `});`,
    '',
  ].join('\n');
}

function main() {
  const actions: string[] = [];
  ensureDir(TESTS_ROOT);

  // Clean: remove orphaned generated tests that no longer have a source component
  if (CLEAN) {
    let cleaned = 0;
    const removeIfOrphan = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          removeIfOrphan(full);
          // remove empty dirs
          if (readdirSync(full).length === 0) {
            if (!DRY_RUN) rmSync(full, { recursive: true, force: true });
            actions.push(`removed empty dir: ${full}`);
          }
          continue;
        }
        if (!entry.endsWith('.gen.test.tsx')) continue;
        const rel = relative(TESTS_ROOT, full).replace(/\\/g, '/');
        const sourceRel = rel.replace(/\.gen\.test\.tsx$/, '.tsx');
        const sourcePath = join(COMPONENTS_DIR, sourceRel);
        if (!existsSync(sourcePath)) {
          cleaned++;
          if (!DRY_RUN) rmSync(full, { force: true });
          actions.push(`removed orphan: ${full}`);
        }
      }
    };
    removeIfOrphan(TESTS_ROOT);
    actions.push(`cleaned ${cleaned} orphaned generated tests`);
  }

  // Generate/refresh
  let generated = 0;
  let skipped = 0;
  for (const file of walk(COMPONENTS_DIR)) {
    if (!isTypeScriptReactFile(file)) continue;

    const src = readFileSync(file, 'utf8');
    if (hasNoTestMarker(src)) { skipped++; actions.push(`skip @no-test: ${file}`); continue; }

    const testPath = buildTestPathFor(file);
    const exists = existsSync(testPath);

    if (exists) {
      const current = readFileSync(testPath, 'utf8');
      const isGenerated = current.includes('// @generated');
      if (!OVERWRITE || !isGenerated) { skipped++; actions.push(`skip exists (manual or no overwrite): ${testPath}`); continue; }
    }

    // Guess import path via alias
    const rel = relative(process.cwd(), file).replace(/\\/g, '/');
    const importPath = `@/${rel.replace(/\.[^.]+$/, '')}`;
    const guessName = basename(file).replace(/\.[^.]+$/, '');
    const source = buildTestSource(importPath, guessName);

    if (DRY_RUN) {
      actions.push(`[dry-run] ${exists ? 'UPDATE' : 'CREATE'} ${testPath}`);
      continue;
    }

    ensureDir(dirname(testPath));
    writeFileSync(testPath, source, 'utf8');
    generated++;
    actions.push(`${exists ? 'updated' : 'created'}: ${testPath}`);
  }

  console.log(`Test generation complete. Generated: ${generated}, Skipped: ${skipped}`);
  for (const a of actions) console.log(' -', a);
}

main();

