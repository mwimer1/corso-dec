# Insights Detail Layout & Spacing Audit — Context Pack

**Generated:** Context-building audit for Insights detail page layout alignment issues  
**Page:** `/app/(marketing)/insights/[slug]/page.tsx`  
**Component:** `components/insights/sections/insight-detail.tsx`

---

## A) Files Involved

| File Path | Purpose |
|-----------|---------|
| `app/(marketing)/insights/[slug]/page.tsx` | Route component that wraps `InsightDetail` in `PublicLayout` |
| `components/ui/organisms/public-layout.tsx` | Layout wrapper providing navbar container (`containerWithPaddingVariants`) |
| `components/ui/organisms/navbar/navbar.tsx` | Navbar component (nested inside `PublicLayout` header container) |
| `components/insights/sections/insight-detail.tsx` | Main article component with hero card, content, and TOC layout |
| `components/insights/widgets/table-of-contents.tsx` | TOC component (mobile dropdown + desktop sticky sidebar) |
| `components/insights/widgets/insight-header-block.tsx` | Hero card component (title, metadata, image, categories) |
| `components/insights/widgets/article-metadata.tsx` | Metadata row component (date, reading time, author) |
| `components/insights/widgets/article-utilities.tsx` | Copy link button (absolute positioned in hero card) |
| `styles/ui/shared/container-helpers.ts` | Container padding utilities (`containerWithPaddingVariants`) |
| `styles/ui/shared/container-base.ts` | Max-width utilities (`containerMaxWidthVariants`) |

---

## B) Key Excerpts

### B.1) Navbar Container/Wrapper

**File:** `components/ui/organisms/public-layout.tsx` (lines 84-90)

```tsx
<header
  role="banner"
  data-sticky-nav
  data-scrolled={scrolled ? 'true' : 'false'}
  className={cn(
    stickyHeader
      ? "sticky top-0 z-50 border-b border-border bg-surface transition-shadow data-[scrolled=true]:shadow-sm"
      : "relative",
  )}
>
  <div className={cn(containerWithPaddingVariants({ maxWidth: "7xl", padding: "lg" }))}>
    <Navbar 
      mode={navMode} 
      {...(navItems && { items: navItems })}
      {...(navMode === "insights" || navMode === "landing" ? { forceShowCTAs: true } : {})}
    />
  </div>
```

**Container Classes Applied:**
- `containerWithPaddingVariants({ maxWidth: "7xl", padding: "lg" })` → 
  - `max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8`

---

### B.2) Insights Detail Page Layout Wrapper

**File:** `app/(marketing)/insights/[slug]/page.tsx` (lines 175-201)

```tsx
return (
  <>
    {/* JSON-LD structured data */}
    <PublicLayout
      navMode="insights"
      navItems={getInsightsNavItems()}
      showReadingProgress={true}
    >
      <div className="py-8">
        <InsightDetail
          initialData={item}
          relatedArticles={relatedArticles}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Insights', href: '/insights' },
            { label: item.title, href: `/insights/${slug}` },
          ]}
        />
      </div>
    </PublicLayout>
  </>
);
```

**Note:** The page wraps `InsightDetail` in a `div` with `py-8` (vertical padding only). No horizontal container applied at page level.

---

### B.3) InsightDetail Container & Layout Grid

**File:** `components/insights/sections/insight-detail.tsx` (lines 235-354)

```tsx
return (
  <div
    ref={ref}
    className={cn(
      // Outer container: matches navbar/footer margins (7xl with lg padding)
      containerWithPaddingVariants({ maxWidth: "7xl", padding: "lg" }),
      className,
    )}
    {...rest}
  >
    {/* Desktop: Flex layout with article and TOC side by side */}
    <div className="lg:flex lg:items-start lg:gap-8">
      <article
        className={cn(
          // Inner container: max-w-3xl for optimal article readability
          containerMaxWidthVariants({ maxWidth: '3xl', centered: false }),
          "lg:flex-1 lg:min-w-0 lg:max-w-3xl",
          // ... prose styles ...
        )}
      >
        <InsightHeaderBlock ... />
        {/* Key takeaways block */}
        {/* Mobile TOC */}
        {/* Article content */}
      </article>

      {/* Desktop Table of Contents - Sticky sidebar outside article column */}
      <TableOfContents content={sanitizedContent} variant="desktop" />
    </div>
    {/* Related Articles section */}
  </div>
);
```

