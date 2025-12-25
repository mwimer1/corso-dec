#!/usr/bin/env tsx
/**
 * Unified Barrel Audit
 * 
 * Runs all barrel-related validation checks:
 * 1. Constants barrel integrity (Vitest test)
 * 2. Barrel policy (server-only re-exports)
 * 3. Intradomain root barrel imports (cycle prevention)
 * 
 * Usage:
 *   pnpm audit:barrels              # Run all checks
 *   pnpm audit:barrels --only policy # Run only policy check
 */

import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;

// Check for help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Unified Barrel Audit

Runs all barrel-related validation checks:
1. Constants barrel integrity (Vitest test)
2. Barrel policy (server-only re-exports in client-imported barrels)
3. Intradomain root barrel imports (prevents cycles)

Usage:
  pnpm audit:barrels [options]

Options:
  --only <check>           Run only specific check: constants, policy, or intradomain
  --help, -h               Show this help message

Examples:
  pnpm audit:barrels                    # Run all checks
  pnpm audit:barrels --only policy      # Run only policy check
  pnpm audit:barrels --only constants   # Run only constants test
  pnpm audit:barrels --only intradomain # Run only intradomain check
`);
  process.exit(0);
}

type CheckResult = {
  name: string;
  passed: boolean;
  error?: string;
};

async function runConstantsCheck(): Promise<CheckResult> {
  try {
    console.log('🔍 Running constants barrel integrity check...');
    execSync('pnpm vitest run tests/core/constants-barrel.node.test.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    return { name: 'Constants Barrel', passed: true };
  } catch (error: any) {
    return {
      name: 'Constants Barrel',
      passed: false,
      error: error?.message ?? String(error),
    };
  }
}

async function runPolicyCheck(): Promise<CheckResult> {
  try {
    console.log('🔍 Running barrel policy check...');
    execSync('pnpm tsx scripts/maintenance/barrels/policy-check.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    return { name: 'Barrel Policy', passed: true };
  } catch (error: any) {
    return {
      name: 'Barrel Policy',
      passed: false,
      error: error?.message ?? String(error),
    };
  }
}

async function runIntradomainCheck(): Promise<CheckResult> {
  try {
    console.log('🔍 Running intradomain root barrel check...');
    execSync('pnpm tsx scripts/maintenance/check-barrels.ts --intradomain-only', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    return { name: 'Intradomain Root Barrels', passed: true };
  } catch (error: any) {
    return {
      name: 'Intradomain Root Barrels',
      passed: false,
      error: error?.message ?? String(error),
    };
  }
}

async function main() {
  const results: CheckResult[] = [];

  if (!only || only === 'constants') {
    results.push(await runConstantsCheck());
  }
  if (!only || only === 'policy') {
    results.push(await runPolicyCheck());
  }
  if (!only || only === 'intradomain') {
    results.push(await runIntradomainCheck());
  }

  // Summary
  console.log('\n📊 Barrel Audit Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    if (result.passed) {
      console.log(`  ✅ ${result.name}: PASSED`);
    } else {
      console.log(`  ❌ ${result.name}: FAILED`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    }
  });

  if (failed > 0) {
    console.log(`\n❌ Barrel audit failed: ${failed} check(s) failed`);
    process.exit(1);
  } else {
    console.log(`\n✅ All barrel checks passed (${passed}/${results.length})`);
    process.exit(0);
  }
}

void main();
