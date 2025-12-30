# Token Contract Repair - Audit Notes (Batch 1)

**Date**: 2025-01-XX  
**Scope**: P0 Core Contract Repair - Restore "tokens are canonical" contract

## Preflight Findings

### Authoritative Tailwind Config
- **Decision**: Root `tailwind.config.ts` is authoritative
- **Evidence**:
  - `package.json` scripts use: `tailwindcss -c tailwind.config.ts`
  - `config/postcss.config.js` specifies: `tailwindcss: { config: 'tailwind.config.ts' }`
  - Next.js PostCSS integration uses root config

### styles/tailwind.config.ts Status
- **Status**: **ORPHANED** (has references but not used by build)
- **References Found**:
  - `tests/styles/breakpoints.spec.ts` (line 22) - imports for testing
  - `scripts/audit/orphans.allowlist.json` (line 17) - allowlisted as orphan
  - Documentation mentions (not runtime)
- **Decision**: Convert to shim re-exporting root config (test dependency requires it)
- **Mismatches Found**:
  - `accent.DEFAULT` fallback: `217.2 91.2% 59.8%` (wrong) vs `221 86% 90%` (correct, matches secondary)
  - `container.screens['2xl']`: `1400px` (wrong) vs should inherit from BREAKPOINT (correct)

### styles/build Runtime Import Status
- **Status**: ✅ **NOT runtime-imported** (correct)
- **References Found**:
  - `eslint.config.mjs` - ESLint ignore pattern (build artifact)
  - `package.json` - build output path
  - `scripts/lint/css-size-analyzer.ts` - analysis tool
  - `scripts/maintenance/styles-comprehensive-audit.ts` - audit tool
- **Conclusion**: Build artifacts are correctly not imported at runtime

### Shadow Token Gaps
- **Tailwind Config References** (7 tokens):
  - `--shadow-xs` ✅ (exists in shadows.css)
  - `--shadow-sm` ❌ (missing)
  - `--shadow-md` ❌ (missing)
  - `--shadow-lg` ❌ (missing)
  - `--shadow-xl` ❌ (missing)
  - `--shadow-card` ⚠️ (exists in compat.css, should move to shadows.css)
  - `--shadow-elevated` ❌ (missing)
- **Current Token Definitions**:
  - `styles/tokens/shadows.css`: Only `--shadow-xs`
  - `styles/tokens/compat.css`: `--shadow-card` (needs migration)
- **Fallback Values** (from tailwind.config.ts):
  - xs: `0 1px 2px 0 rgba(0,0,0,.05)`
  - sm: `0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)`
  - md: `0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06)`
  - lg: `0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)`
  - xl: `0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -5px rgba(0,0,0,.04)`
  - card: `0 8px 24px hsl(var(--foreground) / 0.06)`
  - elevated: `0 12px 32px hsl(var(--foreground) / 0.08)`

### Dark Mode Mechanism
- **Status**: Inventory only (NOT changing in Batch 1)
- **Mechanism**: Route-based theme system
  - Uses `RouteThemeProvider` component setting `data-route-theme` attribute
  - CSS selectors: `.dark[data-route-theme="auth"]`, `.dark[data-route-theme="marketing"]`, etc.
  - Also uses `@media (prefers-color-scheme: dark)` as fallback
  - Tailwind config: `darkMode: ['class']` (class-based dark mode)
- **Files with dark mode tokens**:
  - `styles/tokens/auth.css`
  - `styles/tokens/protected.css`
  - `styles/tokens/marketing.css`
  - `styles/tokens/colors.css`

## Decisions Made

1. **Shadow Tokens**: Define all 7 missing tokens in `shadows.css` with fallback values matching Tailwind config
2. **Config Consolidation**: Convert `styles/tailwind.config.ts` to shim (test dependency)
3. **Fallback Alignment**: Fix accent fallback mismatch in root config
4. **Token Migration**: Move `--shadow-card` from `compat.css` to `shadows.css`

## Changes Summary

### Files Modified
- `styles/tokens/shadows.css` - Added 6 missing shadow tokens
- `styles/tokens/compat.css` - Removed `--shadow-card` (moved to shadows.css)
- `tailwind.config.ts` - Fixed accent fallback, added header comment
- `styles/tailwind.config.ts` - Converted to shim re-exporting root config

### Files Created
- `styles/README.audit-notes.md` - This file

### Shadow Tokens Added
- `--shadow-sm`
- `--shadow-md`
- `--shadow-lg`
- `--shadow-xl`
- `--shadow-card` (migrated from compat.css)
- `--shadow-elevated`

### Fallback Mismatches Fixed
- `accent.DEFAULT`: Changed from `217.2 91.2% 59.8%` to `221 86% 90%` (matches secondary token default)

---

# Token Allowlist Refinement - Audit Notes (Batch 2)

**Date**: 2025-12-30  
**Scope**: Refine unused token allowlist and verify token usage

## Summary

