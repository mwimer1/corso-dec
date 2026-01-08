import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

describe('API barrel exports (static)', () => {
  it('re-exports withErrorHandlingEdge and withRateLimitEdge from lib/api/index.ts', () => {
    const p = resolve(__dirname, '..', '..', 'lib', 'api', 'index.ts');
    const src = readFileSync(p, 'utf8');
    expect(src.includes("withErrorHandlingEdge")).toBe(true);
    expect(src.includes("withRateLimitEdge")).toBe(true);
  });
});

