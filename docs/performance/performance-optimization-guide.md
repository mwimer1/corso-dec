---
status: "draft"
last_updated: "2026-01-04"
category: "documentation"
title: "Performance"
description: "Documentation and resources for documentation functionality. Located in performance/."
---
# Performance Optimization Guide

> **Complete guide to performance optimization, bundle size management, database query optimization, and performance monitoring.**

## 📋 Quick Reference

**Key Commands:**
```bash
# Analyze bundle size
pnpm bundlesize

# Analyze bundle size for CI
pnpm bundlesize:ci

# Run bundle analyzer (visual)
ANALYZE=true pnpm build

# Run Lighthouse performance audit
pnpm dlx @lhci/cli autorun --collect.url=http://localhost:3000/
```

## 🎯 Performance Goals

### Bundle Size Targets
- **Total Bundle (Brotli)**: < 300KB
- **Per File (Brotli)**: < 100KB
- **Initial Load**: < 200KB (gzipped)

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Database Performance
- **Query Time**: < 100ms (p95)
- **Connection Pool**: Optimized for concurrent requests
- **Caching**: 5-60 minutes based on data freshness needs

## 📦 Bundle Size Management

### Bundle Size Analysis

The project includes automated bundle size monitoring:

```bash
# Check current bundle size
pnpm bundlesize

# CI-friendly JSON output
pnpm bundlesize:ci > bundle-size-report.json
```

**Configuration**: `scripts/ci/bundle-size.config.json`
- Monitors `.next/static/chunks/` directory
- Excludes test files, stories, and locale files
- Reports Gzip and Brotli compression sizes
- Fails CI if limits exceeded

**CI Integration**: Bundle size checks run automatically on every PR:
- Compares PR branch bundle size against main branch
- Generates comparison report as PR comment
- Includes JavaScript and CSS files from build output

### CSS Size Analysis

CSS size monitoring prevents Tailwind CSS bundle bloat:

```bash
# Check generated CSS file size
pnpm a11y:css-size
```

**Configuration**: `scripts/lint/css-size-analyzer.ts`
- Monitors `styles/build/tailwind.css` file
- Maximum allowed size: 150KB
- Fails if threshold exceeded

**CI Integration**: CSS size check runs automatically on every PR:
- Validates generated Tailwind CSS file size
- Ensures styling changes don't cause CSS bloat
- Part of PR checks workflow (`.github/workflows/pr-checks.yml`)

### Bundle Analyzer

Visual bundle analysis using `@next/bundle-analyzer`:

```bash
# Generate visual bundle report
ANALYZE=true pnpm build
```

This opens an interactive treemap showing:
- Largest dependencies
- Code splitting effectiveness
- Duplicate code detection
- Optimization opportunities

### Optimization Strategies

#### 1. Code Splitting

**Route-Based Splitting (Automatic)**
Next.js automatically splits code by route. Ensure proper route boundaries:

```typescript
// ✅ CORRECT: Separate route files
app/
  dashboard/
    page.tsx      // Loaded on /dashboard
    chat/
      page.tsx    // Loaded on /dashboard/chat
```

**Component-Based Splitting (Manual)**
Use dynamic imports for large components:

```typescript
// ✅ CORRECT: Dynamic import for large components
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ContactForm = dynamic(
  () => import('@/components/forms').then(m => m.ContactForm),
  {
    loading: () => <div>Loading form...</div>,
    ssr: false, // If component doesn't need SSR
  }
);

export function ContactPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactForm />
    </Suspense>
  );
}
```

#### 2. Tree Shaking

**Ensure Proper Exports**
```typescript
// ✅ CORRECT: Named exports for tree shaking
export { ComponentA } from './component-a';
export { ComponentB } from './component-b';

// ❌ INCORRECT: Default export barrel (prevents tree shaking)
export default { ComponentA, ComponentB };
```

**Avoid Side Effects**
```typescript
// ✅ CORRECT: Pure imports
import { utility } from '@/lib/utils';

// ❌ INCORRECT: Side-effect imports
import '@/lib/side-effects'; // Runs code on import
```

#### 3. Dependency Optimization

**Audit Large Dependencies**
```bash
# Check dependency sizes
pnpm dlx bundlephobia [package-name]

# Find duplicate dependencies
pnpm dlx npm-check-duplicates
```

**Replace Heavy Libraries**
- Use lighter alternatives when possible
- Import only needed functions from large libraries
- Consider polyfills for modern features

#### 4. Image Optimization

**Next.js Image Component**
```typescript
import Image from 'next/image';

// ✅ CORRECT: Optimized image loading
<Image
  src="/logo.svg"
  alt="Logo"
  width={120}
  height={40}
  priority // For above-the-fold images
  loading="lazy" // For below-the-fold images
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**Image Formats**
- **AVIF/WebP**: Modern formats (configured in `next.config.mjs`)
- **SVG**: For icons and logos
- **PNG**: Fallback for older browsers

**CDN Usage**
- Use Supabase CDN for demo/marketing images
- Configure remote patterns in `next.config.mjs`
- Leverage automatic optimization

## 🗄️ Database Query Optimization

### Query Patterns

#### 1. Pagination
Always use pagination for large datasets:

```typescript
// ✅ CORRECT: Paginated queries
const data = await queryEntityData(
  `SELECT * FROM projects LIMIT ${pageSize} OFFSET ${offset}`,
  {}
);
```

#### 2. Parameterized Queries
Prevent SQL injection and enable query caching:

```typescript
// ✅ CORRECT: Parameterized queries
const sql = `SELECT * FROM projects WHERE status = {status:String}`;
const params = { status: 'active' };
const data = await queryEntityData(sql, params);

