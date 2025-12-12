#!/usr/bin/env node
/**
 * Align client logger imports:
 *   From: import { logger } from '...'
 *   To:   import { clientLogger as logger } from '@/lib/shared'
 *
 * Scope:
 *   - Only runs on .tsx files that contain a top-of-file 'use client' directive.
 *   - Auto-fixes simple imports where logger is the only named import (or aliased).
 *   - Logs MANUAL for complex multi-specifier imports including logger.
 *
 * Usage:
 *   node scripts/codemods/align-client-logger.mjs          (dry-run)
 *   node scripts/codemods/align-client-logger.mjs --write  (apply changes)
 *   node scripts/codemods/align-client-logger.mjs --write --include components,app
 */
import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const idx = process.argv.indexOf('--include');
const INCLUDE_DIRS = idx > -1 && process.argv[idx + 1]
  ? process.argv[idx + 1].split(',').map(s => s.trim()).filter(Boolean)
  : ['components', 'app', 'hooks'];

const IGNORES = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', 'out', 'coverage',
  'storybook-static', '.turbo', '.cache'
]);

/** Recursively gather .tsx files under INCLUDE_DIRS */
function listFiles(root) {
  const out = [];
  function walk(dir, depth = 0) {
    // Hard cap recursion depth for safety
    if (depth > 40) return;
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (IGNORES.has(e.name)) continue;
        // If include filter is set at top, allow anything inside included roots
        walk(p, depth + 1);
      } else if (e.isFile() && e.name.endsWith('.tsx')) {
        out.push(p);
      }
    }
  }
  for (const d of INCLUDE_DIRS) {
    const abs = path.join(root, d);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      walk(abs, 0);
    }
  }
  return out;
}

function isClientFile(src) {
  // Read the first 512 chars to detect top-of-file 'use client' (with optional semicolon)
  const head = src.slice(0, 512);
  return /(^|\n)\s*['"]use client['"]\s*;?/.test(head);
}

const IMPORT_RE = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*;?/g;

function processFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  if (!isClientFile(src)) return { changed: false };

  let changed = false;
  let manual = false;
  let updated = src;
  let m;

  // We iterate matches on the ORIGINAL src to keep indexes stable; replacements act on 'updated'
  while ((m = IMPORT_RE.exec(src)) !== null) {
    const full = m[0];
    const spec = m[1];     // e.g. "logger, Button" OR "logger as log"
    const source = m[2];   // e.g. "@/components"

    // Normalize specifiers and look for "logger" or "logger as X"
    const parts = spec.split(',').map(s => s.trim()).filter(Boolean);
    const loggerIdx = parts.findIndex(p => /^logger(\s+as\s+\w+)?$/.test(p));
    if (loggerIdx === -1) continue;

    // Already good? (clientLogger imported from '@/lib/shared')
    if (source === '@/lib/shared' && /^clientLogger(\s+as\s+\w+)?$/.test(parts[loggerIdx])) {
      continue;
    }

    // If multiple specifiers exist, we avoid auto-edit to keep other imports intact.
    if (parts.length > 1) {
      manual = true;
      console.log(`[MANUAL] ${filePath}: complex import { ${spec} } from '${source}'`);
      continue;
    }

    // Determine alias name
    const aliasMatch = parts[loggerIdx].match(/^logger\s+as\s+(\w+)$/);
    const alias = aliasMatch ? aliasMatch[1] : 'logger';

    const replacement = `import { clientLogger as ${alias} } from '@/lib/shared';`;
    updated = updated.replace(full, replacement);
    changed = true;
  }

  if (changed && WRITE) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }
  return { changed, manual };
}

function main() {
  const root = process.cwd();
  const files = listFiles(root);

  let changed = 0;
  let manual = 0;
  let scanned = 0;

  for (const f of files) {
    const res = processFile(f);
    scanned++;
    if (res.manual) manual++;
    if (res.changed) {
      changed++;
      console.log(`[FIX] ${f}`);
    }
  }

  console.log(`\nScanned: ${scanned} file(s).`);
  console.log(`Changed: ${changed} file(s).`);
  if (!WRITE) console.log('Dry run only. Re-run with --write to apply changes.');
  if (manual > 0) {
    console.log(`Manual review needed in ${manual} file(s) (complex import with logger).`);
  }
}

main();