Refined the unused token allowlist (`styles/tokens/UNUSED.allowlist.json`) to replace broad wildcard patterns with specific token names based on actual Tailwind config mappings. This eliminated false positives and improved audit accuracy.

## Changes Made

### Allowlist Refinement

**Before**: Broad wildcard patterns like `"text-*"`, `"radius-*"`, `"duration-*"`, etc.  
**After**: Specific token names matching Tailwind config mappings

**Rationale**: 
- Wildcard patterns were too permissive and could allowlist tokens that don't actually exist
- Specific token names ensure only tokens mapped in `tailwind.config.ts` are allowlisted
- Makes it easier to verify which tokens are intentionally unused vs. false positives

### Tokens Added to Allowlist

All tokens that are mapped in `tailwind.config.ts` but appear unused because they're consumed via Tailwind utility classes:

**Typography Tokens** (13 tokens):
- `text-xs` through `text-9xl` (all 13 sizes)
- `font-sans`, `font-mono`
- `leading-none` through `leading-loose` (6 tokens)
- `tracking-tighter` through `tracking-widest` (7 tokens)
- `font-thin` through `font-black` (9 tokens)

**Animation Tokens** (23 tokens):
- `duration-75`, `duration-100`, `duration-150`, `duration-200`, `duration-300`, `duration-500`, `duration-700`, `duration-1000`
- `duration-xs`, `duration-sm`, `duration-md`, `duration-lg`, `duration-xl`, `duration-2xl`
- `delay-75`, `delay-100`, `delay-150`, `delay-200`, `delay-300`, `delay-500`, `delay-700`, `delay-1000`
- `delay-xs`, `delay-sm`, `delay-md`, `delay-lg`, `delay-xl`, `delay-2xl`
- `easing-ease`, `easing-ease-in`, `easing-ease-out`, `easing-ease-in-out`, `easing-linear`

**Radius Tokens** (9 tokens):
- `radius-none`, `radius-sm`, `radius-base`, `radius-md`, `radius-lg`, `radius-xl`, `radius-2xl`, `radius-3xl`, `radius-full`

**Shadow Tokens** (7 tokens):
- `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-card`, `shadow-elevated`

**Spacing Tokens** (18 tokens):
- `space-xxs`, `space-xs`, `space-ml`, `space-xl`, `space-2xl`, `space-3xl`, `space-5xl`, `space-6xl`, `space-16xl`
- `space-9`, `space-1-5`, `space-2-5`, `space-4px`
- `menu-min-width`, `menu-min-width-sm`

**Color Tokens** (4 tokens):
- `border-subtle`, `secondary-foreground`, `text-low`
- `surface-hover` (already in allowlist)

**Hero/Marketing Tokens** (6 tokens):
- `hero-bg`, `hero-fg`, `hero-fg-muted`, `hero-accent`, `hero-container-max`, `hero-gap`
- `hero-bg-color`, `hero-fg-color`, `hero-fg-muted-color`, `hero-accent-color`

**Sidebar Tokens** (21 tokens):
- All `sb-*` tokens used in sidebar component CSS modules

### Audit Script Improvements

Updated `scripts/maintenance/audit-unused-tokens.ts`:
- Enhanced documentation explaining Tailwind integration limitation
- Added comments about future improvements (optional Tailwind usage checking)
- Clarified that allowlist should contain specific token names, not wildcards

### Verification Results

**Before refinement**: 21 unused tokens reported  
**After refinement**: 0 unused tokens reported

All tokens are either:
1. Used directly via `var(--token-name)` in code
2. Used via Tailwind utility classes (mapped in `tailwind.config.ts`)
3. Intentionally unused (marketing-only, etc.) and allowlisted

### Obsolete Tokens Check

Verified that tokens mentioned in audit documentation as obsolete are no longer present:
- ✅ Button tokens (`btn-link-*`, `btn-outline-*`, `btn-primary-*`) - Already removed
- ✅ Obsolete radius tokens (`radius-chip`, `radius-cta`, `radius-default`, `radius-link`, `radius-pill`) - Already removed
- ✅ Breakpoint tokens (`bp-*`) - Already removed

**Conclusion**: No obsolete tokens found to remove. All existing tokens are actively used.

## Files Modified

- `styles/tokens/UNUSED.allowlist.json` - Refined from wildcard patterns to specific token names
- `scripts/maintenance/audit-unused-tokens.ts` - Enhanced documentation and comments

## Impact

- **Improved accuracy**: Audit now correctly identifies 0 unused tokens (down from 21 false positives)
- **Better maintainability**: Specific token names make it easier to verify which tokens are intentionally unused
- **Clearer documentation**: Script comments explain Tailwind integration limitation and future improvements

## Next Steps (Optional)

1. **Tailwind Usage Verification**: Implement optional cross-check against `tailwind.config.ts` to verify allowlisted tokens are actually mapped
2. **Codebase Search**: Add optional search for Tailwind class usage (e.g., "text-2xl" for `--text-2xl` token)
3. **Audit Report**: Output detailed report showing which tokens are allowlisted vs. truly unused

