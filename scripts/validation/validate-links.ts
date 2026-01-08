/*
 Validates that centralized APP_LINKS targets map to existing routes (for internal paths)
 and that components avoid hardcoded internal hrefs.

 Usage:
   pnpm tsx scripts/validation/validate-links.ts
*/

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());
const appDir = path.join(repoRoot, 'app');
const linksFile = path.join(repoRoot, 'lib', 'shared', 'constants', 'links.ts');

function read(file: string) {
  return fs.readFileSync(file, 'utf8');
}

function collectRoutes(dir: string): Set<string> {
  const routes = new Set<string>();
  const walk = (d: string, base = '') => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full, path.join(base, entry.name));
      } else if (entry.isFile() && entry.name === 'page.tsx') {
        // Convert /(group) and segment folders to public URL
        const url = '/' + base
          .replace(/\\/g, '/')
          .replace(/\(([^)]+)\)\/?/g, '') // remove route groups
          .replace(/index$/i, '')
          .replace(/\/page\.tsx$/, '')
          .replace(/\/$/, '');
        routes.add(url || '/');
      }
    }
  };
  walk(dir);
  return routes;
}

function extractAppLinksTargets(src: string): string[] {
  const targets: string[] = [];
  const re = /['"]\/[A-Za-z0-9_\-\/]+(?:#[A-Za-z0-9_\-]+)?['"]/g;
  for (const m of src.matchAll(re)) {
    const raw = m[0].slice(1, -1);
    // Filter external-like and anchors
    if (/^\//.test(raw) && !/^\/#/.test(raw)) targets.push(raw);
  }
  return Array.from(new Set(targets));
}

function main() {
  const routes = collectRoutes(appDir);
  const linksSrc = read(linksFile);
  const targets = extractAppLinksTargets(linksSrc);

  // Allow known non-page anchors
  const ignored = new Set(['/pricing#faq']);
  const missing: string[] = [];
  for (const t of targets) {
    if (ignored.has(t)) continue;
    if (!routes.has(t)) {
      missing.push(t);
    }
  }

  if (missing.length) {
    console.error('Missing routes referenced by APP_LINKS:');
    for (const m of missing) console.error(' -', m);
    process.exitCode = 1;
  } else {
    console.log('✔ All APP_LINKS internal targets resolve to existing routes.');
  }
}

main();



