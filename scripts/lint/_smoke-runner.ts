#!/usr/bin/env tsx
/**
 * Smoke test runner for migrated lint scripts
 * Runs the pilot scripts and reports pass/fail status
 * 
 * Usage:
 *   tsx scripts/lint/_smoke-runner.ts
 */

import { execa } from 'execa';
import { logger } from './_utils';

interface ScriptResult {
  name: string;
  passed: boolean;
  duration: number;
  error: string | undefined;
}

interface ScriptConfig {
  name: string;
  args?: string[];
  expectExitCode?: number; // Some scripts exit with non-zero when violations found (expected behavior)
}

const PILOT_SCRIPTS: ScriptConfig[] = [
  { name: 'check-filename-case.ts', args: ['package.json'], expectExitCode: 0 }, // Test with a valid file
  { name: 'check-filenames.ts', expectExitCode: 1 }, // Expected to find violations (non-zero is OK)
  { name: 'check-forbidden-files.ts', expectExitCode: 0 },
  { name: 'check-runtime-versions.ts', expectExitCode: 0 },
  { name: 'check-package-scripts.ts', expectExitCode: 0 },
] as const;

async function runScript(config: ScriptConfig): Promise<ScriptResult> {
  const startTime = Date.now();
  const scriptPath = `scripts/lint/${config.name}`;
  const args = config.args || [];
  
  try {
    const result = await execa('tsx', [scriptPath, ...args], {
      cwd: process.cwd(),
      preferLocal: true,
      stdio: 'pipe',
      reject: false,
    });
    
    const duration = Date.now() - startTime;
    // Consider it passed if exit code matches expected (or is 0 if no expectation)
    const expectedExit = config.expectExitCode ?? 0;
    const passed = result.exitCode === expectedExit;
    
    const error: string | undefined = passed ? undefined : `Exit code ${result.exitCode} (expected ${expectedExit})`;
    return {
      name: config.name,
      passed,
      duration,
      error,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name: config.name,
      passed: false,
      duration,
      error: errorMessage,
    };
  }
}

async function main() {
  logger.info('Running smoke tests for migrated lint scripts...\n');
  
  const results: ScriptResult[] = [];
  
  for (const config of PILOT_SCRIPTS) {
    logger.info(`Running ${config.name}...`);
    const result = await runScript(config);
    results.push(result);
    
    if (result.passed) {
      logger.success(`✅ ${config.name} passed (${result.duration}ms)`);
    } else {
      logger.error(`❌ ${config.name} failed (${result.duration}ms)`);
      if (result.error) {
        logger.error(`   Error: ${result.error.split('\n')[0]}`);
      }
    }
  }
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log('\n--- Summary ---');
  console.log(`Total: ${results.length} scripts`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total duration: ${totalDuration}ms`);
  
  if (failed > 0) {
    console.log('\nFailed scripts:');
    for (const result of results) {
      if (!result.passed) {
        console.log(`  - ${result.name}`);
      }
    }
    process.exitCode = 1;
  } else {
    logger.success('\n✅ All pilot scripts passed!');
  }
}

void main();
