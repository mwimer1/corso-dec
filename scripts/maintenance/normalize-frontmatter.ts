#!/usr/bin/env tsx
import { globby } from 'globby';
import { readFileSync, statSync, writeFileSync } from 'node:fs';

function hasFrontmatterAtTop(src: string): boolean {
  return src.startsWith('---');
}

function findFrontmatterEnd(src: string): number {
  // Return index of end delimiter inclusive, or -1
  const idx = src.indexOf('\n---', 3);
  return idx >= 0 ? idx + 4 : -1;
}

function normalizeYamlLines(lines: string[]): string[] {
  // Trim trailing spaces, collapse duplicate last_updated (keep first occurrence)
  const out: string[] = [];
  let seenLastUpdated = false;
  for (const line of lines) {
    const trimmed = line.replace(/^\s+/, '').replace(/\s+$/,'');
    if (/^last_updated:\s*/.test(trimmed)) {
      if (seenLastUpdated) continue;
      seenLastUpdated = true;
    }
    out.push(trimmed);
  }
  return out;
}

async function main(): Promise<void> {
  const files = await globby([
    'README.md',
    'docs/**/*.md',
    'actions/**/README.md',
    'app/**/README.md',
    'lib/**/README.md',
    'types/**/README.md',
    'hooks/**/README.md',
    'components/**/README.md',
    'contexts/**/README.md',
    'styles/**/README.md',
    'scripts/**/README.md',
    'tests/**/README.md',
    'tools/**/README.md',
    'supabase/**/README.md',
    'config/**/README.md',
    'public/**/README.md',
    'stories/**/README.md',
    'eslint-plugin-corso/**/README.md',
    '.husky/**/README.md',
    '.github/**/README.md',
    '.vscode/**/README.md',
    '.storybook/**/README.md',
    '.husky/**/README.md',
    '.cursor/**/README.md',
  ], { gitignore: true });

  let fixed = 0;
  let added = 0;
  let updated = 0;

  for (const file of files) {
    let src = readFileSync(file, 'utf8');

    if (hasFrontmatterAtTop(src)) {
      // Ensure no duplicate last_updated lines in FM, add if missing
      const end = findFrontmatterEnd(src);
      if (end === -1) continue;
      const fm = src.slice(0, end);
      const body = src.slice(end);
      const fmLines = fm.split('\n').slice(1, -1); // between --- ... ---
      const hasLast = fmLines.some(l => /^\s*last_updated:\s*\d{4}-\d{2}-\d{2}/.test(l));
      const normalized = normalizeYamlLines(fmLines);
      if (!hasLast) {
        const mtime = statSync(file).mtime.toISOString().slice(0, 10);
        normalized.push(`last_updated: ${mtime}`);
        updated++;
      }
      const rebuilt = ['---', ...normalized, '---'].join('\n');
      const out = rebuilt + body;
      if (out !== src) {
        writeFileSync(file, out);
      }
      continue;
    }

    // Not starting with '---'. Try to detect malformed FM in the first few lines.
    const lines = src.split('\n');
    const dashIdx = lines.findIndex((l, i) => i < 15 && /^---\s*$/.test(l));
    if (dashIdx > 0) {
      // Treat lines[0..dashIdx-1] as YAML k:v if they match, rebuild FM
      const yamlCandidates = lines.slice(0, dashIdx).filter(l => /\w[\w-]*\s*:\s*.+/.test(l));
      const fmLines = normalizeYamlLines(yamlCandidates);
      if (!fmLines.some(l => /^last_updated:\s*\d{4}-\d{2}-\d{2}/.test(l))) {
        const mtime = statSync(file).mtime.toISOString().slice(0, 10);
        fmLines.push(`last_updated: ${mtime}`);
      }
      const rebuilt = ['---', ...fmLines, '---', ''].join('\n');
      const rest = lines.slice(dashIdx + 1).join('\n');
      const out = rebuilt + rest;
      writeFileSync(file, out);
      fixed++;
      continue;
    }

    // No FM detected at top; inject minimal FM header
    const mtime = statSync(file).mtime.toISOString().slice(0, 10);
    const minimal = ['---', `last_updated: ${mtime}`, '---', '', ''].join('\n');
    writeFileSync(file, minimal + src);
    added++;
  }

  console.log(`Normalized frontmatter.`);
  console.log(`Fixed malformed: ${fixed}`);
  console.log(`Added minimal header: ${added}`);
  console.log(`Updated existing (added last_updated): ${updated}`);
}

void main().catch(err => {
  console.error('❌ Script failed:', (err as Error).message);
  process.exit(1);
});



