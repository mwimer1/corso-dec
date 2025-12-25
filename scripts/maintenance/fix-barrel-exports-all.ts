#!/usr/bin/env tsx
/**
 * scripts/maintenance/fix-barrel-exports-all.ts
 * Scan actions/, components/, types/, styles/, and lib/* (excluding lib/api)
 * for incomplete barrels and append missing `export * from './x'` lines.
 * Skips server-only modules when writing client/edge barrels.
 * Flags:
 *   --check   : report missing, exit 1 if any
 *   --scope=X : limit to a top-level dir (e.g., components, actions, types, styles, lib)
 */
import { glob } from 'glob';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { detectBarrelMode, isInternalToPolicy, isServerOnlyModuleSync, validateBarrelFileSync } from '../utils/barrel-utils';

const CHECK = process.argv.includes('--check');
const scopeArg = process.argv.find(a => a.startsWith('--scope='));
const scope = scopeArg ? scopeArg.split('=')[1] : '';

const CANDIDATES = ['actions','components','types','styles','lib'];
const INCLUDED = scope ? CANDIDATES.filter((d) => d.startsWith(scope)) : CANDIDATES;

function isClientish(dir: string) {
  const n = dir.replace(/\\/g,'/'); // windows-safe
  return (
    n.includes('/components/') ||
    n.includes('/styles/') ||
    n.includes('/lib/shared') ||
    n.includes('/lib/monitoring') ||
    n.includes('/lib/api') // still filtered below
  );
}

async function resolveModulePath(dir: string, mod: string): Promise<string | ''> {
  const candidates = [
    path.join(dir, `${mod}.ts`),
    path.join(dir, `${mod}.tsx`),
    path.join(dir, mod, 'index.ts'),
    path.join(dir, mod, 'index.tsx'),
  ];
  for (const c of candidates) {
    try { await fs.access(c); return c; } catch {}
  }
  return '';
}

async function main() {
  const indexFiles = await glob(`{${INCLUDED.join(',')}}/**/index.{ts,tsx}`, {
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      'scripts/**',
      'tools/**',
      'eslint-plugin-corso/**',
      'hooks/**',
      'lib/api/**' // manual curation only
    ]
  });

  let touched = 0;
  for (const indexPath of indexFiles) {
    const dir = path.dirname(indexPath);
    const content = await fs.readFile(indexPath, 'utf8');
    const result = validateBarrelFileSync(indexPath, content);
    if (!result.hasMissingExports) continue;

    const additions: string[] = [];
    for (const mod of result.missingModules) {
      const resolved = await resolveModulePath(dir, mod);
      if (!resolved) continue;
      // Never write server-only modules into clientish barrels
      if (isClientish(dir) && isServerOnlyModuleSync(resolved)) continue;
      // Respect policy: skip internal modules
      if (isInternalToPolicy(dir, mod)) continue;

      // If this index is an aggregator, do not add leaf exports
      const mode = detectBarrelMode(indexPath);
      if (mode === 'aggregator') continue;

      additions.push(`export * from './${mod}';`);
    }
    if (!additions.length) continue;

    touched++;
    if (CHECK) {
      console.log(`[check] ${indexPath} missing -> ${additions.map(a => a.slice("export * from './".length, -3)).join(', ')}`);
      continue;
    }
    await fs.appendFile(indexPath, '\n' + additions.join('\n') + '\n');
    console.log(`✅ Fixed ${indexPath} → +${additions.length} exports`);
  }
  if (CHECK && touched > 0) process.exit(1);
}

main().catch((err) => {
  console.error('❌ fix-barrel-exports-all failed', err);
  process.exit(1);
});