**Container Classes Applied:**
- **Outer:** `containerWithPaddingVariants({ maxWidth: "7xl", padding: "lg" })` → `max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8`
- **Flex container:** `lg:flex lg:items-start lg:gap-8`
- **Article:** `containerMaxWidthVariants({ maxWidth: '3xl', centered: false })` → `max-w-3xl` (no centering, relies on flex)

---

### B.4) TOC Card Component (Desktop Variant)

**File:** `components/insights/widgets/table-of-contents.tsx` (lines 160-197)

```tsx
{/* Desktop: Sticky aside */}
{showDesktop && (
  <aside
    className={cn(
      "hidden lg:block",
      "sticky top-24 self-start",
      "w-64 ml-8 xl:ml-12",
      "max-h-[calc(100vh-8rem)] overflow-y-auto",
      className
    )}
  >
    <nav 
      className="rounded-lg border border-border bg-muted/30 p-4"
      aria-labelledby="toc-heading"
    >
      <h2 id="toc-heading" className="text-sm font-semibold text-foreground mb-3">On this page</h2>
      <ul className="space-y-2">
        {/* TOC links */}
      </ul>
    </nav>
  </aside>
)}
```

**Key Classes:**
- `w-64` (256px fixed width)
- `ml-8 xl:ml-12` (left margin: 2rem / 32px on lg, 3rem / 48px on xl)
- `sticky top-24` (sticky positioning)
- **No right margin/padding** to align to container edge

---

### B.5) Hero Card Component (InsightHeaderBlock)

**File:** `components/insights/widgets/insight-header-block.tsx` (lines 57-146)

```tsx
<header
  className={cn(
    // Hero card container: rounded, border, calm B2B styling matching index hero feel
    "not-prose relative rounded-2xl border border-border bg-card shadow-sm",
    "p-6 sm:p-8 lg:p-10",
    "space-y-6 sm:space-y-8",
    className
  )}
>
  {/* Copy link button - positioned absolutely in top-right */}
  {articleUrl && (
    <CopyLinkButton url={articleUrl} variant="header" />
  )}

  {/* Eyebrow row: back + categories */}
  <div className="flex flex-wrap items-start gap-3 sm:gap-4">
    <nav aria-label="Back">
      <Link href={backHref} className="...">
        ← Back to Insights
      </Link>
    </nav>
    {categories && categories.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {/* Category badges */}
      </div>
    )}
  </div>

  {/* Desktop: Side-by-side layout (title/metadata left, image right) */}
  <div className="lg:flex lg:items-start lg:gap-12">
    {/* Title + metadata column */}
    <div className="flex-1 space-y-4 sm:space-y-5 lg:min-w-0">
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] text-foreground [text-wrap:balance]">
        {title}
      </h1>
      <ArticleMetadata ... />
    </div>

    {/* Hero image - desktop: right side, mobile: below title/metadata */}
    {heroImageUrl && (
      <div className="mt-6 lg:mt-0 lg:flex-shrink-0">
        <ArticleImage ... />
      </div>
    )}
  </div>
</header>
```

**Key Classes:**
- **Outer padding:** `p-6 sm:p-8 lg:p-10` (24px / 32px / 40px)
- **Internal spacing:** `space-y-6 sm:space-y-8` (24px / 32px vertical gap)
- **Eyebrow row:** `gap-3 sm:gap-4` (12px / 16px horizontal gap)
- **Title/metadata row:** `lg:flex lg:items-start lg:gap-12` (48px gap on desktop)

