#!/usr/bin/env tsx
import { globby } from 'globby';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function deriveTitle(file: string, content: string): string {
  // Prefer existing H1 as title
  const h1 = content.match(/^#\s+(.+)/m);
  if (h1 && h1[1]) return h1[1].trim();
  // Fallback to file name without extension
  const base = path.basename(file).replace(/\.(md|markdown)$/i, '');
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function deriveCategory(file: string): string {
  const top = file.split(/[\\/]/)[0];
  switch (top) {
    case 'app': return 'App-Routes';
    case 'lib': return 'Library';
    case 'types': return 'Types';
    case 'hooks': return 'Hooks';
    case 'components': return 'Components';
    case 'contexts': return 'Contexts';
    case 'styles': return 'Styles';
    case 'scripts': return 'Scripts';
    case 'tests': return 'Tests';
    case 'tools': return 'Tools';
    case 'supabase': return 'Database';
    case 'config': return 'Config';
    case 'public': return 'Public';
    case 'stories': return 'Stories';
    case 'docs': return 'docs';
    default: return 'documentation';
  }
}

function buildFrontmatter(file: string, content: string): string {
  const title = deriveTitle(file, content);
  const description = `Auto-generated frontmatter for ${path.normalize(file)}`;
  const lastUpdated = statSync(file).mtime.toISOString().slice(0, 10);
  const category = deriveCategory(file);
  return `---\n` +
         `title: ${JSON.stringify(title)}\n` +
         `description: ${JSON.stringify(description)}\n` +
         `last_updated: ${lastUpdated}\n` +
         `category: ${JSON.stringify(category)}\n` +
         `---\n`;
}

async function main(): Promise<void> {
  const patterns = [
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
    '.github/**/*.md',
    '.vscode/**/README.md',
    '.husky/**/README.md',
    '.cursor/**/README.md',
  ];

  const files = await globby(patterns, { gitignore: true });

  let injected = 0;
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    if (src.startsWith('---')) {
      // Already has frontmatter. Ensure last_updated exists; if not, inject it before closing ---.
      // Find the closing frontmatter delimiter.
      const endIdx = src.indexOf('\n---', 3);
      if (endIdx === -1) { skipped++; continue; }
      const fmBlock = src.slice(0, endIdx + 4);
      if (/\nlast_updated:\s*\d{4}-\d{2}-\d{2}/.test(fmBlock)) {
        skipped++; // No change needed
        continue;
      }
      const mtime = statSync(file).mtime.toISOString().slice(0, 10);
      const augmented = fmBlock.replace(/---\s*$/m, `last_updated: ${mtime}\n---`);
      const out = augmented + src.slice(endIdx + 4);
      writeFileSync(file, out);
      updated++;
    } else {
      // No frontmatter; prepend standard block
      const fm = buildFrontmatter(file, src);
      writeFileSync(file, fm + '\n' + src);
      injected++;
    }
  }

  console.log(`Processed files: ${files.length}`);
  console.log(`Injected frontmatter: ${injected}`);
  console.log(`Updated existing frontmatter (added last_updated): ${updated}`);
  console.log(`Skipped (already had last_updated): ${skipped}`);
}

void main().catch((err) => {
  console.error('❌ Script failed:', (err as Error).message);
  process.exit(1);
});



