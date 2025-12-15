#!/usr/bin/env tsx
/**
 * Find exports that are only referenced from tests.
 * Strategy: run ts-prune twice and diff the outputs.
 *
 * A = ts-prune with tests skipped  -> exports unused when tests are ignored
 * B = ts-prune with tests included -> exports unused even with tests
 * Test-only = A \ B
 *
 * Usage:
 *   pnpm tsx scripts/maintenance/find-test-only-exports.ts [--ci] [-p tsconfig.json]
 */
import { execFileSync } from 'node:child_process';

type Result = { file: string; line: number; name: string };

const args = process.argv.slice(2);
const isCI = args.includes('--ci');
const projectIdx = Math.max(args.indexOf('-p'), args.indexOf('--project'));
const projectArgs: string[] = [];
if (projectIdx !== -1 && projectIdx + 1 < args.length) {
  const flag = args[projectIdx];
  const value = args[projectIdx + 1];
  if (flag && value) {
    projectArgs.push(flag, value);
  }
}

// Matches common test & non-prod "usage" files on both POSIX and Windows:
//   __tests__/, /tests/, \tests\, *.test.*, *.spec.*, *.stories.*, *.e2e.*
const TEST_SKIP_RE =
  '(__tests__|\\\\btests\\\\b|\\\\btest\\\\b|\\\\.test\\\\.|\\\\.spec\\\\.|\\\\.stories\\\\.|\\\\.e2e\\\\.|/tests/|\\\\\\\\tests\\\\\\\\|/test/|\\\\\\\\test\\\\\\\\)';

function runTsPrune(extra: string[]): string[] {
  // Use pnpm exec to run ts-prune
  const out = execFileSync('pnpm', ['exec', 'ts-prune', ...projectArgs, ...extra], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseLine(line: string): Result | null {
  // ts-prune format: "<path>:<line> - <exportName>"
  // Be careful with Windows drive letters (e.g., C:\...) which also contain ':'
  const dash = line.indexOf(' - ');
  if (dash === -1) return null;
  const left = line.slice(0, dash);
  const name = line.slice(dash + 3).trim();
  const lastColon = left.lastIndexOf(':');
  if (lastColon === -1) return null;
  const file = left.slice(0, lastColon).trim();
  const lineNo = Number(left.slice(lastColon + 1).trim());
  if (!file || Number.isNaN(lineNo) || !name) return null;
  return { file, line: lineNo, name };
}

function dedupe<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function main() {
  console.log('🔎 ts-prune diff: locating exports referenced only by tests...\n');

  // A: without tests
  const withoutTests = runTsPrune(['-s', TEST_SKIP_RE]);
  // B: with tests
  const withTests = runTsPrune([]);

  const withTestsSet = new Set(withTests);
  const testOnlyRaw = withoutTests.filter((l) => !withTestsSet.has(l));
  const parsed = dedupe(testOnlyRaw.map(parseLine).filter(Boolean) as Result[]);

  if (parsed.length === 0) {
    console.log('✅ No test-only exports found.');
    process.exit(0);
    return;
  }

  console.log(`⚠️  Found ${parsed.length} export(s) referenced only by tests:\n`);
  for (const r of parsed) {
    console.log(`• ${r.file}:${r.line}`);
    console.log(`  export: ${r.name}\n`);
  }

  console.log(
    '💡 Consider removing these exports or moving test-only helpers under a test-only module.\n'
  );

  if (isCI) {
    // Non-zero exit to make this a failing gate when desired.
    process.exitCode = 1;
  }
}

main();

