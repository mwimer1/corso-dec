#!/usr/bin/env tsx
import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';
import { renderReadme, writeIfChanged, findReadmes } from '../../utils/docs-template-engine';

// NOTE: This generator is scripts-only.
// It intentionally uses the README.scripts template and must not run on non-scripts domains.
//
// IMPORTANT:
//   --all is intentionally *scripts-filtered* for now.
//   We still call findReadmes() to enumerate the repo, but we will only write to
//   scripts/**/README.md until domain-specific templates exist (e.g. README.components,
//   README.lib, README.types, etc.). This prevents accidental overwrites of manually
//   maintained READMEs outside scripts/.
//
// Usage:
//   pnpm docs:generate:readme
//   pnpm docs:generate:readme -- --dry-run
//   pnpm docs:generate:readme -- --all --dry-run
const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const ALL = ARGS.includes('--all');

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

function isScriptsReadme(file: string): boolean {
  const p = normalizePath(file);
  return p.startsWith('scripts/') && p.endsWith('/README.md');
}

/**
 * Extract JSDoc description from a TypeScript file
 * Looks for @fileoverview, @description, or first line of JSDoc comment
 */
function extractScriptDescription(content: string): string {
  // Try to match @fileoverview or @description
  const fileoverviewMatch = content.match(/\/\*\*[\s\S]*?@fileoverview\s+([^*]+?)(?:\*\/|@)/);
  if (fileoverviewMatch && fileoverviewMatch[1]) {
    return fileoverviewMatch[1].trim().split('\n')[0]?.replace(/\*/g, '').trim() ?? '';
  }

  const descriptionMatch = content.match(/\/\*\*[\s\S]*?@description\s+([^*]+?)(?:\*\/|@)/);
  if (descriptionMatch && descriptionMatch[1]) {
    return descriptionMatch[1].trim().split('\n')[0]?.replace(/\*/g, '').trim() ?? '';
  }

  // Fallback: extract first non-empty line from JSDoc comment
  const jsdocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
  if (jsdocMatch && jsdocMatch[1]) {
    const lines = jsdocMatch[1]
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line && !line.startsWith('@') && !line.startsWith('Usage:'));
    if (lines.length > 0 && lines[0]) {
      return lines[0];
    }
  }

  // Fallback: extract from single-line comment
  const singleLineMatch = content.match(/\/\/\s*(.+)/);
  if (singleLineMatch && singleLineMatch[1]) {
    return singleLineMatch[1].trim();
  }

  return '';
}

/**
 * Collect script metadata from a directory
 */
async function collectScripts(dir: string): Promise<Array<{ name: string; description: string }>> {
  // Use forward slashes for globby (works cross-platform)
  const pattern = dir.replace(/\\/g, '/') + '/*.ts';
  const scriptFiles = await globby(pattern, { gitignore: true });
  const scriptsData: Array<{ name: string; description: string }> = [];

  for (const filePath of scriptFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const description = extractScriptDescription(content);
      const name = path.basename(filePath);
      scriptsData.push({ name, description: description || 'No description available' });
    } catch (error) {
      // Skip files that can't be read
      console.warn(`⚠️  Could not read ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Sort by name for consistent output
  scriptsData.sort((a, b) => a.name.localeCompare(b.name));
  return scriptsData;
}

async function main() {
  // pick a single canonical template name: "README.scripts" => template file: README.scripts.hbs
  const template = 'README.scripts';

  // Example shared context — add per-domain data here (counts, exports, etc.)
  const baseCtx = {
    last_updated: new Date().toISOString().slice(0,10),
    project: 'Corso MVP',
  };

  // Default behavior: scripts-only. (--all still safely filters to scripts-only.)
  const patterns = ALL ? findReadmes() : ['scripts/**/README.md'];
  const allFiles = await globby(patterns, { gitignore: true });

  const files = allFiles.filter(isScriptsReadme);
  const skipped = allFiles.length - files.length;
  if (skipped > 0) {
    console.warn(
      `⚠️  Skipping ${skipped} non-scripts README(s). ` +
      `This generator is scripts-only (template: README.scripts).`
    );
  }

  // Files to skip (manually maintained, not auto-generated)
  const skipFiles = new Set([
    'README.md', // Root README - manually maintained, comprehensive project documentation
    'types/shared/README.md',
    'lib/shared/README.md', // Manually maintained
    'lib/shared/cache/README.md', // Prevent auto-generation
    'lib/shared/validation/README.md', // Prevent auto-generation (deleted, but prevent recreation)
  ]);

  let changed = 0;
  for (const file of files) {
    // Skip manually maintained READMEs
    const normalizedPath = normalizePath(file);
    if (skipFiles.has(normalizedPath)) {
      continue;
    }

    const dir = path.dirname(file);
    const ctx: Record<string, unknown> = { ...baseCtx, directory: dir.replace(/\\/g, '/') };

    const scripts = await collectScripts(dir);
    ctx['scripts'] = scripts;

    const out = renderReadme(template, ctx);

    if (DRY_RUN) {
      const existing = await fs.readFile(file, 'utf8');
      if (existing !== out) {
        console.log(`(dry-run) would update ${normalizedPath}`);
      }
      continue;
    }

    if (writeIfChanged(file, out)) changed++;
  }
  console.log(changed ? `✅ Updated ${changed} README(s)` : '✅ READMEs already up to date');
}
void main().catch(e => { console.error(e); process.exit(1); });

