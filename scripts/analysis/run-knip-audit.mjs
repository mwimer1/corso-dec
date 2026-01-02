#!/usr/bin/env node
/**
 * Run complete Knip audit and generate summary reports
 * 
 * Usage:
 *   node scripts/analysis/run-knip-audit.mjs
 * 
 * This script orchestrates the audit but delegates to shell commands
 * for proper stdout/stderr separation. On Windows, use PowerShell.
 */

import { execSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '../..');
const reportsDir = join(projectRoot, 'reports');

// Ensure reports directory exists
mkdirSync(reportsDir, { recursive: true });

console.log('🔍 Running Knip audit...\n');
console.log('⚠️  Note: This script provides commands. For proper stdout/stderr separation,');
console.log('   run these commands directly in your terminal:\n');
console.log('   mkdir -p reports');
console.log('   pnpm knip --reporter json 1> reports/knip.json 2> reports/knip.stderr.txt');
console.log('   pnpm knip 1> reports/knip.txt 2>&1');
console.log('   pnpm quality:exports:check 1> reports/quality-exports-check.txt 2>&1');
console.log('   node scripts/analysis/summarize-knip.mjs\n');

// Check if reports already exist
const knipJsonPath = join(reportsDir, 'knip.json');
if (existsSync(knipJsonPath)) {
  console.log('📄 Found existing reports/knip.json');
  console.log('   Generating summary from existing data...\n');
  
  try {
    // Validate JSON
    const jsonContent = readFileSync(knipJsonPath, 'utf8');
    JSON.parse(jsonContent);
    console.log('   ✅ JSON is valid');
    
    // Generate summary
    execSync('node scripts/analysis/summarize-knip.mjs', {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    
    console.log('\n✅ Summary generated from existing reports!');
    console.log('\n📄 Review:');
    console.log('   - reports/knip.summary.md');
    if (existsSync(join(projectRoot, 'reports', 'exports', 'unused-exports.summary.md'))) {
      console.log('   - reports/exports/unused-exports.summary.md');
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    console.error('\n   Please run the commands above to generate fresh reports.');
    process.exit(1);
  }
} else {
  console.log('❌ reports/knip.json not found.');
  console.log('\n   Please run these commands in your terminal:\n');
  console.log('   mkdir -p reports');
  console.log('   pnpm knip --reporter json 1> reports/knip.json 2> reports/knip.stderr.txt');
  console.log('   pnpm knip 1> reports/knip.txt 2>&1');
  console.log('   pnpm quality:exports:check 1> reports/quality-exports-check.txt 2>&1');
  console.log('   node scripts/analysis/summarize-knip.mjs');
  process.exit(1);
}
