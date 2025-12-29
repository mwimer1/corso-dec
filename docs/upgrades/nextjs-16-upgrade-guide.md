---
title: "Next.js 16 Upgrade Guide"
description: "Comprehensive upgrade path from Next.js 15.5.9 to Next.js 16.0.10+ with security and compatibility checks."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---

# Next.js 16 Upgrade Guide

**Status**: ✅ **COMPLETED**  
**Target Version**: Next.js 16.0.10+ (patched security release)  
**Current Version**: Next.js 16.0.10 (upgrade completed)

## 🎯 Executive Summary

**✅ UPGRADE COMPLETED**: This codebase has been successfully upgraded to Next.js 16.0.10. This guide documents the upgrade path that was followed and serves as a reference for future upgrades.

This guide provided a comprehensive, production-ready upgrade path from Next.js 15.5.9 to Next.js 16.0.10+ (patched security release). The upgrade followed the official Next.js migration path with additional security and compatibility checks.

### Critical Requirements
- **Security**: Pin to Next.js 16.0.10+ (patched for RSC security advisories)
- **Turbopack**: Default bundler in Next.js 16 - webpack config needs migration plan
- **Async APIs**: All `params`, `searchParams`, `headers()`, `cookies()`, `draftMode()` are now async
- **Middleware**: `middleware.ts` → `proxy.ts` migration (optional but recommended)

---

## 📋 Pre-Upgrade Audit Results

### ✅ Already Compatible
- Most API routes handle async params correctly
- No AMP usage found
- No `next lint` command usage
- No `unstable_` prefixed APIs
- No `experimental_ppr` usage
- No `next/config` runtime config usage
- No `revalidateTag()` in production code (only test mocks)
- No `images.domains` usage (using `remotePatterns`)
- No local image query strings found

### ⚠️ Issues Found
1. **Async params**: `app/(marketing)/insights/categories/[category]/page.tsx` uses sync params
2. **Async headers()**: `app/(marketing)/contact/actions.ts` calls `headers()` with await (fixed in PR5.2)
3. **Webpack config**: `config/next.config.mjs` has custom webpack configuration (needs Turbopack migration plan)
4. **Experimental Clerk**: `components/billing/subscription-client.tsx` uses `@clerk/nextjs/experimental`
5. **searchParams**: API routes use `URL.searchParams` (compatible), but no page components use `searchParams` props (good)

---

## 🚀 Step-by-Step Upgrade Plan

### Phase 1: Pre-Upgrade Preparation

#### 1.1 Create Upgrade Branch
```bash
git checkout -b upgrade/nextjs-16
```

#### 1.2 Backup Current State
```bash
# Create a backup commit
git commit -m "chore: pre-upgrade snapshot for Next.js 15.5.9" # (Historical - upgrade completed)
```

#### 1.3 Run Full Test Suite
```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

**Expected**: All tests should pass before upgrade.

---

### Phase 2: Fix Breaking Changes (Before Upgrade)

#### 2.1 Fix Async Params in Category Page

**File**: `app/(marketing)/insights/categories/[category]/page.tsx`

**Current** (lines 10-16):
```typescript
export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const cat = params.category;
  // ...
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const { category } = params;
  // ...
}
```

**Fix**:
```typescript
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: cat } = await params;
  return { title: `${cat} | Corso Insights`, description: `Insights in category ${cat}` };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  // ... rest of code
}
```

#### 2.2 Fix Async headers() Call

**File**: `app/(marketing)/contact/actions.ts` (moved from `actions/marketing/contact-form.ts` in PR5.2)

**Current** (line 19):
```typescript
const h: any = headers();
```

**Fix**:
```typescript
const h = await headers();
```

#### 2.3 Verify Clerk Experimental Import

**File**: `components/billing/subscription-client.tsx`

**Current** (line 3):
```typescript
import { useSubscription } from '@clerk/nextjs/experimental'
```

**Action**:
- Check Clerk's Next.js 16 compatibility documentation
- Verify `@clerk/nextjs` version supports Next.js 16
- Keep experimental import if Billing APIs are still experimental (as per Clerk docs)
- Consider pinning Clerk version to avoid Billing API churn

**Note**: Clerk's Billing features are in Beta and intentionally experimental. Do not assume they'll move to stable soon.

---

### Phase 3: Update Dependencies (Security-First)

#### 3.1 Pin to Patched Next.js 16 Release

**Critical**: Use Next.js 16.0.10+ (patched for December 2025 RSC security advisories)

```bash
# Explicitly install patched version
pnpm add next@^16.0.10 react@latest react-dom@latest
pnpm add -D @types/react@latest @types/react-dom@latest @next/bundle-analyzer@^16.0.10 @next/eslint-plugin-next@^16.0.10
```

#### 3.2 Run Security Remediation Helper (Optional but Recommended)

```bash
# Run official Next.js security remediation helper
npx fix-react2shell-next
```

This ensures you're on a patched version and applies any additional security fixes.

#### 3.3 Verify Installed Version

```bash
pnpm list next
# Should show: next@16.0.10 or higher
```

#### 3.4 Update Clerk (If Needed)

```bash
# Check Clerk's Next.js 16 compatibility
# If update needed:
pnpm add @clerk/nextjs@latest

