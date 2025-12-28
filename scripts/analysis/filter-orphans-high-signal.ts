#!/usr/bin/env tsx
/**
 * Filter orphan report to show only high-signal candidates
 * Excludes tests, scripts, config files, and known framework conventions
 */

import fs from 'fs';
import path from 'path';

interface OrphanReport {
  summary: {
    candidates: number;
    kept: number;
    review?: number;
    droppable: number;
  };
  files: Array<{
    path: string;
    status: 'DROP' | 'KEEP' | 'REVIEW';
    reasons: string[];
    importers?: string[];
    exportRefs?: Array<{ export: string; refs: number }>;
    notes?: string;
  }>;
}

// Patterns to exclude (false positives / convention files)
const EXCLUDE_PATTERNS = [
  /^tests\//,                              // Test files
  /^scripts\//,                            // Script files (executed directly)
  /^public\//,                             // Public assets
  /^types\/.*\.d\.ts$/,                    // Type declaration files (module augmentation)
  /^next-env\.d\.ts$/,                     // Next.js generated types
  /^instrumentation(-client)?\.ts$/,       // Next.js instrumentation
  /tailwind\.config\./,                    // Tailwind config
  /postcss\.config\./,                     // PostCSS config
  /vitest\.config\./,                      // Vitest config
  /^config\/postcss\.config\.js$/,         // Root PostCSS config
  /mockServiceWorker\.js$/,                // MSW worker (URL referenced)
];

function isExcluded(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function main() {
  const reportPath = path.join(process.cwd(), 'reports/orphan/orphan-report.json');
  
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ Report not found: ${reportPath}`);
    console.error('   Run: pnpm audit:orphans first');
    process.exit(1);
  }

  const report: OrphanReport = JSON.parse(
    fs.readFileSync(reportPath, 'utf-8')
  );

  console.log('📊 Orphan Report Summary:');
  console.log(`   Candidates: ${report.summary.candidates}`);
  console.log(`   Kept: ${report.summary.kept}`);
  if (report.summary.review !== undefined) {
    console.log(`   Review: ${report.summary.review}`);
  }
  console.log(`   Droppable: ${report.summary.droppable}\n`);

  // High-signal = actionable buckets: REVIEW (needs triage) + DROP (safe to delete)
  // KEEP is not actionable, so we exclude it
  const actionableFiles = report.files.filter(f => 
    f.status === 'DROP' || f.status === 'REVIEW'
  );
  const highSignalFiles = actionableFiles.filter(f => !isExcluded(f.path));

  // Group by category
  const byCategory = {
    components: [] as string[],
    lib: [] as string[],
    config: [] as string[],
    other: [] as string[],
  };

  for (const file of highSignalFiles) {
    if (file.path.startsWith('components/')) {
      byCategory.components.push(file.path);
    } else if (file.path.startsWith('lib/')) {
      byCategory.lib.push(file.path);
    } else if (file.path.startsWith('config/')) {
      byCategory.config.push(file.path);
    } else {
      byCategory.other.push(file.path);
    }
  }

  console.log('🎯 High-Signal Orphan Candidates (excludes tests, scripts, config files):');
  console.log(`   Total: ${highSignalFiles.length}\n`);

  if (byCategory.components.length > 0) {
    console.log(`📦 Components (${byCategory.components.length}):`);
    byCategory.components.sort().forEach(p => console.log(`   - ${p}`));
    console.log('');
  }

  if (byCategory.lib.length > 0) {
    console.log(`📚 Lib (${byCategory.lib.length}):`);
    byCategory.lib.sort().forEach(p => console.log(`   - ${p}`));
    console.log('');
  }

  if (byCategory.config.length > 0) {
    console.log(`⚙️  Config (${byCategory.config.length}):`);
    byCategory.config.sort().forEach(p => console.log(`   - ${p}`));
    console.log('');
  }

  if (byCategory.other.length > 0) {
    console.log(`❓ Other (${byCategory.other.length}):`);
    byCategory.other.sort().forEach(p => console.log(`   - ${p}`));
    console.log('');
  }

  // Show excluded count for reference
  const excludedCount = actionableFiles.length - highSignalFiles.length;
  if (excludedCount > 0) {
    console.log(`\n⚠️  Excluded ${excludedCount} files (tests, scripts, config files, conventions)`);
  }
  
  // Show breakdown by status
  const reviewCount = highSignalFiles.filter(f => f.status === 'REVIEW').length;
  const dropCount = highSignalFiles.filter(f => f.status === 'DROP').length;
  if (reviewCount > 0 || dropCount > 0) {
    console.log(`\n📊 Breakdown:`);
    if (reviewCount > 0) {
      console.log(`   REVIEW (needs triage): ${reviewCount}`);
    }
    if (dropCount > 0) {
      console.log(`   DROP (safe to delete): ${dropCount}`);
    }
  }

  // Output paths-only list for piping
  if (process.argv.includes('--paths-only')) {
    highSignalFiles
      .map(f => f.path)
      .sort()
      .forEach(p => console.log(p));
  }
}

main();

