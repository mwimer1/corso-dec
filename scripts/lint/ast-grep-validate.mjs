#!/usr/bin/env node
/**
 * Runs ast-grep with all rules under scripts/rules/ast-grep, explicitly excluding test-rule.yml,
 * captures JSON output to reports/ast-grep-report.json, and mirrors sg's exit code.
 * Windows-friendly: no bash globs.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const RULES_DIR = path.resolve('scripts/rules/ast-grep');
const REPORTS_DIR = path.resolve('reports');
const REPORT_PATH = path.join(REPORTS_DIR, 'ast-grep-report.json');

function listRuleFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listRuleFiles(p));
    else if (
      entry.isFile() &&
      (p.endsWith('.yml') || p.endsWith('.yaml')) &&
      !/[/\\]test-rule\.ya?ml$/.test(p)
    ) out.push(p);
  }
  return out;
}

if (!fs.existsSync(RULES_DIR)) {
  console.error(`ast-grep rules dir missing: ${RULES_DIR}`);
  process.exitCode = 1;
  // Allow script to continue and report the error
}
fs.mkdirSync(REPORTS_DIR, { recursive: true });

const rules = listRuleFiles(RULES_DIR);
if (rules.length === 0) {
  console.warn('No ast-grep rule files found.');
}

const args = ['scan', '--json', '--config', 'sgconfig.yml', '.'];

const res = spawnSync('sg', args, { encoding: 'utf8' });
if (res.error) {
  console.error('Failed to run ast-grep (sg):', res.error.message);
  process.exitCode = 1;
} else {
  try {
    fs.writeFileSync(REPORT_PATH, res.stdout || '{}', 'utf8');
    console.log(`ast-grep JSON saved → ${path.relative(process.cwd(), REPORT_PATH)}`);
  } catch (err) {
    console.error('Failed to write ast-grep report:', err.message);
    process.exitCode = 1;
  }
  
  if (res.status !== null && res.status !== 0) {
    process.exitCode = res.status;
  }
}


