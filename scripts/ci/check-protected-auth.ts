#!/usr/bin/env tsx
import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function hasAuthCall(file: string): Promise<boolean> {
  try {
    const src = await fs.readFile(file, 'utf8');
    if (/['"]use client['"]/.test(src)) return true; // client files are exempt
    return /\bauth\s*\(/.test(src);
  } catch {
    return false;
  }
}

async function nearestProtectedLayoutHasAuth(startDir: string): Promise<boolean> {
  let dir = startDir;
  while (true) {
    const layout = path.join(dir, 'layout.tsx');
    try {
      await fs.access(layout);
      if (await hasAuthCall(layout)) return true;
    } catch {}
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
    if (!dir.includes(path.sep + '(protected)')) break;
  }
  return false;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const root = path.join('app', '(protected)');
  const files = await globby(['**/*.tsx'], { cwd: root, absolute: true });

  const offenders: string[] = [];
  for (const file of files) {
    const src = await fs.readFile(file, 'utf8');
    if (/['"]use client['"]/.test(src)) continue; // skip client components

    const isServerPageOrLayout = /\bexport\s+default\s+function\s+/.test(src) || /\bexport\s+const\s+runtime\b/.test(src) || /\bgenerateMetadata\b/.test(src);
    if (!isServerPageOrLayout) continue;

    const hasOwnAuth = /\bauth\s*\(/.test(src);
    if (hasOwnAuth) continue;

    const dir = path.dirname(file);
    const parentHasAuth = await nearestProtectedLayoutHasAuth(dir);
    if (!parentHasAuth) offenders.push(file);
  }

  if (offenders.length) {
    console.error('Protected server components missing auth():');
    for (const f of offenders) console.error(' -', path.relative(process.cwd(), f));
    process.exit(1);
  }
  console.log('✅ All protected server components are guarded by auth() directly or via parent layout');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});




