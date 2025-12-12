#!/usr/bin/env tsx
import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';

const STRICT = process.argv.includes('--strict');

async function exists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

async function main() {
  const routeGroups = await globby(['app/*/'], { onlyDirectories: true });
  const missing: string[] = [];
  for (const dir of routeGroups) {
    const name = path.basename(dir.slice(0, -1));
    if (!name.startsWith('(')) continue; // only top-level route groups like (marketing)
    const readme = path.join(dir, 'README.md');
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
      const readme = path.join(d, 'README.md');
      if (!(await exists(readme))) missing.push(readme);
    }
  }

  if (missing.length) {
    console.log('README coverage warnings for:');
    for (const m of missing) console.log(' -', m);
    if (STRICT) process.exit(1);
  } else {
    console.log('✅ README coverage looks good');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});




