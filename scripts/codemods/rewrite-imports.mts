#!/usr/bin/env -S node --experimental-specifier-resolution=node
import fs from 'fs';
import path from 'path';
import { Project } from 'ts-morph';

function getDomainFromFile(filePath: string): string | null {
  const parts = filePath.split(path.sep);
  const idx = parts.lastIndexOf('lib');
  const next = parts[idx + 1];
  return idx >= 0 && typeof next === 'string' ? next : null;
}

function parseAlias(alias: string): { domain: string | null; tail: string } {
  let s = alias.replace(/^@\//, ''); // strip '@/'
  if (s.startsWith('lib/')) s = s.slice('lib/'.length);
  const [domain, ...rest] = s.split('/');
  return { domain: domain || null, tail: rest.join('/') };
}

function mapAuthTarget(tail: string): string {
  if (!tail || tail === 'server' || tail === 'client') return `@/lib/auth/${tail || ''}`.replace(/\/$/, '');
  if (tail.startsWith('client')) return '@/lib/auth/client';
  if (tail.startsWith('session') || tail.startsWith('jwt') || tail.startsWith('access') || tail.startsWith('server')) return '@/lib/auth/server';
  if (tail.startsWith('authorization')) return '@/lib/auth';
  return '@/lib/auth';
}

function mapBillingTarget(tail: string): string {
  return null;
}

function mapTarget(domain: string, tail: string): string | null {
  if (domain === 'auth') return mapAuthTarget(tail);
  if (domain === 'billing') return mapBillingTarget(tail);
  return null;
}

function shouldRewrite(currentDomain: string | null, importDomain: string | null, tail: string): boolean {
  if (!importDomain) return false;
  if (currentDomain === importDomain) return false; // only cross-domain
  // Allow barrels and entrypoints already
  if (!tail || tail === 'server' || tail === 'client') return false;
  return importDomain === 'auth';
}

async function main() {
  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
  });
  // Add non-tsconfig files if necessary (tsx included by tsconfig patterns)

  const sourceFiles = project.getSourceFiles().filter((sf) => {
    const fp = sf.getFilePath();
    return !fp.includes('node_modules') && !fp.includes('/.next/') && !fp.endsWith('.d.ts');
  });

  let changes = 0;
  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();
    const currentDomain = getDomainFromFile(filePath);
    const imports = sf.getImportDeclarations();
    let dirty = false;
    for (const imp of imports) {
      const spec = imp.getModuleSpecifierValue();
      if (!spec.startsWith('@/')) continue;
      const { domain: importDomain, tail } = parseAlias(spec);
      if (!shouldRewrite(currentDomain, importDomain, tail)) continue;
      const target = mapTarget(importDomain!, tail);
      if (!target || target === spec) continue;
      imp.setModuleSpecifier(target);
      dirty = true;
      changes++;
    }
    if (dirty) {
      // Remove unused named bindings if any will be caught by linter/tsc; we just save
      await sf.save();
    }
  }
  await project.save();
  // Also generate a simple report
  const out = { changedImports: changes };
  fs.mkdirSync('.agent/audits', { recursive: true });
  fs.writeFileSync('.agent/audits/codemod-rewrite-imports.json', JSON.stringify(out, null, 2));
  // Print a concise message
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