**Copy Link Button Positioning:**
- `absolute top-6 right-6 sm:top-8 sm:right-8 lg:top-10 lg:right-10`
- Positioned relative to hero card padding (not container edge)

---

### B.6) Metadata Row Component

**File:** `components/insights/widgets/article-metadata.tsx` (lines 75-168)

```tsx
<div
  className={cn(
    "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm text-muted-foreground",
    className
  )}
>
  {/* Date(s) + reading time */}
  <div className="flex items-center flex-wrap gap-3 sm:gap-4">
    {publishDate && (
      <time dateTime={publishDate} className="flex items-center gap-1.5">
        <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{formatArticleDate(publishDate)}</span>
      </time>
    )}
    {/* Updated date, reading time with separators */}
  </div>

  {/* Author */}
  {author?.name && (
    <>
      <span aria-hidden className="hidden sm:inline text-muted-foreground/40">•</span>
      <div className="flex items-center gap-2.5" itemProp="author" itemScope itemType="https://schema.org/Person">
        {/* Avatar + name */}
      </div>
    </>
  )}
</div>
```

**Key Classes:**
- **Container:** `flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4` (12px / 16px gap)
- **Inner row:** `gap-3 sm:gap-4` (12px / 16px gap)
- **Icon/text alignment:** `gap-1.5` (6px gap between icon and text)

---

## C) Layout Measurements / Tokens

### C.1) Container Width & Padding

| Component | Max Width | Horizontal Padding |
|-----------|-----------|-------------------|
| **Navbar container** | `max-w-7xl` (1280px) | `px-4 sm:px-6 lg:px-8` (16px / 24px / 32px) |
| **InsightDetail outer** | `max-w-7xl` (1280px) | `px-4 sm:px-6 lg:px-8` (16px / 24px / 32px) |
| **Article column** | `max-w-3xl` (768px) | None (uses flex-1, constrained by container) |

### C.2) TOC Dimensions & Spacing

| Property | Value |
|----------|-------|
| **TOC width** | `w-64` (256px fixed) |
| **Left margin** | `ml-8 xl:ml-12` (32px on lg, 48px on xl) |
| **Right margin** | None (no alignment mechanism) |
| **Gap between article and TOC** | `lg:gap-8` (32px) |

### C.3) Hero Card Spacing

| Area | Padding/Spacing |
|------|----------------|
| **Outer padding** | `p-6 sm:p-8 lg:p-10` (24px / 32px / 40px) |
| **Vertical rhythm** | `space-y-6 sm:space-y-8` (24px / 32px) |
| **Eyebrow row gap** | `gap-3 sm:gap-4` (12px / 16px) |
| **Title/metadata gap** | `lg:gap-12` (48px on desktop) |
| **Copy link button** | `top-6 right-6 sm:top-8 sm:right-8 lg:top-10 lg:right-10` (matches card padding) |

### C.4) Breakpoints

| Breakpoint | Viewport | Container Padding | TOC Margin |
|------------|----------|-------------------|------------|
| **Mobile** | < 640px | `px-4` (16px) | N/A (mobile TOC) |
| **sm** | 640px+ | `px-6` (24px) | N/A |
| **lg** | 1024px+ | `px-8` (32px) | `ml-8` (32px) |
| **xl** | 1280px+ | `px-8` (32px) | `ml-12` (48px) |

---

## D) Findings (Root Causes)

### D.1) TOC Right Alignment Issue (Primary)

**Root Cause:**
The TOC uses `ml-8 xl:ml-12` (left margin) but has **no right margin or alignment mechanism** to align its right edge to the container's right padding edge. The flex layout with `lg:gap-8` between article and TOC creates a fixed gap, but doesn't account for aligning the TOC to the container's right gutter.

