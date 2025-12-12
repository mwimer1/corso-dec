/**
 * @fileoverview Basic tests for docs maintenance tools
 * @description Tests core functionality of the unified docs module
 * NOTE: These docs maintenance tests are executed with the testing tsconfig.
 * Avoid importing from deleted or archived maintenance helpers.
 */

import { describe, expect, it } from 'vitest';
import { createTestSetup, cleanupTestSetup, TEST_ASSERTIONS } from './helpers';
import { runCli } from '../cli';

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

describe('docs maintenance basic', () => {
  let setup: ReturnType<typeof createTestSetup>;

  beforeEach(() => {
    setup = createTestSetup();
  });

  afterEach(() => {
    cleanupTestSetup(setup);
  });

  it('exports runCli function', () => {
    expect(TEST_ASSERTIONS.expectFunction(runCli)).toBe(true);
  });

  it('runCli is async', async () => {
    expect(TEST_ASSERTIONS.expectAsyncFunction(runCli)).toBe(true);
  });

  it('handles help command', async () => {
    // This should not throw and should exit gracefully
    await expect(runCli(['help'])).resolves.not.toThrow();
  });

  it('handles unknown command', async () => {
    // Should throw with appropriate error message
    await expect(runCli(['unknown'])).rejects.toThrow();
  });

  it('handles empty args', async () => {
    // Should show help and exit
    await expect(runCli([])).rejects.toThrow();
  });
});

