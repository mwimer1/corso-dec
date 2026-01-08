import { describe, it, expect } from 'vitest';

// Smoke test: importing the modules file should not throw,
// which confirms ModuleRegistry can run in this environment.
describe('AG Grid module registration', () => {
  it('imports without throwing', async () => {
    // Import the vendor helper which safely registers modules idempotently
    const { ensureAgGridRegistered } = await import('@/lib/vendors/ag-grid');
    expect(() => ensureAgGridRegistered()).not.toThrow();
    // if we got here, registration didn't throw
    expect(true).toBe(true);
  });
});