**Technical Details:**
- **Navbar container:** `px-4 sm:px-6 lg:px-8` (32px right padding on lg+)
- **InsightDetail container:** Same as navbar (`px-4 sm:px-6 lg:px-8`)
- **Flex container:** `lg:flex lg:items-start lg:gap-8` (32px gap)
- **TOC:** `w-64 ml-8 xl:ml-12` (256px width, 32px/48px left margin)
- **Article:** `lg:flex-1 lg:min-w-0 lg:max-w-3xl` (flexible, max 768px)

**Problem:** The TOC's right edge is not constrained to align with the container's right padding. The flex layout allows the article to grow/shrink, but the TOC's fixed width + left margin doesn't guarantee it ends at the right gutter.

**Expected Behavior:**
At `lg` breakpoint (1024px+), the TOC should align its right edge with the navbar's right edge, which is 32px (`lg:px-8`) from the viewport edge.

**Current Behavior:**
The TOC's right edge is positioned based on: `container padding (32px) + article width (flexible, max 768px) + gap (32px) + TOC width (256px) + TOC left margin (32px)`, which does not guarantee alignment with the container's right padding edge.

---

### D.2) Hero Card Internal Spacing Inconsistencies

**Findings:**

1. **Copy link button positioning:**
   - Uses `absolute top-6 right-6 sm:top-8 sm:right-8 lg:top-10 lg:right-10`
   - Matches hero card padding (`p-6 sm:p-8 lg:p-10`)
   - **Issue:** The button is positioned relative to card padding, not container edge. At desktop, it's 40px (`lg:right-10`) from card edge, but the card itself may not align perfectly with container padding rhythm.

2. **Metadata row alignment:**
   - Uses `gap-3 sm:gap-4` (12px / 16px) for separators and items
   - Icons use `gap-1.5` (6px) between icon and text
   - **Issue:** Mixed gap sizes (12px, 16px, 6px) create visual inconsistency. The `gap-3` at mobile and `gap-4` at sm+ may not align perfectly with the card's internal padding rhythm (`p-6 sm:p-8 lg:p-10`).

3. **Vertical spacing rhythm:**
   - Hero card: `space-y-6 sm:space-y-8` (24px / 32px)
   - Title/metadata gap: `lg:gap-12` (48px on desktop)
   - **Issue:** The 48px gap on desktop (`lg:gap-12`) is not a multiple of the base spacing (24px or 32px), creating visual inconsistency.

---

### D.3) Container Alignment Consistency

**Finding:**
Both navbar and InsightDetail use `containerWithPaddingVariants({ maxWidth: "7xl", padding: "lg" })`, which should create identical horizontal gutters. However, the TOC's positioning within the flex layout does not respect this shared container padding.

**Additional Note:**
The page wrapper adds `py-8` (vertical padding only) but no horizontal container. This is correct, as `InsightDetail` applies its own container. However, any misalignment between navbar and page body would be visible at this level.

---

## E) Fix Options (High Level)

### Option 1: Use CSS Grid with Explicit Columns (Recommended)

**Approach:**
Replace the flex layout with CSS Grid, using explicit column definitions that account for container padding:
- Main column: `1fr` (flexible, max 768px via article)
- TOC column: `256px` (fixed)
- Use `grid-template-columns` with gap
- Add `justify-items: end` or use `margin-left: auto` on TOC to right-align it

**Pros:**
- Explicit control over column placement
- Can use `justify-items: end` or `margin-left: auto` to right-align TOC
- Clearer layout semantics
- Better responsive behavior with `grid-template-areas`

**Cons:**
- Requires refactoring flex layout to grid
- May need adjustments to responsive behavior
- Grid can be less intuitive than flex for some developers

**Risk:** Medium (requires layout refactor, needs responsive testing)

---

### Option 2: Unify Container Padding & Use Flex with Auto Margins

**Approach:**
Keep flex layout but:
- Ensure both navbar and page use identical container padding (already true)
- Remove TOC's `ml-8 xl:ml-12` margin
- Add `margin-left: auto` or `ml-auto` to TOC to push it to the right
- Adjust flex gap to account for desired spacing

