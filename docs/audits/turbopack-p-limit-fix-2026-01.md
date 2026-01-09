---
category: "documentation"
last_updated: "2026-01-09"
status: "draft"
---
# Turbopack Build Error Fix: p-limit Compatibility

**Date:** 2026-01-XX  
**Status:** Resolved  
**Related Issue:** Build error with `p-limit@5.0.0` in Turbopack

## Root Cause Analysis

### Error
```
Error: Turbopack build failed with 1 errors:
./node_modules/.pnpm/p-limit@5.0.0/node_modules/p-limit/index.js:2:1
Module not found: Can't resolve '#async_hooks'
```

### Root Cause
1. **`p-limit@5.0.0` uses Node.js built-ins**: The library uses `#async_hooks` (Node.js internal module) for async context tracking
2. **Turbopack bundling issue**: Even though `lib/integrations/clickhouse/server.ts` is marked `'server-only'`, Turbopack analyzes the import chain:
   - `app/api/v1/ai/chat/route.ts` → `lib/api/ai/chat/handler.ts` → `lib/api/ai/chat/tools.ts` → `lib/integrations/clickhouse/server.ts`
   - During bundling analysis, Turbopack tries to resolve `p-limit` dependencies and fails on `#async_hooks`
3. **Scripts vs App Code**: `p-limit` works fine in `scripts/` (pure Node.js execution), but causes bundling issues in app code processed by Turbopack

## Solution Implemented

### Replacement: Promise-Based Semaphore
Created a simple, Turbopack-compatible semaphore implementation that:
- ✅ Uses only standard JavaScript Promises (no Node.js built-ins)
- ✅ Provides same concurrency limiting functionality
- ✅ Works in both Node.js runtime and Turbopack bundling
- ✅ Maintains same API surface as `p-limit`

### Files Changed
- **Created:** `lib/integrations/clickhouse/concurrency.ts` - Promise-based semaphore
- **Modified:** `lib/integrations/clickhouse/server.ts` - Replaced `p-limit` import with custom semaphore
- **Added:** `tests/lib/clickhouse-concurrency.test.ts` - Test coverage

### Implementation Details
```typescript
// Simple Promise queue-based semaphore
export function createSemaphore(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  
  return async <T>(fn: () => Promise<T> | T): Promise<T> => {
    // Wait if at limit
    if (active >= concurrency) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}
```

## Verification

- ✅ Build succeeds: `pnpm build` completes without errors
- ✅ Typecheck passes: `pnpm typecheck` validates correctly
- ✅ Tests pass: Semaphore functionality verified
- ✅ API unchanged: Same behavior, different implementation

## Decision Rationale

**Why not downgrade `p-limit`?**
- `p-limit@4.x` doesn't have the issue, but:
  - Would require version pinning (different from scripts)
  - Doesn't solve the underlying Turbopack bundling concern
  - Custom implementation gives us control and clarity

**Why not keep `p-limit` in scripts?**
- Scripts continue using `p-limit@5.0.0` (pure Node.js, no bundling)
- Only app code needed the replacement

## Prevention

### Guidelines
1. **App code (`lib/`, `app/`, `components/`):** Avoid libraries using Node.js built-ins that Turbopack can't resolve
   - ✅ Use: Standard JavaScript/TypeScript, standard Node.js APIs (fs, path, etc.)
   - ❌ Avoid: Libraries using `#async_hooks`, `#stream/web`, etc. in app code
2. **Scripts (`scripts/`):** Can use any Node.js libraries (not bundled by Turbopack)
3. **Check before adding:** Review library dependencies for Node.js built-in usage if it will be imported by app code

### Future Considerations
- Consider adding a lint rule to detect Node.js built-in imports in app code
- Document this pattern in development guidelines

## References

- [Next.js Turbopack Module Resolution](https://nextjs.org/docs/app/api-reference/next-config-js/turbopack)
- [p-limit v5 Release Notes](https://github.com/sindresorhus/p-limit/releases/tag/v5.0.0)
- [Comprehensive Dashboard + Chat Implementation Plan](../../.cursor/implementation-plan/comprehensive-dashboard-chat-todos.md)
