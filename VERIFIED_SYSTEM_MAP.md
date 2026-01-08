# Verified System Map — Insights Routes & Components

**Generated:** 2026-01-07  
**Branch:** `main`  
**Git Status:** Modified `scripts/maintenance/docs/autopublish.ts`

## Git Context

```bash
# Branch
main

# Status
## main...origin/main
 M scripts/maintenance/docs/autopublish.ts

# Recent commits (last 15)
f20bd28 (HEAD -> main, origin/main, origin/HEAD) chore(docs): update autopublish script
6d81e0c fix(docs): remove invalid --quiet flag from git add in autopublish
2eb358c fix(docs): enable shell mode for Windows in autopublish script
8a07af0 feat(docs): add one-click docs auto-publish to main
b461dbf fix(infrastructure): improve orphan detector import & execution detection (pass3c)
0ba23ef docs(deps): update husky hook performance numbers and fix cursor rule
ec5c9cf perf(husky): fail-fast gates + staged-only checks + receipts
5cc67ba test: verify hooks
d5c3f45 docs(husky): update hook documentation
bb57264 chore(infrastructure): promote 2 manual utility scripts to official entrypoints (pass3d)
0443c18 fix(docs): fix broken markdown links and Windows markdownlint wrapper
4a8cc6c chore(infrastructure): delete 2 verified-orphan files (pass3b)
7540198 docs: update documentation files
f998d90 fix(components): equal-height two-column layout for use case explorer
676946c chore: update orphan audit script
```

## Route Structure

### Index Route
**File:** `app/(marketing)/insights/page.tsx`  
**Path:** `/insights`  
**Runtime:** `nodejs`  
**Features:**
- Hero section with `InsightsHero` component
- Category filter (client component wrapped in Suspense)
- Uses `getAllInsights()` and `getCategories()` from `@/lib/marketing/server`

### Detail Route
**File:** `app/(marketing)/insights/[slug]/page.tsx`  
**Path:** `/insights/[slug]`  
**Runtime:** `nodejs`  
**Revalidate:** `300` (5 minutes ISR)  
**Features:**
- Dynamic metadata generation via `generateMetadata()`
- Uses `getInsightBySlug(slug)` and `getRelatedInsights(item, { limit: 3 })`
- Renders `InsightDetail` component with breadcrumbs
- JSON-LD structured data (Article + BreadcrumbList)
- Reading progress indicator enabled (`showReadingProgress={true}`)

### Category Route
**File:** `app/(marketing)/insights/categories/[category]/page.tsx`  
**Path:** `/insights/categories/[category]`  
**Runtime:** `nodejs`  
**Param Name:** `category` (not `slug`)  
**Features:**
- Uses `getInsightsByCategory({ slug: category, page: 1, pageSize: 1000 })`
- Renders `InsightsList` with filtered insights
- Analytics tracking via `trackEvent('category_result_click', ...)`

## Key Components

### InsightDetail
**File:** `components/insights/sections/insight-detail.tsx`  
**Type:** Client component (`"use client"`)  
**Key Features:**
- Renders article body with DOMPurify sanitization
- Integrates `useArticleAnalytics` hook for tracking
- Includes `InsightHeaderBlock`, `TableOfContents`, `BackToTopButton`, `RelatedArticles`
- Content sanitization with DOMPurify (allows H1-H6, p, ul, ol, li, a, strong, em, code, pre, blockquote, br, hr, div, span, img)
- Removes duplicate "Key takeaways" sections from HTML when `keyTakeaways` prop exists

### TableOfContents
**File:** `components/insights/widgets/table-of-contents.tsx`  
**Type:** Client component (`"use client"`)  
**Features:**
- Extracts H2 and H3 headings from article content
- Desktop: sticky aside on right (`lg:block`, `sticky top-24`)
- Mobile: collapsible dropdown (`lg:hidden`)
- Smooth scrolling with 80px offset for sticky header
- Updates URL hash on click without triggering scroll
- Returns `null` if no headings found (no empty TOC)

### InsightCard
**File:** `components/insights/insight-card.tsx`  
**Type:** Server/client component (no directive)  
**Used by:** `InsightsList` component

### InsightsList
**File:** `components/insights/sections/insights-list.tsx`  
**Type:** Client component (`"use client"`)  
**Features:**
- Renders grid of `InsightCard` components
- Handles loading state with `ContentListSkeleton`
- Empty state with optional `onClearFilters` handler
- Supports `onResultClick` callback for analytics tracking

### CopyLinkButton
**File:** `components/insights/widgets/article-utilities.tsx`  
**Type:** Client component (`"use client"`)  
**Features:**
- Copies article URL to clipboard
- Success feedback (shows "Copied" for 2 seconds)
- Positioned absolutely in `InsightHeaderBlock` (top-right corner)
- Variants: `"header"` (absolute positioning) or `"inline"`

