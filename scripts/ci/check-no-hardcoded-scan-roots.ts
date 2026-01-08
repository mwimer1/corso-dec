#!/usr/bin/env tsx
/**
 * Guardrail: Prevent hardcoded scan-root directory lists in package.json scripts
 *
 * This script ensures that package.json scripts don't contain hardcoded directory
 * sequences like "app components lib" or "app components lib types styles".
 * Instead, scripts should use the centralized scan-roots.ts definitions via
 * TypeScript runner scripts.
 *
 * Usage:
 *   pnpm ci:check:no-hardcoded-scan-roots
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { SCAN_ROOTS } from '../maintenance/scan-roots.js';
import type { CheckResult } from './check-common.js';
import { printCheckResults, setExitFromResults } from '../utils/report-helpers.js';

type PackageJson = {
  scripts?: Record<string, string>;
};

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSequenceRegex(dirs: readonly string[]): RegExp {
  // Matches contiguous tokens: "app components lib" with any whitespace between.
  // Order matters (intentionally) to avoid false positives.
  const pattern = dirs.map((d) => `\\b${escapeRegExp(d)}\\b`).join('\\s+');
  return new RegExp(pattern);
}

async function checkNoHardcodedScanRoots(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const violations: string[] = [];

  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;

  const scripts = pkg.scripts ?? {};

  // Only forbid the presets we are actively centralizing out of package.json scripts.
  const forbiddenPresets = [
    { name: 'core', dirs: SCAN_ROOTS.core },
    { name: 'full', dirs: SCAN_ROOTS.full },
  ];

  const forbidden = forbiddenPresets.map((p) => ({
    preset: p.name,
    dirs: p.dirs,
    re: buildSequenceRegex(p.dirs),
  }));

  const offenders: Array<{ script: string; preset: string; cmd: string }> = [];

  for (const [scriptName, cmd] of Object.entries(scripts)) {
    for (const f of forbidden) {
      if (f.re.test(cmd)) {
        offenders.push({ script: scriptName, preset: f.preset, cmd });
      }
    }
  }

  if (offenders.length > 0) {
    for (const o of offenders) {
      violations.push(
        `Script "${o.script}" contains hardcoded scan-root sequence (matches preset "${o.preset}"):\n  ${o.cmd}`
      );
    }

    results.push({
      success: false,
      message: 'Hardcoded scan-root directory lists detected in package.json scripts',
      details: violations,
      recommendations: [
        'Use scripts/maintenance/* runner scripts that read scripts/maintenance/scan-roots.ts instead',
        'Replace hardcoded directory args with a runner invocation, e.g.',
        '  "tsx scripts/maintenance/run-validate-orphans.ts"',
      ],
    });
  } else {
    results.push({
      success: true,
      message: 'No hardcoded scan-root directory lists found in package.json scripts',
    });
  }

  return results;
}

async function main() {
  const results = await checkNoHardcodedScanRoots();

  printCheckResults(results, 'Hardcoded scan-roots check');
  setExitFromResults(results);
}

void main();