// ❌ INCORRECT: String interpolation
const sql = `SELECT * FROM projects WHERE status = '${status}'`;
```

#### 3. Selective Fields
Only fetch needed columns:

```typescript
// ✅ CORRECT: Select specific fields
SELECT id, name, status FROM projects

// ❌ INCORRECT: Select all fields
SELECT * FROM projects
```

#### 4. Indexing
Ensure proper database indexes:
- Primary keys (automatic)
- Foreign keys
- Frequently queried columns
- Sort columns

### Caching Strategy

**React Query Caching**
```typescript
// ✅ CORRECT: Appropriate stale times
const { data } = useWarehouseQueryCached(
  ['projects', filters],
  'SELECT * FROM projects WHERE status = ?',
  { staleTime: 5 * 60 * 1000 } // 5 minutes
);
```

**Cache Key Strategy**
- Use stable, specific keys
- Include filter parameters in keys
- Avoid overly broad keys

## 🖼️ Frontend Performance

### React Optimization

#### 1. Memoization
```typescript
// ✅ CORRECT: Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ CORRECT: Memoize callbacks
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);
```

#### 2. Component Splitting
Split large components into smaller, focused components:

```typescript
// ✅ CORRECT: Small, focused components
function Dashboard() {
  return (
    <>
      <DashboardHeader />
      <DashboardContent />
      <DashboardFooter />
    </>
  );
}
```

#### 3. Lazy Loading
```typescript
// ✅ CORRECT: Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Image Loading

**Priority Loading**
```typescript
// Above-the-fold images
<Image src="/hero.jpg" priority />

// Below-the-fold images
<Image src="/content.jpg" loading="lazy" />
```

**Responsive Images**
```typescript
<Image
  src="/image.jpg"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  width={1200}
  height={800}
/>
```

### Font Optimization

**Next.js Font Optimization**
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Automatically optimized:
// - Self-hosted
// - Preloaded
// - Font-display: swap
```

## 📊 Performance Monitoring

### Bundle Size Monitoring

**CI Integration**
Bundle size checks run automatically in CI:
- `.github/workflows/pr-checks.yml` - Bundle size analysis
- Fails PR if limits exceeded
- Reports size changes vs base branch

**Manual Monitoring**
```bash
# Generate bundle report
pnpm bundlesize:ci > bundle-report.json

# Compare with previous build
pnpm -s bundlesize:report --current=bundle-size-current.json --base=bundle-size-base.json
```

### Lighthouse CI

**Automated Performance Audits**
Lighthouse CI runs on every PR:
- Core Web Vitals measurement
- Performance score tracking
- Accessibility and SEO checks

**Local Testing**
```bash
# Run Lighthouse locally
pnpm dlx @lhci/cli autorun \
  --collect.startServerCommand="pnpm start" \
  --collect.url=http://localhost:3000/
```

### Database Metrics

**Performance Tracking**
Database query performance is tracked via:
- `lib/server/performance/database-metrics.ts`
- Query execution time logging
- Connection pool monitoring

**Metrics Collected**
- Query execution time
- Row count
- Connection pool usage
- Error rates

## 🔧 Optimization Checklist

### Before Committing
- [ ] Bundle size within limits (`pnpm bundlesize`)
- [ ] No large dependencies added
- [ ] Images optimized and using Next.js Image
- [ ] Database queries use pagination
- [ ] React components properly memoized
- [ ] Lazy loading for heavy components

### Performance Review
- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Bundle size < 300KB (Brotli)
- [ ] Database queries < 100ms (p95)

## 🚨 Common Performance Issues

### Bundle Size Issues

**Problem**: Bundle size exceeds limits
**Solutions**:
1. Use dynamic imports for large components
2. Remove unused dependencies
3. Split code by route/feature
4. Use tree shaking-friendly imports

### Slow Database Queries

**Problem**: Queries taking > 100ms
**Solutions**:
1. Add proper indexes
2. Use pagination
3. Cache frequently accessed data
4. Optimize SQL queries
5. Use connection pooling

### Slow Page Loads

**Problem**: LCP > 2.5s
**Solutions**:
1. Optimize images (use Next.js Image)
2. Preload critical resources
3. Use font optimization
4. Minimize render-blocking resources
5. Enable compression (Gzip/Brotli)

### Layout Shifts

**Problem**: CLS > 0.1
**Solutions**:
1. Set explicit image dimensions
2. Reserve space for dynamic content
3. Avoid inserting content above existing content
4. Use CSS aspect-ratio for images

## 📚 Related Documentation

- [Monitoring Guide](../monitoring/monitoring-guide.md) - Performance monitoring and metrics collection
- [Operational Guide](../operations/operational-guide.md) - Production deployment and optimization
- [Testing Strategy](../testing-quality/testing-strategy.md) - Performance testing patterns
- [Bundle Size Configuration](../../scripts/ci/bundle-size.config.json) - Bundle size limits
- [Next.js Configuration](../../config/next.config.mjs) - Build optimization settings
- [Database Queries](../../docs/analytics/warehouse-query-hooks.md) - Query patterns

## 🏷️ Tags

`#performance` `#optimization` `#bundle-size` `#database` `#frontend` `#monitoring` `#lighthouse` `#core-web-vitals`

---

Last updated: 2025-01-15
