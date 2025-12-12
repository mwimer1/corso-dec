#!/usr/bin/env tsx
/**
 * Categorize unused export warnings into:
 * 1. Public API exports (lib/api, lib/shared utilities)
 * 2. Dead code (never imported)
 * 3. Future use (documented but not yet used)
 * 4. Dynamic imports (used via dynamic imports)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

interface UnusedExport {
  file: string;
  line: number;
  export: string;
  category?: string;
}

const PUBLIC_API_PATTERNS = [
  /^lib\/api\//,
  /^lib\/shared\//,
  /^lib\/server\/env/,
  /^lib\/validators\//,
  /^types\//,
];

const DEAD_CODE_PATTERNS = [
  /^components\/landing\/hooks\//,
  /^components\/insights\/constants/,
  /^components\/ui\/atoms\/icon\/icons\//,
];

const FUTURE_USE_PATTERNS = [
  /^lib\/middleware\//,
  /^lib\/ratelimiting\//,
  /^lib\/security\//,
];

function categorizeExport(exportInfo: UnusedExport): string {
  const { file, export: exportName } = exportInfo;

  // Public API exports
  if (PUBLIC_API_PATTERNS.some(pattern => pattern.test(file))) {
    return 'PUBLIC_API';
  }

  // Dead code patterns
  if (DEAD_CODE_PATTERNS.some(pattern => pattern.test(file))) {
    return 'DEAD_CODE';
  }

  // Future use patterns
  if (FUTURE_USE_PATTERNS.some(pattern => pattern.test(file))) {
    return 'FUTURE_USE';
  }

  // Default exports in components (likely used dynamically)
  if (exportName === 'default' && file.includes('components/')) {
    return 'DYNAMIC_IMPORT';
  }

  // Type exports (usually public API)
  if (file.includes('types/') || exportName.match(/^[A-Z][a-zA-Z]*(Props|Config|Schema|Type)$/)) {
    return 'PUBLIC_API';
  }

  // Utility functions in lib (likely public API)
  if (file.startsWith('lib/') && !file.includes('/server/')) {
    return 'PUBLIC_API';
  }

  return 'UNKNOWN';
}

function parseLintOutput(output: string): UnusedExport[] {
  const lines = output.split('\n');
  const exports: UnusedExport[] = [];
  const cwd = process.cwd().replace(/\\/g, '/');

  for (const line of lines) {
    // Match Windows paths (C:\...) or Unix paths
    const match = line.match(/^([^:]+):(\d+):\d+\s+warning\s+exported declaration '([^']+)' not used/);
    if (match) {
      let file = match[1].replace(/\\/g, '/');
      // Convert absolute Windows path to relative
      if (file.startsWith(cwd)) {
        file = file.substring(cwd.length + 1);
      } else if (file.match(/^[A-Z]:/)) {
        // Windows absolute path - try to extract relative part
        const parts = file.split('/');
        const corsoIndex = parts.findIndex(p => p === 'corso-code');
        if (corsoIndex >= 0) {
          file = parts.slice(corsoIndex + 1).join('/');
        }
      }
      
      exports.push({
        file,
        line: parseInt(match[2], 10),
        export: match[3],
      });
    }
  }

  return exports;
}

function main() {
  console.log('🔍 Analyzing unused exports...\n');

  // Get lint output
  const lintOutput = execSync('pnpm exec eslint . 2>&1', { encoding: 'utf-8' });
  const exports = parseLintOutput(lintOutput);

  console.log(`Found ${exports.length} unused exports\n`);

  // Categorize
  const categorized = exports.map(exp => ({
    ...exp,
    category: categorizeExport(exp),
  }));

  // Group by category
  const byCategory: Record<string, UnusedExport[]> = {};
  for (const exp of categorized) {
    const cat = exp.category || 'UNKNOWN';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push(exp);
  }

  // Print summary
  console.log('📊 Categorization Summary:\n');
  for (const [category, items] of Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${category}: ${items.length} exports`);
  }

  // Generate detailed report
  const report: string[] = [];
  report.push('# Unused Exports Analysis\n');
  report.push(`Generated: ${new Date().toISOString()}\n`);
  report.push(`Total: ${exports.length} unused exports\n`);

  for (const [category, items] of Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)) {
    report.push(`\n## ${category} (${items.length})\n`);
    
    // Group by file
    const byFile: Record<string, UnusedExport[]> = {};
    for (const item of items) {
      if (!byFile[item.file]) {
        byFile[item.file] = [];
      }
      byFile[item.file].push(item);
    }

    for (const [file, fileExports] of Object.entries(byFile).sort()) {
      report.push(`\n### ${file}\n`);
      for (const exp of fileExports) {
        report.push(`- Line ${exp.line}: \`${exp.export}\``);
      }
    }
  }

  // Write report
  writeFileSync('unused-exports-analysis.md', report.join('\n'));
  console.log('\n✅ Report written to: unused-exports-analysis.md');

  // Generate ESLint allowlist suggestions
  const allowlistSuggestions: string[] = [];
  allowlistSuggestions.push('// Suggested allowlist entries for eslint.config.mjs');
  allowlistSuggestions.push('// Add to ignoreExports array in import/no-unused-modules rule\n');

  const publicApiFiles = new Set(
    byCategory['PUBLIC_API']?.map(e => e.file) || []
  );

  for (const file of Array.from(publicApiFiles).sort()) {
    allowlistSuggestions.push(`'${file}',`);
  }

  writeFileSync('eslint-allowlist-suggestions.txt', allowlistSuggestions.join('\n'));
  console.log('✅ Allowlist suggestions written to: eslint-allowlist-suggestions.txt');
}

main();
