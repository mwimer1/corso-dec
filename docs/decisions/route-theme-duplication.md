---
title: "Decisions"
description: "Documentation and resources for documentation functionality. Located in decisions/."
last_updated: "2026-01-02"
category: "documentation"
status: "draft"
---
# Decision: Route Theme Duplication (KEEP)

**Date**: 2025-12-25  
**Status**: ✅ Accepted  
**Decision Type**: Architecture / Stability

## Context

The codebase has two nearly identical `_theme.tsx` wrapper files:
- `app/(auth)/_theme.tsx` - Wraps `RouteThemeProvider` with `theme="auth"`
- `app/(marketing)/_theme.tsx` - Wraps `RouteThemeProvider` with `theme="marketing"`

Each file is ~5-6 lines and contains minimal duplication (~11 lines total).

## Decision: KEEP as-is

We are intentionally keeping the duplication. This is the correct architectural choice for this dev cycle.

### Why We Keep It

1. **Server/Client Boundary Clarity**
   - `app/(marketing)/layout.tsx` is a **server component** (no `'use client'`)
   - `app/(auth)/layout.tsx` is a **client component** (`'use client'`)
   - The explicit `_theme.tsx` files provide a clear client boundary for the `RouteThemeProvider` component
   - Attempting to "DRY" this would introduce complex server/client boundary logic

2. **Explicitness & Safety**
   - Each route group explicitly declares its theme
   - No pathname/segment auto-detection "magic" that could break
   - Easy to reason about: auth routes → auth theme, marketing routes → marketing theme

3. **Minimal Duplication**
   - Total duplication: ~11 lines across 2 files
   - The duplication is doing real architectural work (client boundary enforcement)
   - Cost of refactoring (complexity, regression risk) > benefit (removing 11 lines)

4. **Current Sprint Priorities**
   - Higher-impact work: health aliases, dashboard consolidation, export deprecation, insights search
   - Theme refactors are low ROI and higher regression risk
   - Stability > premature optimization

### What We Will NOT Do

- ❌ Inline theme logic into server layouts (breaks client boundary)
- ❌ Pathname-based auto-detection (magic, fragile, hard to debug)
- ❌ Shared theme wrapper with conditional logic (adds complexity without clear benefit)
- ❌ Refactor theme structure unless we can prove a measurable issue

### What Would Trigger Revisiting

We will only revisit this decision if:

1. **Reproducible FOUC/Flicker**: Observable flash of unstyled content or theme flicker during navigation
2. **Measurable Performance Issue**: Proven performance impact (not theoretical)
3. **Architectural Change**: Significant change to Next.js layout system that makes current pattern untenable

### Current Implementation

```typescript
// app/(auth)/_theme.tsx
import RouteThemeProvider from '@/app/providers/route-theme-provider';
export default function RouteThemeAuth() {
  return <RouteThemeProvider theme="auth" />;
}

// app/(marketing)/_theme.tsx
import RouteThemeProvider from '@/app/providers/route-theme-provider';
export default function RouteThemeMarketing() {
  return <RouteThemeProvider theme="marketing" />;
}
```

The `RouteThemeProvider` uses `useEffect` to set `document.documentElement.dataset.routeTheme`, which applies CSS custom properties via `:root[data-route-theme="..."]` selectors.

## Guardrails

### Automated Testing

- E2E test: `tests/e2e/route-theme.smoke.test.ts` verifies theme attributes are set correctly
- Manual verification checklist (see below)

### Manual Verification Checklist

Before releasing theme-related changes, verify:

- [ ] Hard refresh `/sign-in` with cache disabled → confirm `data-route-theme="auth"` is set
- [ ] Hard refresh `/pricing` with cache disabled → confirm `data-route-theme="marketing"` is set
- [ ] Navigate auth → marketing → protected → confirm theme attribute updates correctly
- [ ] Confirm no visible flash/flicker during navigation (or record if seen)
- [ ] Verify CSS custom properties are applied (e.g., `--background`, `--foreground`, `--primary`)

## Marketing Layout Runtime Flags - Follow-up Investigation

**Status**: ⚠️ Optimization opportunity (not blocking)

The marketing layout sets:
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**Current Justification**: Comment says "for consistency with repo rules"

**Analysis**:
- Layout itself doesn't import server-only code
- Child pages (`/insights/*`, `/pricing`) use `@/lib/marketing/server` which requires Node.js
- `force-dynamic` may be unnecessary for the layout itself (child pages can override)

**Potential Optimization** (Future Work):
- Layout could use Edge runtime or ISR for static pages like `/`, `/terms`, `/privacy`
- Child pages that need server-only code would override with `runtime = 'nodejs'`
- This would improve caching for static marketing pages

**Action**: Create follow-up ticket to investigate, but **do not change in this cycle** (stability priority).

## FOUC/Flicker Mitigation (If Needed)

**Current Status**: No observed flicker. Only address if reproducible.

If flicker is observed, consider these options (in order of risk):

### Option 1: Keep as-is (Status Quo)
- **Risk**: None
- **Benefit**: No change
- **Recommendation**: Default choice unless flicker is proven

### Option 2: Reduce Transition Flicker
- **Approach**: Remove cleanup restore OR switch to `useLayoutEffect`
- **Risk**: Medium (could cause hydration mismatches)
- **Benefit**: Faster theme application
- **Trade-off**: `useLayoutEffect` runs synchronously, could block paint

### Option 3: Server-First Theme Attribute
- **Approach**: Set theme attribute during SSR (hard; requires layout coordination)
- **Risk**: High (complex, could break client hydration)
- **Benefit**: Zero flicker
- **Recommendation**: Only if flicker is severe and other options fail

**Current Recommendation**: Option 1 (keep as-is) unless flicker is observed and measured.

## Related Files

- `app/(auth)/_theme.tsx`
- `app/(marketing)/_theme.tsx`
- `app/(auth)/layout.tsx`
- `app/(marketing)/layout.tsx`
- `app/providers/route-theme-provider.tsx`
- `styles/tokens/{auth,marketing,protected}.css`
