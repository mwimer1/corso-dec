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

