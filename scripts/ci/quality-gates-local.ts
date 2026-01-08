#!/usr/bin/env tsx
// scripts/quality-gates-local.ts
// Local simulation of critical CI checks for fast feedback.

import { spawnSync } from 'node:child_process';
import { logger } from '../utils/logger';

interface QualityCheck {
  name: string;
  command: string;
  args: string[];
  required: boolean;
  description: string;
}

const checks: QualityCheck[] = [
  {
    name: 'Environment Validation',
    command: 'pnpm',
    args: ['validate:env'],
    required: true,
    description: 'Checks for missing environment variables.',
  },
  {
    name: 'TypeScript Compilation',
    command: 'pnpm',
    args: ['typecheck'],
    required: true,
    description: 'Validates TypeScript types and compilation.',
  },
  {
    name: 'Code Linting',
    command: 'pnpm',
    args: ['lint'],
    required: true,
    description: 'Checks code quality and security patterns.',
  },
  {
    name: 'Code Duplication Check',
    command: 'pnpm',
    args: ['exec', 'jscpd', '--config', 'jscpd.config.json'],
    required: true,
    description: 'Enforces code duplication thresholds per directory (scripts: 10%, tests: 20%, others: 2%).',
  },
  {
    name: 'README Freshness Check',
    command: 'node',
    args: ['-e', `
      const fs = require('fs');
      const path = require('path');
      const glob = require('glob');

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const readmes = glob.sync('**/README.md', { ignore: 'node_modules/**' });
      let staleCount = 0;

      readmes.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const lastUpdatedMatch = content.match(/last_updated:\\s*['"]?(\\d{4}-\\d{2}-\\d{2})['"]?/);
        if (lastUpdatedMatch) {
          const lastUpdated = new Date(lastUpdatedMatch[1]);
          if (lastUpdated < thirtyDaysAgo) {
            console.log('⚠️  Stale README:', file, 'last updated:', lastUpdatedMatch[1]);
            staleCount++;
          }
        }
      });

      if (staleCount > 0) {
        console.error('Found', staleCount, 'stale README files (>30 days old)');
        process.exit(1);
      } else {
        console.log('✅ All READMEs are fresh');
      }
    `],
    required: false,
    description: 'Checks for READMEs older than 30 days.',
  },
  {
    name: 'Security Tests (AI)',
    command: 'pnpm',
    args: ['test:security'],
    required: true,
    description: 'Validates security tests (fallback suite).',
  },
  {
    name: 'Bundle Size Check',
    command: 'pnpm',
    args: ['bundlesize'],
    required: false,
    description: 'Validates bundle size is under the limit.',
  },
  {
    name: 'Markdown Linting',
    command: 'pnpm',
    args: ['exec', 'markdownlint', 'docs/**/*.md', 'README.md', '--config', '.markdownlint.jsonc'],
    required: false,
    description: 'Checks markdown formatting and consistency.',
  },
];

function runCheck(check: QualityCheck): { status: 'passed' | 'failed'; duration: number } {
  const startTime = Date.now();
  logger.info(`Running: ${check.name}...`);

  try {
    const result = spawnSync(check.command, check.args, {
      stdio: 'pipe',
      encoding: 'utf8'
    });

    const duration = Date.now() - startTime;

    if (result.status === 0) {
      logger.info(`✅ Passed: ${check.name} (${duration}ms)`);
      return { status: 'passed', duration };
    } else {
      logger.error(`❌ Failed: ${check.name} (${duration}ms)`);
      if (result.stderr) {
        console.error(result.stderr);
      }
      return { status: 'failed', duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Failed: ${check.name} (${duration}ms)`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return { status: 'failed', duration };
  }
}

function main() {
  logger.info('Running Local Quality Gates (CI Simulation)...');
  const results = [];
  let failedRequiredChecks = 0;

  for (const check of checks) {
    const result = runCheck(check);
    results.push({ ...check, ...result });
    if (result.status === 'failed' && check.required) {
      failedRequiredChecks++;
    }
  }

  logger.info('--- Quality Gates Summary ---');
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  logger.info(`Total time: ${totalDuration}ms`);

  if (failedRequiredChecks > 0) {
    logger.error(`🔥 ${failedRequiredChecks} required check(s) failed.`);
    process.exit(1);
  } else {
    logger.info('✅ All required quality gates passed!');
  }
}

void main();

