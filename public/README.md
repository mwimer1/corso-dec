---
title: "Public"
description: "Documentation and resources for documentation functionality."
last_updated: "2025-12-29"
category: "documentation"
status: "draft"
---
# 🗂️ Public Static Assets

> **AI Context**: Static assets served directly by Next.js at root URL. Includes brand assets, SEO files, test utilities, demo images, and reference materials. All files accessible via direct URLs (e.g., `/logo.svg`).

## 📋 Quick Reference

**Purpose**: Static assets served without Next.js processing, optimized for CDN delivery and global distribution.

**Key Characteristics:**
- **Direct Access**: Files served at root URL without bundling
- **CDN Optimized**: Automatic global caching via Vercel Edge Network
- **No Processing**: Served as-is, no Next.js build pipeline
- **Performance**: HTTP/2, compression, immutable caching headers

---

## 📁 Directory Structure

```
public/
├── robots.txt                     # SEO crawling rules (174B)
├── mockServiceWorker.js           # MSW v2.11.1 for testing (8.7KB)
├── .gitkeep                       # Git directory tracking
├── demos/                         # [DEPRECATED] Demo images moved to Supabase CDN
└── Reference/                     # Design & brand reference
    └── IconSVG.svg                # Icon component library (230KB)
```

---

## 🎨 Brand Assets

### Logo (CDN Hosted)
- **Size**: 230KB
- **Format**: SVG (scalable vector graphics)
- **Usage**: Primary brand mark for headers, landing pages
- **Location**: Supabase CDN (`/brand/logo.svg`)
- **Performance**: Global CDN distribution

```tsx
// ✅ RECOMMENDED: Use centralized brand assets
import { BrandAssets } from '@/lib/shared';
import Image from 'next/image'

<Image
  src={BrandAssets.logo}
  alt="Corso Data Platform"
  width={120}
  height={40}
  priority // Critical for LCP
/
```

### Favicon (CDN Hosted)
- **Size**: 31KB
- **Format**: ICO (multi-resolution: 16x16, 32x32, 48x48)
- **Purpose**: Browser tabs, bookmarks, PWA icons
- **Location**: Supabase CDN (`/brand/favicon.ico`)
- **Performance**: Global CDN distribution

```tsx
// ✅ RECOMMENDED: Use centralized brand assets
import { BrandAssets } from '@/lib/shared';

// In app/layout.tsx metadata
export const metadata = {
  icons: {
    icon: BrandAssets.favicon,
    shortcut: BrandAssets.favicon,
    apple: BrandAssets.favicon,
  },
};
```

---

## 🤖 SEO & Technical Files

### Robots.txt
- **Size**: 174 bytes
- **Purpose**: Search engine crawling permissions
- **Content**: Allows major crawlers (Google, Bing, Twitter, Facebook)

```txt
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
```

### Mock Service Worker (`mockServiceWorker.js`)
- **Size**: 8.7KB
- **Version**: MSW v2.11.1
- **Purpose**: API mocking for development and testing
- **Usage**: Powers test environments and development mocks

```typescript
// Development setup
if (process.env.NODE_ENV === 'development') {
  require('/mockServiceWorker.js')
}
```

---

## 🖼️ Demo Assets (External CDN)

Interface screenshots are now hosted on Supabase Storage for optimal performance and global distribution:

| File | Purpose | Format | CDN URL |
|------|---------|--------|---------|
| `companies-interface.png` | Companies dashboard demo | PNG | `{NEXT_PUBLIC_ASSETS_BASE}/demos/companies-interface.png` |
| `projects-interface.png` | Projects dashboard demo | PNG | `{NEXT_PUBLIC_ASSETS_BASE}/demos/projects-interface.png` |
| `addresses-interface.png` | Addresses dashboard demo | PNG | `{NEXT_PUBLIC_ASSETS_BASE}/demos/addresses-interface.png` |
| `corso-ai-interface.png` | CorsoAI interface demo | PNG | `{NEXT_PUBLIC_ASSETS_BASE}/demos/corso-ai-interface.png` |

