#!/usr/bin/env node
/**
 * Summarize Knip JSON output into a human-readable markdown report
 * 
 * Usage:
 *   node scripts/analysis/summarize-knip.mjs
 * 
 * Reads: reports/knip.json
 * Writes: reports/knip.summary.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const knipJsonPath = path.join(projectRoot, 'reports', 'knip.json');
const summaryPath = path.join(projectRoot, 'reports', 'knip.summary.md');

if (!fs.existsSync(knipJsonPath)) {
  console.error(`❌ Knip JSON not found: ${knipJsonPath}`);
  console.error('   Run: pnpm knip --reporter json 1> reports/knip.json 2> reports/knip.stderr.txt');
  process.exit(1);
}

let data;
try {
  const content = fs.readFileSync(knipJsonPath, 'utf8');
  data = JSON.parse(content);
} catch (error) {
  console.error(`❌ Failed to parse Knip JSON: ${error.message}`);
  process.exit(1);
}

const unusedFiles = Array.isArray(data.files) ? data.files : [];
const issues = Array.isArray(data.issues) ? data.issues : [];

const categoryCounts = {};
const exportNameCounts = new Map();
const dirCounts = new Map();
const fileExports = new Map(); // file -> array of export names

for (const issue of issues) {
  const file = issue.file || '(unknown)';
  const dir = path.dirname(file);
  dirCounts.set(dir, (dirCounts.get(dir) || 0) + 1);

  const fileExportsList = [];

  for (const [k, v] of Object.entries(issue)) {
    if (k === 'file' || k === 'owners') continue;
    if (!Array.isArray(v)) continue;

    categoryCounts[k] = (categoryCounts[k] || 0) + v.length;

    if (k === 'exports') {
      for (const ex of v) {
        const name = ex?.name;
        if (!name) continue;
        exportNameCounts.set(name, (exportNameCounts.get(name) || 0) + 1);
        fileExportsList.push(name);
      }
    }
  }

  if (fileExportsList.length > 0) {
    fileExports.set(file, fileExportsList);
  }
}

const topDirs = [...dirCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
const topExports = [...exportNameCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
const topFiles = [...fileExports.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 20);

const lines = [];
lines.push('# Knip Summary');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push('');
lines.push('## Totals');
lines.push(`- Unused files: ${unusedFiles.length}`);
lines.push(`- Files with issues: ${issues.length}`);
lines.push('');

if (Object.keys(categoryCounts).length > 0) {
  lines.push('## Counts by category (array keys inside issues[])');
  for (const [k, n] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`- **${k}**: ${n}`);
  }
  lines.push('');
}

if (topDirs.length > 0) {
  lines.push('## Top directories by issue-file count');
  for (const [d, n] of topDirs) {
    lines.push(`- \`${d}\`: ${n} file(s)`);
  }
  lines.push('');
}

if (topExports.length > 0) {
  lines.push('## Top unused export names (most frequently unused)');
  for (const [name, n] of topExports) {
    lines.push(`- \`${name}\`: appears ${n} time(s)`);
  }
  lines.push('');
}

if (topFiles.length > 0) {
  lines.push('## Files with most unused exports');
  for (const [file, exports] of topFiles) {
    lines.push(`- \`${file}\`: ${exports.length} unused export(s)`);
    if (exports.length <= 10) {
      lines.push(`  - ${exports.map(e => `\`${e}\``).join(', ')}`);
    } else {
      lines.push(`  - ${exports.slice(0, 10).map(e => `\`${e}\``).join(', ')} ... and ${exports.length - 10} more`);
    }
  }
  lines.push('');
}

if (unusedFiles.length > 0) {
  lines.push(`## Unused files (${unusedFiles.length} total)`);
  for (const file of unusedFiles.slice(0, 30)) {
    lines.push(`- \`${file}\``);
  }
  if (unusedFiles.length > 30) {
    lines.push(`- ... and ${unusedFiles.length - 30} more`);
  }
  lines.push('');
}

fs.writeFileSync(summaryPath, lines.join('\n') + '\n');
console.log(`✅ Wrote summary to: ${summaryPath}`);
console.log(`   - ${issues.length} files with issues`);
console.log(`   - ${unusedFiles.length} unused files`);
console.log(`   - ${Object.keys(categoryCounts).length} issue categories`);
