#!/usr/bin/env tsx
/**
 * Check README freshness - validates that README files with frontmatter
 * have been updated within the last 30 days.
 */

import { globby } from 'globby';
import { readFileSync } from 'node:fs';

const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const readmes = await globby('**/README.md', { ignore: ['node_modules/**'] });
let staleCount = 0;

readmes.forEach(file => {
  try {
    const content = readFileSync(file, 'utf8');
    const lastUpdatedMatch = content.match(/last_updated:\s*['"]?(\d{4}-\d{2}-\d{2})['"]?/);
    if (lastUpdatedMatch && lastUpdatedMatch[1]) {
      const lastUpdated = new Date(lastUpdatedMatch[1]);
      if (lastUpdated < thirtyDaysAgo) {
        console.log(`⚠️  Stale README: ${file} (last updated: ${lastUpdatedMatch[1]})`);
        staleCount++;
      }
    }
  } catch (e) {
    // Skip files that can't be read
  }
});

if (staleCount > 0) {
  console.error(`\nFound ${staleCount} stale README files (>30 days old)`);
  process.exit(1);
} else {
  console.log('✅ All READMEs are fresh');
}

