// scripts/utils/barrel-validation.ts
// Provide a single API with both sync/async variants;
// delegate to existing helpers to avoid behavior drift.
export { validateBarrelFileSync } from './barrel-utils';
export { validateBarrelFileAsyncFn as validateBarrelFileAsync };

import { validateBarrelFile as validateBarrelFileAsyncFn } from './barrel-utils';

// Optional convenience alias matching most call-sites (async version):
export const validateBarrelFile = validateBarrelFileAsyncFn;

