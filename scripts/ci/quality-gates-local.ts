#!/usr/bin/env tsx
// scripts/quality-gates-local.ts
// Local simulation of critical CI checks for fast feedback.

import { execa } from 'execa';
import pLimit from 'p-limit';
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
    command: 'pnpm',
    args: ['exec', 'tsx', 'scripts/maintenance/check-readme-freshness.ts'],
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

async function runCheck(check: QualityCheck): Promise<{ status: 'passed' | 'failed'; duration: number }> {
  const startTime = Date.now();
  logger.info(`Running: ${check.name}...`);

  try {
    const result = await execa(check.command, check.args, {
      cwd: process.cwd(),
      preferLocal: true, // Find repo-local bins (pnpm, tsx, etc.)
      stdio: 'pipe', // Capture output for error reporting
      reject: false, // Don't throw on non-zero exit
    });

    const duration = Date.now() - startTime;

    if (result.exitCode === 0) {
      logger.info(`✅ Passed: ${check.name} (${duration}ms)`);
      return { status: 'passed', duration };
    } else {
      logger.error(`❌ Failed: ${check.name} (${duration}ms)`);
      if (result.stdout) {
        // Show last 50 lines of output for context
        const lines = result.stdout.split('\n');
        const relevant = lines.slice(-50).join('\n');
        console.error('STDOUT (last 50 lines):', relevant);
      }
      if (result.stderr) {
        // Show last 50 lines of stderr
        const lines = result.stderr.split('\n');
        const relevant = lines.slice(-50).join('\n');
        console.error('STDERR (last 50 lines):', relevant);
      }
      if (!result.stdout && !result.stderr) {
        console.error(`Command failed with exit code ${result.exitCode ?? 'unknown'}`);
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

async function main() {
  logger.info('Running Local Quality Gates (CI Simulation)...');
  const results: Array<QualityCheck & { status: 'passed' | 'failed'; duration: number }> = [];
  let failedRequiredChecks = 0;

  // Separate required and optional checks
  const requiredChecks = checks.filter(c => c.required);
  const optionalChecks = checks.filter(c => !c.required);

  // Run required checks sequentially (fail fast)
  logger.info(`Running ${requiredChecks.length} required check(s) sequentially...`);
  for (const check of requiredChecks) {
    const result = await runCheck(check);
    results.push({ ...check, ...result });
    if (result.status === 'failed') {
      failedRequiredChecks++;
      // Continue running to collect all failures, but we'll exit with error at end
    }
  }

  // Run optional checks in parallel (with concurrency limit)
  if (optionalChecks.length > 0) {
    logger.info(`Running ${optionalChecks.length} optional check(s) in parallel (max 4 concurrent)...`);
    const limit = pLimit(4); // Max 4 concurrent checks
    
    const optionalResults = await Promise.all(
      optionalChecks.map(check => 
        limit(async () => {
          const result = await runCheck(check);
          return { ...check, ...result };
        })
      )
    );
    
    results.push(...optionalResults);
  }

  logger.info('--- Quality Gates Summary ---');
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  logger.info(`Total time: ${totalDuration}ms`);

  if (failedRequiredChecks > 0) {
    logger.error(`🔥 ${failedRequiredChecks} required check(s) failed.`);
    process.exitCode = 1;
  } else {
    logger.info('✅ All required quality gates passed!');
  }
}

void main();

