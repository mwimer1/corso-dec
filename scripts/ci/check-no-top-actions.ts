#!/usr/bin/env tsx
/**
 * Guardrail: Prevent reintroduction of top-level actions/ directory
 *
 * This script ensures that no top-level `actions/` directory exists.
 * Server Actions should be feature-colocated (e.g., `app/(marketing)/contact/actions.ts`).
 * The `lib/actions/` directory is allowed (shared helper utilities).
 *
 * Usage:
 *   pnpm guards:no-top-actions
 *
 * Environment variable:
 *   CORSO_ENFORCE_NO_TOP_ACTIONS=0 - Disable strict enforcement (for testing only)
 *   Default: Strict enforcement (fails CI/build if top-level actions/ exists)
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CheckResult } from './check-common.js';
import { printCheckResults, setExitFromResults } from '../utils/report-helpers';

const TOP_LEVEL_ACTIONS_DIR = 'actions';
// Strict enforcement enabled by default after PR5.2 (actions/ directory removed)
// Can be disabled for testing by setting CORSO_ENFORCE_NO_TOP_ACTIONS=0
const ENFORCE_ENV_VAR = 'CORSO_ENFORCE_NO_TOP_ACTIONS';
const ENFORCE_STRICT = process.env[ENFORCE_ENV_VAR] !== '0';

async function checkNoTopActions(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const violations: string[] = [];
  const warnings: string[] = [];

  const actionsPath = join(process.cwd(), TOP_LEVEL_ACTIONS_DIR);
  const exists = existsSync(actionsPath);

  if (exists) {
    const message = `Top-level ${TOP_LEVEL_ACTIONS_DIR}/ directory exists.\n` +
      `  Server Actions should be feature-colocated (e.g., app/(marketing)/contact/actions.ts).\n` +
      `  Shared helpers belong in lib/actions/ (this is allowed).\n` +
      `  Remove ${TOP_LEVEL_ACTIONS_DIR}/ and colocate actions with their features.`;

    // Strict enforcement enabled by default after PR5.2
    violations.push(message);
  }

  if (violations.length > 0) {
    results.push({
      success: false,
      message: 'Top-level actions/ directory check failed:',
      details: violations,
      recommendations: [
        `Move Server Actions to feature-colocated locations (e.g., app/(marketing)/contact/actions.ts)`,
        `Keep shared utilities in lib/actions/ (this is allowed)`,
        `Remove the top-level ${TOP_LEVEL_ACTIONS_DIR}/ directory`,
      ],
    });
  } else if (warnings.length > 0) {
    results.push({
      success: true,
      message: 'Top-level actions/ directory check passed (warning mode)',
      warnings,
    });
  } else {
    results.push({
      success: true,
      message: 'Top-level actions/ directory check passed',
    });
  }

  return results;
}

async function main() {
  const results = await checkNoTopActions();
  
  printCheckResults(results, 'Top-level actions/ directory check');
  setExitFromResults(results);
}

void main();

