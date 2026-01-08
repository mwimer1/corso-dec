#!/usr/bin/env tsx
/**
 * scripts/docs/refresh-last-updated.ts
 * Updates the 'last_updated' field in README frontmatter based on file modification times
 */

import { globby } from 'globby';
import fs from 'node:fs/promises';

async function updateLastUpdatedField(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf8');

    // Check if file has frontmatter
    if (!content.startsWith('---')) {
      return false;
    }

    // Find frontmatter end
    const endIdx = content.indexOf('\n---', 3);
    if (endIdx === -1) {
      return false;
    }

    // Get file modification time
    const stats = await fs.stat(filePath);
    const lastUpdated = stats.mtime.toISOString().slice(0, 10);

    // Extract frontmatter
    const frontmatter = content.slice(0, endIdx + 4);
    const body = content.slice(endIdx + 4);

    // Check if last_updated already exists and is current
    if (frontmatter.includes(`last_updated: ${lastUpdated}`)) {
      return false; // Already up to date
    }

    // Remove any existing last_updated line
    const lines = frontmatter.split('\n');
    const filteredLines = lines.filter(line => !line.startsWith('last_updated:'));

    // Add new last_updated line before closing ---
    const insertIdx = filteredLines.length - 1; // Before the closing ---
    filteredLines.splice(insertIdx, 0, `last_updated: ${lastUpdated}`);

    const newFrontmatter = filteredLines.join('\n');
    const newContent = newFrontmatter + body;

    await fs.writeFile(filePath, newContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

async function main() {
  const changedOnly = process.argv.includes('--changed');

  // Find all README files
  const readmeFiles = await globby([
    '**/README.md',
    'docs/**/*.md',
    '!node_modules/**',
    '!.next/**',
    '!dist/**',
    '!coverage/**'
  ]);

  console.log(`Found ${readmeFiles.length} README files`);

  let updated = 0;
  let skipped = 0;

  for (const file of readmeFiles) {
    const wasUpdated = await updateLastUpdatedField(file);
    if (wasUpdated) {
      console.log(`✅ Updated: ${file}`);
      updated++;
    } else {
      if (!changedOnly) {
        console.log(`⏭️  Skipped: ${file} (no changes needed)`);
      }
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${readmeFiles.length}`);
  console.log(`   Files updated: ${updated}`);
  console.log(`   Files skipped: ${skipped}`);

  if (updated > 0) {
    console.log('\n✅ Last updated fields refreshed successfully!');
  } else {
    console.log('\n⏭️  All files were already up to date.');
  }
}

void main().catch((err) => {
  console.error('❌ Script failed:', (err as Error).message);
  process.exit(1);
});

