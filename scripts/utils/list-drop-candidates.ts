#!/usr/bin/env tsx
/**
 * List files from orphan report that are actionable:
 * - REVIEW: needs manual triage (only referenced in docs/tests)
 * - DROP: safe to delete (no references)
 * 
 * REVIEW is shown first (triage queue), then DROP (delete candidates)
 */

import fs from 'fs';
import path from 'path';

const reportPath = path.join(process.cwd(), 'reports/orphan/orphan-report.json');

if (!fs.existsSync(reportPath)) {
  console.error('❌ Report not found. Run: pnpm audit:orphans');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

console.log('📊 Orphan Report Summary:');
console.log(`   Candidates: ${report.summary.candidates}`);
console.log(`   Kept: ${report.summary.kept}`);
if (report.summary.review !== undefined) {
  console.log(`   Review: ${report.summary.review}`);
}
console.log(`   Droppable: ${report.summary.droppable}\n`);

const reviewFiles = report.files.filter((f: any) => f.status === 'REVIEW');
const dropFiles = report.files.filter((f: any) => f.status === 'DROP');

// Show REVIEW first (triage queue)
if (reviewFiles.length > 0) {
  console.log(`\n🔍 REVIEW Files (${reviewFiles.length}) - Needs manual triage:`);
  console.log('   (Only referenced in docs/tests; verify before deleting)\n');
  reviewFiles.slice(0, 30).forEach((f: any) => {
    console.log(`   - ${f.path} (${f.reasons.join(', ')})`);
  });
  if (reviewFiles.length > 30) {
    console.log(`   ... and ${reviewFiles.length - 30} more`);
  }
  console.log('');
}

// Then show DROP (delete candidates)
if (dropFiles.length > 0) {
  console.log(`\n🗑️  DROP Files (${dropFiles.length}) - Safe to delete:\n`);
  dropFiles.forEach((f: any) => {
    console.log(`   ${f.path}`);
    if (f.notes) {
      console.log(`      Note: ${f.notes}`);
    }
  });
} else if (reviewFiles.length === 0) {
  console.log('✅ No actionable files in current report.\n');
  console.log('All files are either:');
  console.log('  - Referenced in code (KEEP)');
  console.log('  - Part of Next.js conventions (KEEP)');
  console.log('  - Have dynamic imports (KEEP)');
}

