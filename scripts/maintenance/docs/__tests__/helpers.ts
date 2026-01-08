/**
 * Local test helpers for docs maintenance tests.
 * Keep self-contained to avoid coupling to deleted maintenance suites.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type TestSetup = {
  /** Temporary directory for the test run */
  tempDir: string;
};

export const TEST_ASSERTIONS = {
  expectFunction(fn: unknown): boolean {
    return typeof fn === 'function';
  },
  expectAsyncFunction(fn: unknown): boolean {
    const tag = Object.prototype.toString.call(fn);
    return tag.includes('AsyncFunction');
  },
};

/**
 * Create an isolated temp directory for a test.
 * No side effects outside the OS temp area.
 */
export function createTestSetup(): TestSetup {
  const base = tmpdir();
  const dir = mkdtempSync(join(base, 'corso-docs-test-'));
  return { tempDir: dir };
}

/**
 * Best-effort cleanup.
 */
export function cleanupTestSetup(setup: TestSetup) {
  try {
    rmSync(setup.tempDir, { recursive: true, force: true });
  } catch {
    // noop – tests should not fail on cleanup
  }
}


