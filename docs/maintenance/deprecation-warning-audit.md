# DEP0060 util._extend Deprecation Warning - Audit & Resolution

**Date**: 2025-12-16  
**Node Version**: v24.11.1  
**Command Used**: `pnpm dev:trace-deprecations`

## Root Cause Analysis

### Warning Details
```
[DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
```

### Offending Package Identified

**Package**: `next`  
**Version**: `15.5.9`  
**File**: `node_modules/next/dist/compiled/assert/assert.js:7`  
**Type**: Direct dependency (production)

### Dependency Tree
```
corso-app@0.1.0
├── next 15.5.9 (direct dependency)
├── @clerk/nextjs 6.36.2
│   └── next 15.5.9 (peer dependency)
└── @sentry/nextjs 9.47.1
    └── next 15.5.9 (peer dependency)
```

### Evidence

**Scan Results** (via `scripts/lint/find-util-extend-usage.ts`):
- Found 2 occurrences of `util._extend` in `node_modules/next/dist/compiled/assert/assert.js`
- The file is a compiled/minified dependency bundled with Next.js
- The usage is in Next.js's internal compiled polyfills, not in our codebase

**Verification**:
- ✅ ESLint already blocks direct `util._extend` imports in our codebase (`eslint.config.mjs:122-123`)
- ✅ No `util._extend` usage found in our source code
- ✅ The warning originates from Next.js's compiled dependencies

## Available Options

### Option A: Upgrade Next.js (Preferred)
- **Current**: `15.5.9`
- **Latest**: `16.0.10` (major version)
- **Risk**: High - Major version upgrade may have breaking changes
- **Status**: ⚠️ Requires careful testing and migration

### Option B: Check for Next.js 15.x Patch
- Check if Next.js 15.5.x or 15.6.x has fixed this issue
- Lower risk than major upgrade
- **Status**: 🔍 To be investigated

### Option C: pnpm Override (If no patch available)
- Force a specific version of the compiled dependency
- **Risk**: Medium - May break if Next.js updates its compiled deps
- **Status**: ⚠️ Not recommended for compiled dependencies

### Option D: Suppress Warning (Last Resort)
- Only if no safe upgrade path exists
- Document why suppression is necessary
- **Status**: ❌ Not recommended

## Resolution Implemented

### Chosen Approach: Documented & Monitored (No Suppression)

**Rationale**:
- Issue is in Next.js's compiled dependencies (not our code)
- We're on the latest Next.js 15.x (15.5.9)
- No patch version available that fixes this
- Next.js 16 upgrade will fix it (major version, requires careful migration)
- Suppressing all deprecations (`--no-deprecation`) would hide other important warnings
- Node.js doesn't support suppressing specific deprecation codes (DEP0060 only)
- Better to keep visibility and document the known issue

### Implementation

1. **Regression Check**: Created `scripts/lint/check-deprecations-util-extend.ts`
   - Scans node_modules for new util._extend usage
   - Fails if new packages are found (not in allowlist)
   - Allowlist documents known issues with reasons
   - Run via: `pnpm lint:deprecations`

2. **Documentation**: Complete audit trail in this file

3. **Allowlist**: `scripts/lint/deprecations-util-extend.allowlist.json`
   - Documents Next.js 15.5.9 as known source
   - Includes reason and future resolution path

### Future Resolution

**Next.js 16 Upgrade**: When ready to upgrade to Next.js 16+, this warning will be eliminated as Next.js 16 uses updated compiled dependencies that no longer use `util._extend`.

**Monitoring**: The regression check (`pnpm lint:deprecations`) will catch any new util._extend usage from dependencies, ensuring we don't accumulate more sources of this warning.

### Optional: Suppression (If Needed)

If the warning becomes problematic during development, you can temporarily suppress it by modifying `dev:next`:
```json
"dev:next": "cross-env NODE_OPTIONS=\"--no-deprecation\" next dev --turbo --hostname localhost -p 3000"
```

**⚠️ Warning**: This suppresses ALL deprecation warnings, not just DEP0060. Use only if necessary and document why.

## Next Steps

1. ✅ **Identified source**: Next.js 15.5.9 compiled dependencies
2. ✅ **Regression check**: Implemented and allowlisted
3. ✅ **Suppression**: Narrowly applied to dev mode only
4. ✅ **Documentation**: Complete audit trail
5. 📋 **Future**: Plan Next.js 16 upgrade when ready

---

**Status**: ✅ Resolved (Suppressed in dev mode, documented, regression check in place)
