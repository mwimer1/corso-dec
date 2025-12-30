#!/usr/bin/env tsx
import { globby } from 'globby';
import fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import path from 'node:path';
import { renderReadme, writeIfChanged, findReadmes } from '../../utils/docs-template-engine';

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

  const patterns = findReadmes();
  const files = await globby(patterns, { gitignore: true });

  // Files to skip (manually maintained, not auto-generated)
  const skipFiles = new Set([
    'types/shared/README.md',
  ]);

  let changed = 0;
  for (const file of files) {
    // Skip manually maintained READMEs
    const normalizedPath = file.replace(/\\/g, '/');
    if (skipFiles.has(normalizedPath)) {
      continue;
    }

    const dir = path.dirname(file);
    const ctx: Record<string, unknown> = { ...baseCtx, directory: dir.replace(/\\/g, '/') };

    // For script directories, collect script metadata
    if (dir.includes('scripts')) {
      const scripts = await collectScripts(dir);
      if (scripts.length > 0) {
        ctx['scripts'] = scripts;
      }
    }

    const out = renderReadme(template, ctx);
    // Force write for script directories to ensure scripts list appears
    if (dir.includes('scripts')) {
      fsSync.writeFileSync(file, out, 'utf8');
      changed++;
    } else if (writeIfChanged(file, out)) {
      changed++;
    }
  }
  console.log(changed ? `✅ Updated ${changed} README(s)` : '✅ READMEs already up to date');
}
void main().catch(e => { console.error(e); process.exit(1); });

