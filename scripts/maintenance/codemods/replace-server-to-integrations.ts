#!/usr/bin/env tsx
import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'path';

// Only rewrite these “real” integrations. Everything else stays under lib/server/**
const INTEGRATION_WHITELIST = new Set([
  'clickhouse',
  'openai',
  'redis',
  'supabase',
]);

function rewriteImportPath(spec: string): string {
  const m = spec.match(/^@\/lib\/server\/([^/]+)(\/.*)?$/);
  if (!m) return spec;
  const svc: string = m[1] || '';
  if (!INTEGRATION_WHITELIST.has(svc)) return spec; // do not touch core server paths
  return spec.replace('@/lib/server/', '@/lib/integrations/');
}

async function main() {
  const files = await fg(['**/*.{ts,tsx}'], {
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/reports/**'],
  });

  const importRegex = /(["'])@\/lib\/server\/([a-zA-Z0-9_\/\-.]+)\1/g;

  let changed = 0;
  for (const f of files) {
    const abs = path.resolve(f);
    let src = await fs.readFile(abs, 'utf8');
    const replaced = src.replace(importRegex, (_full: string, quote: string, specRest: string): string => {
      const rest: string = specRest || '';
      const spec: string = `@/lib/server/${rest}`;
      const rewritten: string = rewriteImportPath(spec);
      return `${quote}${rewritten}${quote}`;
    });
    if (replaced !== src) {
      await fs.writeFile(abs, replaced, { encoding: 'utf8' });
      changed++;
      console.log(`patched: ${f}`);
    }
  }

  console.log(`done. files changed: ${changed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});



