#!/usr/bin/env node
/**
 * Workflow Consistency Report Generator
 * 
 * Analyzes GitHub Actions workflows for pnpm setup consistency.
 * Checks that all jobs use the standardized composite action or reusable workflow
 * for Node.js/pnpm setup, rather than direct pnpm/action-setup usage.
 * 
 * Generates two output files:
 * - reports/ci/workflows-consistency.report.json (detailed JSON data)
 * - reports/ci/workflows-consistency.summary.md (markdown summary table)
 * 
 * Exit behavior:
 * Sets process.exitCode = 1 on violations so CI fails after report generation completes.
 * This allows reports to be written fully before the process exits, preventing truncated
 * output. The process will exit with code 1 once the event loop drains.
 * 
 * @usage pnpm lint:workflows:pnpm
 * @output reports/ci/workflows-consistency.report.json
 * @output reports/ci/workflows-consistency.summary.md
 */

import { globbySync } from 'globby';
import fs from 'node:fs';
import path from 'node:path';

const files = globbySync('.github/workflows/*.{yml,yaml}', { expandDirectories: false });
const rows = [];
const offenders = [];

for (const filePath of files) {
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split('\n');

  let inJobs = false;
  const jobs = [];
  let currentJobName = null;
  let currentStart = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^jobs:\s*$/.test(lines[i])) inJobs = true;
    if (!inJobs) continue;
    const match = lines[i].match(/^ {2}([A-Za-z0-9_\-]+):\s*$/);
    if (match) {
      if (currentJobName) jobs.push({ name: currentJobName, start: currentStart, end: i - 1 });
      currentJobName = match[1];
      currentStart = i;
    }
  }
  if (currentJobName) jobs.push({ name: currentJobName, start: currentStart, end: lines.length - 1 });

  const sliceJob = (j) => lines.slice(j.start, j.end + 1);

  for (const j of jobs) {
    const jl = sliceJob(j);
    const text = jl.join('\n');
    const usesComposite = /uses:\s*\.\/\.github\/actions\/setup-node-pnpm\b/.test(text);
    const usesWorkflowCall = /uses:\s*\.\/\.github\/workflows\/_reusable-node-job\.yml\b/.test(text);
    const usesDirectPnpmAction = /uses:\s*pnpm\/action-setup@/i.test(text);

    let pnpmVersion = '';
    if (usesComposite) {
      const idx = jl.findIndex(l => /uses:\s*\.\/\.github\/actions\/setup-node-pnpm\b/.test(l));
      for (let k = idx; k < Math.min(idx + 12, jl.length); k++) {
        const pm = jl[k].match(/pnpm-version:\s*["']?([0-9][^"']*)/);
        if (pm) { pnpmVersion = pm[1]; break; }
      }
    }

    let firstPnpmIdx = -1;
    let firstPnpmName = '';
    for (let i = 0; i < jl.length; i++) {
      const nameMatch = jl[i].match(/^\s*-+\s*name:\s*(.+)$/);
      if (nameMatch) {
        for (let k = i; k < Math.min(i + 5, jl.length); k++) {
          if (/^\s*run:\s*/.test(jl[k]) && /(^|\s)pnpm(\s|$)/.test(jl[k] + (jl[k + 1] || ''))) {
            firstPnpmIdx = i; firstPnpmName = (nameMatch[1] || '').trim();
            break;
          }
        }
      }
      if (firstPnpmIdx >= 0) break;
    }
    if (firstPnpmIdx < 0) {
      for (let i = 0; i < jl.length; i++) {
        if (/^\s*run:\s*/.test(jl[i]) && /(^|\s)pnpm(\s|$)/.test(jl[i] + (jl[i + 1] || ''))) {
          firstPnpmIdx = i; firstPnpmName = '(unnamed run)';
          break;
        }
      }
    }

    let setupBefore = true;
    if (firstPnpmIdx >= 0) {
      if (usesWorkflowCall) {
        // When using workflow_call, the setup is done in the called workflow, so it's effectively before any pnpm commands
        setupBefore = true;
      } else {
        let setupIdx = -1;
        for (let i = 0; i < jl.length; i++) {
          if (/uses:\s*\.\/\.github\/actions\/setup-node-pnpm\b/.test(jl[i])) { setupIdx = i; break; }
        }
        if (setupIdx < 0 || setupIdx > firstPnpmIdx) setupBefore = false;
      }
    }

    const usesValidSetup = usesComposite || usesWorkflowCall;
    const issues = [];
    if (firstPnpmIdx >= 0 && !usesValidSetup) issues.push('not using composite setup or reusable workflow');
    if (firstPnpmIdx >= 0 && !setupBefore) issues.push('pnpm before setup');
    if (pnpmVersion) issues.push(`forbidden pnpm-version input detected: ${pnpmVersion}`);
    if (usesDirectPnpmAction) issues.push('forbidden pnpm/action-setup usage');

    const row = {
      workflow: path.basename(filePath),
      job: j.name,
      usesComposite,
      usesWorkflowCall,
      usesValidSetup,
      pnpmVersion,
      firstPnpmStep: firstPnpmIdx >= 0 ? firstPnpmName : '',
      setupBeforePnpm: setupBefore,
      issues,
    };
    rows.push(row);
    if (issues.length) offenders.push(row);
  }
}

const out = { rows, offenders, generatedAt: new Date().toISOString() };
fs.mkdirSync('reports/ci', { recursive: true });
fs.writeFileSync('reports/ci/workflows-consistency.report.json', JSON.stringify(out, null, 2));

const md = [
  '## Workflow Consistency Report',
  '',
  offenders.length ? `**Status:** ❌ ${offenders.length} offender(s)` : '**Status:** ✅ All good',
  '',
  '| workflow | job | composite | workflowCall | validSetup | pnpmVersion | firstPnpmStep | setupBeforePnpm | issues |',
  '|---|---|---:|---:|---:|---:|---|---:|---|',
  ...rows.map(r => `| ${r.workflow} | ${r.job} | ${r.usesComposite} | ${r.usesWorkflowCall} | ${r.usesValidSetup} | ${r.pnpmVersion || ''} | ${r.firstPnpmStep || ''} | ${r.setupBeforePnpm} | ${(r.issues || []).join(', ')} |`),
].join('\n');
fs.writeFileSync('reports/ci/workflows-consistency.summary.md', md);

if (offenders.length) process.exitCode = 1;