# Consider pinning if Billing APIs are critical:
# pnpm add @clerk/nextjs@^6.x.x  # Pin to specific version
```

---

### Phase 4: Run Automated Codemod

#### 4.1 Run Next.js Codemod

```bash
npx @next/codemod@canary upgrade latest
```

**What this does**:
- Updates `next.config.js` for Turbopack
- Removes `unstable_` prefixes
- Removes `experimental_ppr` flags
- Migrates middleware → proxy (if applicable)
- Updates other deprecated patterns

#### 4.2 Review Codemod Changes

```bash
git diff
# Review all changes before committing
```

**Expected changes**:
- `next.config.mjs` updates
- Possible `middleware.ts` → `proxy.ts` rename
- Removal of deprecated flags

---

### Phase 5: Manual Configuration Updates

#### 5.1 Handle Turbopack Default Bundler

**Issue**: Next.js 16 uses Turbopack as default. Custom webpack config may cause build failures.

**Current webpack config**: `config/next.config.mjs` (lines 144-240)

**Options**:

**Option A: Keep Webpack for Production Initially** (Safest)
```bash
# Use --webpack flag for builds
pnpm build --webpack
```

**Option B: Migrate to Turbopack-Compatible Config**

The codemod should handle most Turbopack config updates. However, if you need to keep webpack temporarily:

```javascript
// config/next.config.mjs
const nextConfig = {
  // ... existing config
  // Note: webpack config will be ignored if Turbopack is used
  // Consider migrating webpack-specific rules to Turbopack equivalents
};
```

**Option C: Conditional Webpack Usage**

```javascript
// Only use webpack if explicitly requested
const useWebpack = process.env.USE_WEBPACK === 'true';

