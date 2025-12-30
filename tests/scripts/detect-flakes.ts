#!/usr/bin/env tsx
/**
 * @fileoverview Flake detection script
 * @description Re-runs the test suite N times to detect flaky tests
 * 
 * Usage:
 *   pnpm tsx tests/scripts/detect-flakes.ts [--runs=5] [--test-path=tests/api]
 * 
 * This script is for local debugging only. It does NOT run in CI by default.
 * 
 * Exit codes:
 *   0 - All runs passed
 *   1 - At least one run failed
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '../..');

interface RunResult {
  run: number;
  passed: boolean;
  duration: number;
  failures?: string[];
}

/**
 * Parse command line arguments
 */
function parseArgs(): { runs: number; testPath?: string } {
  const args = process.argv.slice(2);
  let runs = 5;
  let testPath: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--runs=')) {
      runs = Number.parseInt(arg.split('=')[1] || '5', 10);
    } else if (arg.startsWith('--test-path=')) {
      testPath = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Flake Detection Script

Usage:
  pnpm tsx tests/scripts/detect-flakes.ts [options]

Options:
  --runs=N          Number of times to run tests (default: 5)
  --test-path=PATH  Specific test path to run (default: all tests)
  --help, -h        Show this help message

Examples:
  pnpm tsx tests/scripts/detect-flakes.ts
  pnpm tsx tests/scripts/detect-flakes.ts --runs=10
  pnpm tsx tests/scripts/detect-flakes.ts --test-path=tests/api
      `);
      process.exit(0);
    }
  }

  return { runs, testPath };
}

/**
 * Run tests once and return result
 */
function runTestsOnce(runNumber: number, testPath?: string): RunResult {
  const startTime = Date.now();
  const testCommand = testPath 
    ? `pnpm test ${testPath}`
    : 'pnpm test';

  console.log(`\n🔄 Run ${runNumber}/${runs}...`);
  console.log(`   Command: ${testCommand}`);

  try {
    execSync(testCommand, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const duration = Date.now() - startTime;
    console.log(`   ✅ Passed (${duration}ms)`);

    return {
      run: runNumber,
      passed: true,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorOutput = error.stdout || error.stderr || error.message || '';
    
    // Extract failure information
    const failures: string[] = [];
    const failureMatches = errorOutput.match(/FAIL\s+[^\n]+/g);
    if (failureMatches) {
      failures.push(...failureMatches);
    }

    console.log(`   ❌ Failed (${duration}ms)`);
    if (failures.length > 0) {
      console.log(`   Failures: ${failures.slice(0, 3).join(', ')}${failures.length > 3 ? '...' : ''}`);
    }

    return {
      run: runNumber,
      passed: false,
      duration,
      failures,
    };
  }
}

/**
 * Main flake detection function
 */
function detectFlakes(): void {
  const { runs, testPath } = parseArgs();

  console.log('🔍 Flake Detection');
  console.log('─'.repeat(60));
  console.log(`Runs: ${runs}`);
  if (testPath) {
    console.log(`Test Path: ${testPath}`);
  }
  console.log('─'.repeat(60));

  const results: RunResult[] = [];

  for (let i = 1; i <= runs; i++) {
    const result = runTestsOnce(i, testPath);
    results.push(result);
  }

  // Summary
  console.log('\n📊 Summary');
  console.log('─'.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = Math.round(totalDuration / results.length);

  console.log(`Total Runs: ${runs}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Average Duration: ${avgDuration}ms`);

  if (failed > 0) {
    console.log('\n⚠️  Flaky Tests Detected!');
    console.log('─'.repeat(60));
    
    const failedRuns = results.filter(r => !r.passed);
    for (const result of failedRuns) {
      console.log(`\nRun ${result.run} failed:`);
      if (result.failures && result.failures.length > 0) {
        result.failures.slice(0, 5).forEach(failure => {
          console.log(`  - ${failure}`);
        });
      }
    }

    console.log('\n💡 Tips:');
    console.log('  - Review the failures above for patterns');
    console.log('  - Check for timing issues, race conditions, or external dependencies');
    console.log('  - Consider adding retries or fixing the root cause');
    console.log('  - Run with --test-path to isolate specific test files');

    process.exit(1);
  } else {
    console.log('\n✅ All runs passed! No flakes detected.');
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('detect-flakes')) {
  detectFlakes();
}

export { detectFlakes };