```tsx
// ✅ RECOMMENDED: Use centralized CDN asset map
import { DemoImages } from '@/lib/shared/assets/cdn';

<Image
  src={DemoImages.projects}
  alt="Projects Interface Demo"
  width={960}
  height={540}
  // Next.js automatically optimizes external images
/
```

### CDN Configuration

- **Provider**: Supabase Storage (public bucket)
- **Base URL**: `NEXT_PUBLIC_ASSETS_BASE` environment variable
- **CSP**: Host allowed in `CSP_IMG_DOMAINS`
- **Next.js**: Remote patterns configured in `next.config.mjs`

---

## 📚 Reference Materials (`Reference/`)

Internal design and development assets:

| File | Purpose | Format | Size |
|------|---------|--------|------|
| `IconSVG.svg` | Icon component library | SVG | 230KB |

**Note**: Insights placeholder images now use demo images from the product showcase for consistent branding.

---

## ⚡ Performance & Optimization

### Asset Delivery
- **CDN**: Vercel Edge Network global distribution
- **Compression**: Automatic Gzip/Brotli
- **HTTP/2**: Multiplexed delivery
- **Caching**: Immutable headers for static assets

### Size Monitoring

| Category | Total Size | Target | Status |
|----------|------------|--------|--------|
| **Core Assets** | ~9KB | <500KB | ✅ Good |
| **Demo Images** | External CDN | N/A | ✅ Optimized |
| **Reference** | ~230KB | <1MB | ✅ Good |
| **All Assets** | ~239KB | <5MB | ✅ Excellent |

### Next.js Image Usage Patterns

```tsx
// ✅ BRAND ASSETS: Use centralized CDN assets
import { BrandAssets } from '@/lib/shared/assets';

<Image
  src={BrandAssets.logo}
  alt="Corso"
  width={120}
  height={40}
  // Next.js automatically optimizes external images
/>

// ✅ OG IMAGES: Build absolute URLs
export async function GET(req: Request) {
  const imageUrl = new URL('/demos/projects-interface.png', req.url)
  return new ImageResponse(<img src={imageUrl.toString()} />, { ... })
}
```

---

## 🔄 Asset Management

### Adding New Assets
1. **Demo Images**: Upload to Supabase Storage public bucket
2. **Local Assets**: Optimize first, compress images, minify SVGs
3. **Format Selection**: WebP/PNG for photos, SVG for vectors
4. **Size Limits**: Keep under recommended targets
5. **Documentation**: Update this README and CDN asset map

### Best Practices
- ✅ **Use CDN** for demo/marketing images (Supabase Storage)
- ✅ **Use WebP** with PNG fallbacks for images
- ✅ **Compress assets** before committing
- ✅ **Update README** when adding/removing files
- ✅ **Use centralized asset map** (`@/lib/shared/assets`)
- ✅ **Use unoptimized** prop for Next.js Image with /public paths
- ❌ **Don't commit** uncompressed assets
- ❌ **Don't use** /public for dynamic content
- ❌ **Don't hardcode** image URLs (use asset map)

---

## 🎯 Key Takeaways

- **Static Serving**: Direct URL access without Next.js processing
- **Global CDN**: Automatic edge distribution and caching
- **Performance First**: Optimized compression and delivery
- **Brand Consistency**: Centralized logo and identity assets
- **SEO Ready**: Proper robots.txt and favicon configuration

## 📚 Related Documentation

- [Next.js Static Files](https://nextjs.org/docs/basic-features/static-file-serving)
- [MSW Documentation](https://mswjs.io/docs/)

## 🏷️ Tags

`#static-assets` `#favicon` `#logo` `#seo` `#robots-txt` `#cdn` `#performance` `#msw` `#demo-assets`

---

_Last updated: 2025-09-10_