const nextConfig = {
  // ... other config
  ...(useWebpack && {
    webpack: (config, { dev, isServer }) => {
      // ... existing webpack config
    },
  }),
};
```

**Recommendation**: Start with Option A (--webpack flag), then migrate to Turbopack in a follow-up PR.

#### 5.2 Update Image Configuration

**File**: `config/next.config.mjs`

**Current** (lines 107-123):
```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [/* ... */],
  // ...
}
```

**Add explicit defaults** (if current behavior is important):
```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  // Explicitly set if you want 60s TTL (default is now 14400)
  minimumCacheTTL: 60,
  // Explicitly set if you want range (default is now [75])
  qualities: [75, 50, 25],
  // Explicitly set (default changed from unlimited to 3)
  maximumRedirects: 3,
  // ... rest of existing config
  remotePatterns: [/* ... */],
  // Note: images.domains is deprecated, use remotePatterns (already done)
  // Note: If using local images with query strings, add:
  // localPatterns: {
  //   search: true, // Enable query strings in local image paths
  // },
}
```

#### 5.3 Middleware to Proxy Migration

**File**: `middleware.ts` → `proxy.ts`

**Option A: Use Codemod** (Recommended)
```bash
npx @next/codemod@canary middleware-to-proxy .
```

**Option B: Manual Migration**

1. Rename `middleware.ts` to `proxy.ts`
2. Update function name:
   ```typescript
   // Before
   export const middleware = clerkMiddleware(async (auth, req) => {
     // ...
   });
   
   // After
   export const proxy = clerkMiddleware(async (auth, req) => {
     // ...
   });
   ```
3. Keep config export (same):
   ```typescript
   export const config = {
     matcher: [
       '/((?!_next|.*\\..*).*)',
       '/(api)(.*)',
     ],
   };
   ```

**Note**:
- `proxy.ts` runs in Node.js runtime (not Edge)
- Clerk's `clerkMiddleware` should work with `proxy.ts`
- Verify Clerk's Next.js 16 compatibility docs

#### 5.4 Update Experimental Flags

**File**: `config/next.config.mjs`

**Current** (lines 143-145):
```javascript
experimental: {
  serverSourceMaps: isCI,
},
```

**Update**:
```javascript
experimental: {
  serverSourceMaps: isCI,
  // Optional: Enable Turbopack file system cache for faster dev builds
  turbopackFileSystemCacheForDev: true,
},
```

---

### Phase 6: Code Updates for Async APIs

#### 6.1 Verify All Params Usage

**Files already handling async params correctly** ✅:
- `app/(marketing)/insights/[slug]/page.tsx`
- `app/(protected)/dashboard/(entities)/[entity]/page.tsx`
- `app/api/v1/entity/[entity]/route.ts`
- `app/api/v1/entity/[entity]/query/route.ts`
- `app/api/v1/entity/[entity]/export/route.ts`

**Files needing updates** ❌:
- `app/(marketing)/insights/categories/[category]/page.tsx` (fix in Phase 2.1)

#### 6.2 Verify All searchParams Usage

**Current usage**:
- API routes use `URL.searchParams` (compatible) ✅
- No page components use `searchParams` props ✅

**If you add searchParams to pages in the future**:
```typescript
// ✅ CORRECT: Async searchParams
export default async function Page({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const params = await searchParams;
  const query = params.q;
  // ...
}
```

#### 6.3 Verify All headers() and cookies() Usage

**Files to check**:
- `app/(marketing)/contact/actions.ts` ✅ (fixed in PR5.2 - now feature-colocated)
- `docs/security/auth-patterns.md` (documentation only)

**Search for any other usage**:
```bash
grep -r "headers()" app/ lib/ actions/ --include="*.ts" --include="*.tsx"
grep -r "cookies()" app/ lib/ actions/ --include="*.ts" --include="*.tsx"
```

**All should use await**:
```typescript
// ✅ CORRECT
const headersList = await headers();
const cookieStore = await cookies();
```

#### 6.4 Verify draftMode() Usage

No usage found in codebase ✅

#### 6.5 Verify Cache Invalidation APIs

**Current usage**:
- `revalidateTag()` only in test mocks ✅
- No production usage found ✅

**If you use revalidateTag in the future**:
```typescript
// Next.js 16 signature changed
// Before: revalidateTag(tag)
// After: revalidateTag(tag, { cacheLife: 'stale' | 'expired' })
import { revalidateTag } from 'next/cache';

await revalidateTag('products', { cacheLife: 'stale' });
```

---

### Phase 7: Testing and Validation

#### 7.1 Type Checking
```bash
pnpm typecheck
```

**Expected**: May see new type errors from Next.js 16 stricter types. Fix as needed.

#### 7.2 Linting
```bash
pnpm lint
```

#### 7.3 Build Verification (Critical Checkpoint)

**First, try with Turbopack (default)**:
```bash
pnpm build
```

**If build fails due to webpack config**:
```bash
pnpm build --webpack
```

**Expected**: Build should succeed. Note any warnings or errors.

#### 7.4 Test Suite
```bash
pnpm test
```

#### 7.5 Development Server
```bash
pnpm dev
```

**Test critical paths**:
- [ ] Authentication flow (sign-in/sign-up)
- [ ] Dashboard pages
- [ ] API routes (especially dynamic routes)
- [ ] Entity pages (projects, companies, addresses)
- [ ] Marketing pages (insights, categories)
- [ ] Contact form submission
- [ ] Subscription management

#### 7.6 Production Build Test (Critical)
```bash
pnpm build
pnpm start
# Test in production mode
```

**This is where proxy/runtime/turbopack/image behavior changes surface fastest.**

---

### Phase 8: Dependency Compatibility Check

#### 8.1 Check Major Dependencies

**Verify compatibility**:
- [ ] `@clerk/nextjs` - Check for Next.js 16 compatible version
- [ ] `@sentry/nextjs` - Check for Next.js 16 compatible version
- [ ] `@tanstack/react-query` - Should be compatible
- [ ] `ag-grid-*` - Should be compatible
- [ ] All `@radix-ui/*` packages - Should be compatible

#### 8.2 Update Incompatible Packages
```bash
# Check for updates
pnpm outdated

# Update specific packages if needed
pnpm add @clerk/nextjs@latest @sentry/nextjs@latest
```

---

### Phase 9: Performance and Optimization (Optional)

#### 9.1 Enable Turbopack File System Cache
```javascript
// config/next.config.mjs
experimental: {
  serverSourceMaps: isCI,
  turbopackFileSystemCacheForDev: true, // Faster dev builds
},
```

#### 9.2 React Compiler (Optional)
```bash
pnpm add -D babel-plugin-react-compiler
```

```javascript
// config/next.config.mjs
const nextConfig = {
  reactCompiler: true, // Enable React Compiler
  // ...
};
```

---

### Phase 10: Documentation Updates

#### 10.1 Update Architecture Docs
- `docs/architecture/architecture-overview.md` - Update Next.js version
- Update any version-specific documentation

#### 10.2 Update README Files
- Update Next.js version references in relevant README files

---

## 🚨 Critical Gotchas and Risks

### 1. Security: Pin to Patched Version
- **Risk**: Early Next.js 16.0.x versions have RSC security vulnerabilities
- **Mitigation**: Always use 16.0.10+ (patched for December 2025 advisories)
- **Action**: Explicitly pin version in Phase 3.1

### 2. Turbopack Default Bundler
- **Risk**: Custom webpack config may cause build failures
- **Impact**: Builds may fail if webpack-specific features are used
- **Mitigation**:
  - Use `--webpack` flag initially
  - Migrate webpack config to Turbopack-compatible config
  - Test builds early (Phase 7.3)

### 3. Middleware/Proxy Runtime Change
- **Risk**: `proxy.ts` runs in Node.js runtime, not Edge
- **Impact**: If middleware uses Edge-only APIs, migration may require refactoring
- **Mitigation**: Test middleware functionality after migration

### 4. Async Params Breaking Change
- **Risk**: Routes with sync params will break
- **Impact**: Runtime errors in affected routes
- **Mitigation**: Fix all params usage before upgrade (Phase 2.1)

### 5. Async headers/cookies Breaking Change
- **Risk**: Calls without await will break
- **Impact**: Runtime errors in server actions/components
- **Mitigation**: Fix all headers/cookies usage (Phase 2.2)

### 6. Async searchParams Breaking Change
- **Risk**: Page components using sync searchParams will break
- **Impact**: Runtime errors in affected pages
- **Mitigation**: Verify no page components use searchParams props (audit complete ✅)

### 7. Image Configuration Defaults
- **Risk**: Different caching behavior
- **Impact**: Images may cache longer/shorter than expected
- **Mitigation**: Explicitly set values if current behavior is important (Phase 5.2)

### 8. Clerk Compatibility
- **Risk**: Experimental Clerk APIs may not be compatible
- **Impact**: Subscription component may break
- **Mitigation**:
  - Check Clerk's Next.js 16 migration guide
  - Keep experimental import if needed (Billing is intentionally experimental)
  - Pin Clerk version to avoid API churn

### 9. Cache API Changes
- **Risk**: `revalidateTag()` signature changed
- **Impact**: If used, will need signature update
- **Mitigation**: No production usage found ✅

### 10. TypeScript Strictness
- **Risk**: Next.js 16 may have stricter type checking
- **Impact**: New TypeScript errors
- **Mitigation**: Run `pnpm typecheck` and fix errors

---

## 🔄 Rollback Plan

If issues occur:

1. **Revert to previous commit**:
   ```bash
   git revert HEAD
   # OR
   git reset --hard <pre-upgrade-commit-hash>
   ```

2. **Restore package.json**:
   ```bash
   git checkout main -- package.json pnpm-lock.yaml
   pnpm install
   ```

3. **Restore next.config**:
   ```bash
   git checkout main -- next.config.mjs config/next.config.mjs
   ```

---

## ✅ Post-Upgrade Checklist

- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Linting passes
- [ ] Production build successful (with Turbopack or --webpack)
- [ ] Development server runs without errors
- [ ] Authentication flow works
- [ ] API routes respond correctly
- [ ] Dynamic routes work (entity pages, category pages)
- [ ] Server actions work (contact form)
- [ ] No console errors/warnings
- [ ] Performance metrics acceptable
- [ ] Documentation updated
- [ ] Security: Confirmed Next.js 16.0.10+ installed
- [ ] Turbopack: Build works (or --webpack fallback tested)

---

## 📊 Estimated Timeline

- **Phase 1-2** (Preparation & Fixes): 1-2 hours
- **Phase 3-4** (Dependencies & Codemod): 30 minutes
- **Phase 5-6** (Configuration & Code Updates): 1-2 hours
- **Phase 7** (Testing): 2-3 hours
- **Phase 8-10** (Compatibility & Docs): 1-2 hours

**Total**: 5-10 hours

---

## 📚 Additional Resources

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 16 Beta Blog Post](https://nextjs.org/blog/next-16-beta)
- [Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)
- [Clerk Next.js Compatibility](https://clerk.com/docs/quickstarts/nextjs) (check for Next.js 16 updates)
- [Sentry Next.js Compatibility](https://docs.sentry.io/platforms/javascript/guides/nextjs/) (check for Next.js 16 updates)
- [Turbopack Migration Guide](https://nextjs.org/docs/app/api-reference/next-config-js/turbopack)

---

## 📝 Summary

The codebase is **mostly ready** for Next.js 16. Main tasks:

1. ✅ Fix async params in category page
2. ✅ Fix async headers() call in contact form
3. ✅ Verify Clerk experimental import compatibility
4. ✅ Pin to Next.js 16.0.10+ (security)
5. ✅ Run automated codemod
6. ✅ Handle Turbopack default bundler (webpack migration plan)
7. ✅ Optionally migrate middleware to proxy
8. ✅ Update image config defaults if needed
9. ✅ Test thoroughly (especially build + start)

The upgrade should be **straightforward** with minimal breaking changes. Most routes already handle async params correctly, and there are no deprecated features in use.

---

**Status**: Ready for implementation. Follow phases sequentially and test at each checkpoint.
