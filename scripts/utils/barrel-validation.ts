// scripts/utils/barrel-validation.ts
// Provide a single API with both sync/async variants;
// delegate to existing helpers to avoid behavior drift.
export { validateBarrelFile as validateBarrelFileSync } from '@/scripts/maintenance/barrel-helpers';
export { validateBarrelFileAsyncFn as validateBarrelFileAsync };

import { validateBarrelFile as validateBarrelFileAsyncFn } from '@/scripts/utils/barrel-utils';

// Optional convenience alias matching most call-sites (async version):
export const validateBarrelFile = validateBarrelFileAsyncFn;