### BackToTopButton
**File:** `components/insights/widgets/article-utilities.tsx`  
**Type:** Client component (`"use client"`)  
**Features:**
- Fixed position button (`fixed bottom-6 right-6`)
- Appears after scrolling 400px
- Smooth scroll to top
- Includes focus ring styles (`focus-visible:ring-2 focus-visible:ring-ring`)

### InsightHeaderBlock
**File:** `components/insights/widgets/insight-header-block.tsx`  
**Type:** Client component (`"use client"`)  
**Features:**
- **"Back to Insights" link** at line 74-85:
  - Text: `"Back to Insights"` (exact match)
  - Href: `backHref` prop (defaults to `/insights`)
  - Uses Next.js `Link` component
  - Classes: `"inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"`
  - **Focus ring:** Not explicitly added (may need verification in browser)
- Includes category badges, title, metadata, and hero image
- Copy link button positioned absolutely in top-right

## Utilities & Hooks

### useArticleAnalytics
**File:** `components/insights/hooks/use-article-analytics.ts`  
**Type:** Client hook (`"use client"`)  
**Features:**
- Tracks `insight_view` event on mount
- Tracks `insight_scroll_depth` at 25%, 50%, 75%, 100%
- Tracks `insight_time_on_page` at 30s and 120s
- Extracts UTM params for attribution
- Uses debounced scroll tracking (100ms)

### Content Service Functions
**File:** `lib/marketing/server.ts` (re-exports from `lib/marketing/insights/content-service.ts`)  
**Type:** Server-only (`'server-only'`)  
**Functions:**
- `getAllInsights(): Promise<InsightPreview[]>`
- `getInsightBySlug(slug: string): Promise<InsightItem | undefined>`
- `getInsightsByCategory({ slug, page, pageSize }): Promise<{ items, total, category }>`
- `getRelatedInsights(item, { limit }): Promise<InsightPreview[]>`
- `getCategories(): Promise<Array<{ slug: string; name: string }>>`

### Sanitization
**File:** `components/insights/sections/insight-detail.tsx` (lines 58-126)  
**Library:** DOMPurify  
**Config:**
- Allowed tags: `p`, `h1-h6`, `ul`, `ol`, `li`, `a`, `strong`, `em`, `code`, `pre`, `blockquote`, `br`, `hr`, `div`, `span`, `img`
- Allowed attributes: `href`, `target`, `rel`, `class`, `src`, `alt`, `title`, `id`
- Security: Adds `rel="noopener noreferrer nofollow ugc"` to `target="_blank"` links
- Forbidden: `script`, `style` tags

## Current Behavior Observations (Code Review)

### TOC Behavior
- **Empty TOC:** Component returns `null` if no headings found (line 71-73 in `table-of-contents.tsx`)
- **Smooth scroll:** Implemented with `window.scrollTo({ behavior: "smooth" })` and 80px offset (line 84-86)

### "Back to Insights" Link
- **Location:** `InsightHeaderBlock` component (line 74-85)
- **Focus ring:** Not explicitly added via `focus-visible:ring-*` classes in Link component
- **Current classes:** `text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group`
- **Note:** May inherit focus styles from global CSS or Link component wrapper

### Article Body Links
- **Styling:** Uses Tailwind prose classes:
  - `prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-colors` (line 182)
- **Underline behavior:** No underline by default (`no-underline`), shows on hover (`hover:prose-a:underline`)

### Category Page Analytics
- **Implementation:** `handleResultClick` function in category page (lines 26-28) calls `trackEvent('category_result_click', { slug, position, category })`
- **Wiring:** Passed to `InsightsList` component via `onResultClick` prop

## Mismatches & Notes

### Expected vs Actual
✅ **All routes found:** Index, detail, and category routes confirmed  
✅ **All components found:** InsightDetail, TableOfContents, InsightCard, InsightsList, CopyLinkButton, BackToTopButton, useArticleAnalytics  
✅ **All utilities found:** getInsightBySlug, getAllInsights, getInsightsByCategory, getRelatedInsights  
✅ **Sanitization confirmed:** DOMPurify used in InsightDetail  
✅ **"Back to Insights" link confirmed:** Located in InsightHeaderBlock, exact text match  
⚠️ **Category param:** Uses `[category]` (not `[slug]`) — matches expected behavior  
⚠️ **Focus ring on "Back to Insights":** Not explicitly visible in code — needs browser verification  
⚠️ **TOC smooth scroll:** Implemented but needs browser verification  
⚠️ **Article link underlines:** Currently no underline by default, shows on hover — matches expected "no underline without hover" observation

## Next Steps

1. **Browser verification required for:**
   - TOC empty state behavior
   - "Back to Insights" focus ring visibility
   - TOC heading smooth scroll functionality
   - Article body link underline behavior

2. **Code changes (if needed):**
   - Add explicit focus ring to "Back to Insights" link if missing
   - Verify TOC extraction logic handles edge cases
   - Confirm article link styling matches design requirements
