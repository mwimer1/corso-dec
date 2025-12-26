#!/usr/bin/env tsx
/**
 * List files from orphan report that are marked as DROP
 * or have minimal keep reasons (potential candidates)
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
console.log(`   Droppable: ${report.summary.droppable}\n`);

const dropFiles = report.files.filter((f: any) => f.status === 'DROP');

if (dropFiles.length === 0) {
  console.log('✅ No files marked as DROP in current report.\n');
  console.log('Note: The "68 droppable" count you saw earlier may have been from:');
  console.log('  - A different run with different analysis');
  console.log('  - Files that are now marked as KEEP due to keep reasons');
  console.log('  - Files filtered out by high-signal script (tests/scripts/config)\n');
  
  // Show files with minimal keep reasons (potential candidates)
  const minimalKeep = report.files.filter((f: any) => 
    f.status === 'KEEP' && 
    f.reasons.length === 1 && 
    (f.reasons[0] === 'KEEP_DOCS_REF' || f.reasons[0] === 'KEEP_TEST_REF')
  );
  
  if (minimalKeep.length > 0) {
    console.log(`\n📋 Files with minimal keep reasons (${minimalKeep.length}):`);
    console.log('   (These might be review candidates)\n');
    minimalKeep.slice(0, 20).forEach((f: any) => {
      console.log(`   - ${f.path} (${f.reasons.join(', ')})`);
    });
    if (minimalKeep.length > 20) {
      console.log(`   ... and ${minimalKeep.length - 20} more`);
    }
  }
} else {
  console.log(`\n🗑️  DROP Files (${dropFiles.length}):\n`);
  dropFiles.forEach((f: any) => {
    console.log(`   ${f.path}`);
    if (f.notes) {
      console.log(`      Note: ${f.notes}`);
    }
  });
}

