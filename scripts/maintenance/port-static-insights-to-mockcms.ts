// scripts/maintenance/port-static-insights-to-mockcms.ts
// One-time script to port existing staticInsights to mock CMS JSON fixtures

import { CATEGORIES, staticInsights } from '@/lib/marketing/insights/static-data';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const MOCKCMS_ROOT = join(process.cwd(), 'public', '__mockcms__');
const INSIGHTS_DIR = join(MOCKCMS_ROOT, 'insights');
const CATEGORIES_DIR = join(MOCKCMS_ROOT, 'categories');

async function portInsights() {
  // Create directories
  await mkdir(INSIGHTS_DIR, { recursive: true });
  await mkdir(CATEGORIES_DIR, { recursive: true });

  // Port individual insight files
  const previews: Array<{
    id: string;
    slug: string;
    title: string;
    description?: string;
    publishDate?: string;
    updatedDate?: string;
    imageUrl?: string;
    categories?: Array<{ slug: string; name: string }>;
    readingTime?: number;
    author?: { name: string; avatar?: string };
  }> = [];

  for (const insight of staticInsights) {
    // Write individual insight file
    const filePath = join(INSIGHTS_DIR, `${insight.slug}.json`);
    await writeFile(filePath, JSON.stringify(insight, null, 2), 'utf-8');
    console.log(`✓ Wrote ${insight.slug}.json`);

    // Build preview (without content field)
    const { content: _, ...preview } = insight;
    previews.push(preview);
  }

  // Write index.json (previews only)
  const indexPath = join(INSIGHTS_DIR, 'index.json');
  await writeFile(indexPath, JSON.stringify(previews, null, 2), 'utf-8');
  console.log(`✓ Wrote insights/index.json (${previews.length} previews)`);

  // Write categories index
  const categoriesPath = join(CATEGORIES_DIR, 'index.json');
  await writeFile(categoriesPath, JSON.stringify(CATEGORIES, null, 2), 'utf-8');
  console.log(`✓ Wrote categories/index.json (${CATEGORIES.length} categories)`);

  // Write metadata file
  const metaPath = join(MOCKCMS_ROOT, '_meta.json');
  const meta = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    cmsProvider: 'directus',
    notes: 'Mock CMS fixtures for demos - ported from staticInsights',
  };
  await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`✓ Wrote _meta.json`);

  console.log(`\n✅ Successfully ported ${staticInsights.length} insights to mock CMS fixtures`);
}

portInsights().catch((error) => {
  console.error('Failed to port insights:', error);
  process.exit(1);
});

