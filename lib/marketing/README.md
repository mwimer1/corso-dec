---
last_updated: "2026-01-03"
category: "library"
status: "draft"
title: "Marketing"
description: "Core lib utilities and functionality for the Corso platform. Located in marketing/."
---
# Marketing Library (`lib/marketing/`)

Core utilities and services for marketing pages, insights/blog content, and landing page features.

## 📁 Directory Structure

```
lib/marketing/
├── client.ts              # Client-safe barrel (ROI, use cases)
├── server.ts              # Server-only barrel (insights content service)
├── roi.ts                 # Pure ROI calculation utilities (edge-safe)
└── insights/              # Insights/blog content management system
    ├── content-service.ts # Main service interface (unified source selector)
    ├── content-loader.ts  # Markdown file loader (reads from content/insights/articles/)
    ├── source.ts          # Source selector (mock/legacy/directus adapter selection)
    ├── legacy-adapter.ts  # Legacy markdown/static content adapter
    ├── mockcms-adapter.ts # Mock CMS adapter (reads from public/__mockcms__/)
    ├── directus-adapter.ts # Directus adapter stub (⚠️ NOT YET IMPLEMENTED)
    └── static-data.ts     # Static fallback data (10 hardcoded articles)
```

## 🎯 Purpose

This directory provides:

1. **Client-safe utilities** (`client.ts`): ROI calculator, use case schemas
2. **Server-only services** (`server.ts`): Insights content fetching, category management
3. **Content source abstraction**: Unified interface for multiple content sources (markdown files, mock CMS, Directus)

## 📦 Exports

### Client-Safe (`@/lib/marketing/client`)

```typescript
// ROI Calculator
import { calcRoi, clamp } from '@/lib/marketing/client';

// Use Cases (types and validation)
import { zUseCaseMap, type UseCase, type UseCaseKey } from '@/lib/marketing/client';
```

### Server-Only (`@/lib/marketing/server`)

```typescript
// Insights content service
import { 
  getAllInsights, 
  getInsightBySlug, 
  getCategories, 
  getInsightsByCategory,
  getRelatedInsights,
  categorySlugify 
} from '@/lib/marketing/server';
```

## 🔄 Content Source Selection

The insights content system supports multiple content sources via a unified interface:

### Source Priority

1. **Mock CMS** (`CORSO_USE_MOCK_CMS=true`): Reads from `public/__mockcms__/` directory
   - Default in development (unless explicitly disabled)
   - Default false in production (unless explicitly enabled)

2. **Directus CMS** (`CORSO_CMS_PROVIDER=directus`): 
   - ⚠️ **NOT YET IMPLEMENTED** - Will throw error if selected
   - Requires `DIRECTUS_URL` and `DIRECTUS_TOKEN` environment variables

3. **Legacy Adapter** (default): 
   - Tries to load from `content/insights/articles/*.md` files
   - Falls back to static data in `static-data.ts` if no markdown files found

### Environment Variables

- `CORSO_USE_MOCK_CMS`: Enable mock CMS (default: true in dev, false in prod)
- `CORSO_CMS_PROVIDER`: Set to `"directus"` to use Directus (not yet implemented)
- `DIRECTUS_URL`: Directus instance URL (required for Directus adapter)
- `DIRECTUS_TOKEN`: Directus authentication token (required for Directus adapter)
- `INSIGHTS_SOURCE`: Legacy env var (deprecated, may be removed)

## 📝 Content Management

### Markdown Files

Place markdown files in `content/insights/articles/` with frontmatter:

```markdown
---
slug: my-article
title: My Article Title
description: Article description
publishDate: 2025-01-01T00:00:00Z
categories:
  - slug: technology
    name: Technology
author:
  name: Author Name
  avatar: https://example.com/avatar.jpg
status: published
---

Article content in markdown...
```

### Mock CMS

Place JSON files in `public/__mockcms__/`:
- `insights/index.json`: Array of `InsightPreview` objects
- `insights/{slug}.json`: Single `InsightItem` object
- `categories/index.json`: Array of `{ slug: string, name: string }` objects

### Static Data

Fallback content is hardcoded in `static-data.ts`. This is used when:
- No markdown files are found in `content/insights/articles/`
- Mock CMS is disabled and no other source is available

## 🚨 Known Issues

1. **Directus Adapter**: Not yet implemented. Setting `CORSO_CMS_PROVIDER=directus` will throw an error.
2. **Legacy Env Var**: `INSIGHTS_SOURCE` is checked but not documented. Consider removing or documenting.

## 🔗 Related Files

- **Components**: `components/insights/` - UI components for insights pages
- **Types**: `types/marketing/` - TypeScript types and schemas
- **Routes**: `app/(marketing)/insights/` - Next.js routes for insights pages

## 📚 Migration Notes

- `image-resolver.ts` moved to `components/insights/utils/image-resolver.ts` (client-safe, only used by insights components)
- `use-cases.ts` moved to `types/marketing/use-cases.ts` (types should live in `types/`)
