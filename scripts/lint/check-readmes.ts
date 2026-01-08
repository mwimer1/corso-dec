#!/usr/bin/env tsx
/**
 * Validates that required directories have README.md files.
 * 
 * Checks that top-level route groups (e.g., (marketing)) and UI component directories
 * (atoms, molecules, organisms) have README.md files for documentation.
 * 
 * Intent: Ensure documentation exists for key directories
 * Files: README.md files in route groups and UI component directories
 * Invocation: pnpm docs:readmes:check
 */
import { globby } from 'globby';
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { createLintResult, isJsonOutput } from './_utils';

const STRICT = process.argv.includes('--strict');

async function exists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

async function main() {
  const result = createLintResult();
  const routeGroups = await globby(['app/*/'], { onlyDirectories: true });
  const missing: string[] = [];
  
  for (const dir of routeGroups) {
    const name = dir.split('/').pop()?.replace(/\/$/, '') || '';
    if (!name.startsWith('(')) continue; // only top-level route groups like (marketing)
    const readme = join(dir, 'README.md');
    if (!(await exists(readme))) missing.push(readme);
  }

  const uiTargets = [
    'components/ui/atoms',
    'components/ui/molecules',
    'components/ui/organisms',
    'styles/ui/atoms',
    'styles/ui/molecules',
    'styles/ui/organisms',
  ];

  for (const base of uiTargets) {
    const dirs = await globby([`${base}/*/`], { onlyDirectories: true });
    for (const d of dirs) {
      const readme = join(d, 'README.md');
      if (!(await exists(readme))) missing.push(readme);
    }
  }

  if (missing.length) {
    for (const m of missing) {
      result.addWarning(m);
    }
  }

  // Preserve original output format
  if (result.hasWarnings()) {
    console.log('README coverage warnings for:');
    for (const warning of result.getWarnings()) {
      console.log(' -', warning);
    }
    if (STRICT) process.exitCode = 1;
  } else {
    console.log('✅ README coverage looks good');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});