**Pros:**
- Minimal changes to existing layout
- Uses standard flex alignment patterns
- Leverages existing container utilities

**Cons:**
- Still relies on flex gap, which may not perfectly align with container padding
- May need to adjust gap values to match padding rhythm

**Risk:** Low (minimal code changes, leverages existing patterns)

---

### Option 3: Calculate TOC Position with Container-Aware Spacing

**Approach:**
Use CSS custom properties or Tailwind utilities to:
- Calculate TOC position based on container padding
- Use `calc()` or responsive utilities to align TOC right edge with container right padding
- Example: `mr-[calc(var(--container-padding-lg,2rem))]` or similar

**Pros:**
- Explicitly ties TOC position to container padding
- Can use CSS variables for consistency

**Cons:**
- Requires CSS variable setup or Tailwind config changes
- More complex than Option 2
- May not work well with responsive padding

**Risk:** Medium (requires CSS variable setup or Tailwind config changes)

---

## F) Acceptance Criteria & Test Checklist

### F.1) Alignment Criteria

- [ ] **Right edge alignment:** TOC right edge aligns with navbar container right edge at `lg` breakpoint (1024px+) with `px-8` (32px) padding
- [ ] **Consistent gutters:** Horizontal gutters match between navbar and page body at all breakpoints:
  - Mobile: `px-4` (16px)
  - sm: `px-6` (24px)
  - lg+: `px-8` (32px)
- [ ] **TOC width:** TOC maintains `w-64` (256px) fixed width on desktop
- [ ] **Gap spacing:** Gap between article and TOC is visually consistent with container padding rhythm (preferably `gap-8` / 32px)

---

### F.2) Responsive Behavior

- [ ] **Mobile (< 640px):** TOC renders as collapsible dropdown above content (no alignment issue)
- [ ] **sm (640px - 1023px):** TOC still mobile variant (no alignment issue)
- [ ] **lg (1024px - 1279px):** TOC aligns right edge with container right padding (`px-8` = 32px)
- [ ] **xl (1280px+):** TOC aligns right edge with container right padding (`px-8` = 32px)
- [ ] **Large screens (> 1280px):** Container max-width (`max-w-7xl` = 1280px) centers content; TOC aligns within centered container

---

### F.3) Hero Card Spacing (Future Cleanup)

- [ ] **Copy link button:** Aligns visually with card padding rhythm (currently `lg:right-10` = 40px)
- [ ] **Metadata row:** Consistent gap values that align with card padding (`p-6 sm:p-8 lg:p-10`)
- [ ] **Vertical spacing:** Use consistent spacing multiples (e.g., 24px or 32px base, not 48px)

---

### F.4) Visual Regression Tests

- [ ] **No horizontal scroll** introduced at any breakpoint
- [ ] **TOC sticky behavior** remains functional (sticky at `top-24`)
- [ ] **Article readability** maintained (max-width 768px for optimal line length)
- [ ] **Spacing rhythm** consistent across hero card, article, and TOC sections

---

### F.5) Cross-Browser Testing

- [ ] **Chrome/Edge** (Chromium)
- [ ] **Firefox**
- [ ] **Safari** (macOS + iOS)
- [ ] **Mobile viewports** (375px, 414px, 768px)

---

## Summary

**Primary Issue:** TOC right edge does not align with navbar container right edge because the flex layout with `lg:gap-8` and TOC's `ml-8 xl:ml-12` doesn't account for aligning the TOC to the container's right padding.

**Recommended Fix:** Option 2 (Unify Container Padding & Use Flex with Auto Margins) — minimal risk, leverages existing patterns, clear alignment mechanism.

**Secondary Issues:** Hero card internal spacing inconsistencies (copy link positioning, metadata row gaps, vertical spacing rhythm) — document for future cleanup, not blocking.

---

**Next Steps:**
1. Implement Option 2 (or selected fix approach)
2. Test alignment at all breakpoints
3. Verify responsive behavior
4. Address hero card spacing in follow-up PR (optional)
