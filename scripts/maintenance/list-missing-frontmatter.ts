#!/usr/bin/env tsx
import { globby } from 'globby';
import { readFileSync } from 'node:fs';

async function main(): Promise<void> {
  const patterns = [
    // Primary docs
    'README.md',
    'docs/**/*.md',

    // App and product code areas
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

    // Repo meta
    '.github/**/README.md',
    '.vscode/**/README.md',
    '.storybook/**/README.md',
    '.husky/**/README.md',
    '.cursor/**/README.md',
  ];

  const files = await globby(patterns, { gitignore: true });

  const missingFrontmatter: string[] = [];
  const hasFrontmatterMissingLastUpdated: string[] = [];
  let withFrontmatter = 0;

  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    if (!src.startsWith('---')) {
      missingFrontmatter.push(file);
      continue;
    }
    withFrontmatter++;
    if (!/\nlast_updated:\s*\d{4}-\d{2}-\d{2}/.test(src)) {
      hasFrontmatterMissingLastUpdated.push(file);
    }
  }

  console.log(`Matched README files: ${files.length}`);
  console.log(`With frontmatter: ${withFrontmatter}`);
  console.log(`Missing frontmatter: ${missingFrontmatter.length}`);
  console.log(`With frontmatter but missing last_updated: ${hasFrontmatterMissingLastUpdated.length}`);

  if (missingFrontmatter.length) {
    console.log('\n=== Missing frontmatter ===');
    missingFrontmatter.sort().forEach(f => console.log(f));
  }

  if (hasFrontmatterMissingLastUpdated.length) {
    console.log('\n=== Frontmatter present but missing last_updated ===');
    hasFrontmatterMissingLastUpdated.sort().forEach(f => console.log(f));
  }
}

void main().catch((err) => {
  console.error('❌ Script failed:', (err as Error).message);
  process.exit(1);
});



