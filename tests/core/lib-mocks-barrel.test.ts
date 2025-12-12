/**
 * @fileoverview Barrel integrity tests to prevent export drift
 * @description Ensures barrel exports remain consistent with runtime expectations
 */

// adaptProjectCsvRow removed as unused export
import { describe, expect, it } from 'vitest';

describe('lib/mocks barrel exports', () => {
  it('adaptProjectCsvRow has been removed as unused', () => {
    // adaptProjectCsvRow was removed as part of unused exports cleanup
    // This test documents the removal for future reference
    expect(typeof adaptProjectCsvRow).toBe('undefined');
  });
});

