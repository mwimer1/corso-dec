---
title: "Dead Code Removal - Batch 2 Summary"
description: "Investigation results for Batch 2 dead code removal items."
last_updated: "2025-12-15"
category: "documentation"
status: "stable"
---

# Dead Code Removal - Batch 2 Summary

## Investigation Results

After thorough investigation of Batch 2 domains (`lib/shared`, `lib/validators`, `lib/services`, `lib/api`), we found that **most exports flagged as "unused" are actually used**:

### Findings

1. **Most "unused" exports are false positives:**
   - Used via barrel imports (not detected by static analysis)
   - Used in route handlers (Next.js entrypoints)
   - Used for type inference (`z.infer<>`)
   - Used dynamically or in config files

2. **Truly unused items found:**
   - ✅ `Env` alias from `lib/shared/index.ts` - Removed (only `ValidatedEnv` is used)

### Verified as Used (False Positives)

#### `lib/shared/**`
- `LRUCache` - Used in `lib/shared/errors/reporting.ts`
- `simpleCacheManager` - Used in `lib/shared/feature-flags/core.ts` and `lib/server/feature-flags/feature-flags.ts`
- `reportBrowserError` - Used in error reporting (hooks/security/ was removed as placeholder)
- `IValidationError` - Used internally in `lib/shared/errors/validation-error.ts`
- `SecurityValidationError` - Used in `lib/shared/errors/error-utils.ts`
- `getFeatureFlags` - Used internally in feature flags core
- `formatNumberCompact`, `formatCurrencyCompact`, `formatCurrency` - Used in components
- `trackEvent`, `trackNavClick` - Used extensively in components
- `logger`, `publicEnv` - Used throughout codebase
- `BrandAssets` - Used in `components/ui/organisms/footer-system/footer-main.tsx`
- `APP_LINKS` - Used extensively in components
- `ValidatedEnv` - Used in multiple server files

#### `lib/validators/**`
- `UserSchema` - Exported, may be used for type inference
- `ContactSchema` - Used in `app/(marketing)/contact/actions.ts` (feature-colocated Server Action)
- `ClerkEventEnvelope`, `ClerkUserPayload` - Used in webhook handlers
- `BaseRowSchema`, `CompanyRowSchema`, etc. - Used in entity validators and data processing (previously used in removed `lib/mocks/entity-data.server.ts`)
- `EntityParamSchema`, `EntityListQuerySchema` - Used in `app/api/v1/entity/[entity]/route.ts`

#### `lib/services/**`
- Formatters (`dateFormatter`, `currencyFormatter`, etc.) - Used in `lib/services/entity/adapters/aggrid.ts`
- `ADDRESSES_COLUMNS`, `COMPANIES_COLUMNS`, `PROJECTS_COLUMNS` - Used in entity config files
- `getEntityPage` - Used in `lib/services/entity/actions.ts`
- `getEntityConfig` - Used in dashboard route handlers
- `TableColumnConfig` - Used in OpenAPI types

#### `lib/api/**`
- `withRateLimitEdge`, `withErrorHandlingEdge` - Used in route handlers
- `handleCors` - Used in route handlers
- All exports verified as used

## Actions Taken

1. ✅ Removed unused `Env` alias from `lib/shared/index.ts`
2. ✅ Verified all other exports are actually used

## Conclusion

**Batch 2 is essentially complete.** The codebase is already well-maintained with minimal truly unused exports. The remaining "unused" warnings from ESLint are false positives due to:

- Barrel import patterns
- Type inference usage
- Dynamic imports
- Route handler usage (not detected by static analysis)

## Next Steps

Proceed to **Batch 3** (high-risk items) with careful investigation of:
- Integration exports
- Server-only exports
- Test-only utilities

These require more thorough investigation as they may be used dynamically or be part of the public API surface.

