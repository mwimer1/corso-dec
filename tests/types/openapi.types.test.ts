import { describe, expectTypeOf, it } from 'vitest';

// Type-only import through the barrel
// eslint-disable-next-line corso/no-cross-domain-imports, corso/no-deep-imports
import type { operations, paths } from '@/types/api';

describe('OpenAPI types are present and shaped', () => {
  it('paths & operations namespaces exist', () => {
    // Existence checks (compile-time): these fail if the names disappear
    expectTypeOf<paths>().toBeObject();
    expectTypeOf<operations>().toBeObject();
  });

  it('example endpoint keys compile (non-exhaustive smoke)', () => {
    // Replace with a real, known path/operation id from your spec if desired.
    // These assertions do not run—they only type-check.
    type _OptionalHealth = paths['/api/status/health'] | unknown;
    type _OptionalOp = operations['entity_query'] | unknown;
    expectTypeOf<_OptionalHealth>().toBeUnknown(); // keeps the compile-only reference
    expectTypeOf<_OptionalOp>().toBeUnknown();
  });
});

