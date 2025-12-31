// styles/index.ts
// Main styles barrel export - Global utilities only
//
// Import Policy:
// - ✅ Global utilities: cn, interVariable, tv
// - ❌ Component variants: Import from category barrels instead:
//   - @/styles/ui/atoms
//   - @/styles/ui/molecules
//   - @/styles/ui/organisms

export { interVariable } from './fonts';
export { cn, tv } from './utils';
export type { VariantProps } from './utils';

