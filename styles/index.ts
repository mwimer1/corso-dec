// styles/index.ts
// Main styles barrel export - Global utilities only
//
// Import Policy:
// - ✅ Global utilities: cn, cls, latoVariable, tv
// - ❌ Component variants: Import from category barrels instead:
//   - @/styles/ui/atoms
//   - @/styles/ui/molecules
//   - @/styles/ui/organisms

export { latoVariable } from './fonts';
export { cn, cls, tv } from './utils';
export type { VariantProps } from './utils';

