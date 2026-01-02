---
status: "stable"
last_updated: "2026-01-02"
category: "components"
title: "Product Showcase"
description: "UI components for the components system, following atomic design principles. Located in landing/sections/product-showcase/."
---
# ProductShowcase TabSwitcher

**Comprehensive guide to TabSwitcher's grid layout implementation** - covering gap-based separators, button background inheritance, and integration with decorative dashed rails (as used in ProductShowcase).

## Overview

The TabSwitcher component supports a `layout="grid"` mode that renders tabs in a responsive grid (2 columns on mobile, 4 columns on desktop). This pattern includes:

- **Gap-based internal separators**: 1px grey separators between tab buttons using CSS Grid gap technique
- **Dynamic background inheritance**: Wrapper divs own backgrounds; buttons inherit transparently
- **Decorative dashed rails**: Optional vertical dashed lines for visual framing (ProductShowcase pattern)

## Grid Layout with Gap-Based Separators

### Implementation Pattern

The grid layout uses CSS Grid's `gap-px` property combined with a background color on the grid container to create visible separators:

```tsx
// TabSwitcher tablist with grid layout
<div
  role="tablist"
  className={cn(
    'grid w-full grid-cols-2 lg:grid-cols-4',
    'border-b border-border', // Bottom rail only (top border from section wrapper)
    gridSeparators && 'gap-px bg-border/40' // Gap creates separators, background shows through
  )}
>
```

### Why Gap Instead of Divide?

**Problem with `divide-x`**: Tailwind's `divide-x` utility doesn't work correctly for multi-row grids. When items wrap to a second row, `divide-x` adds borders to the left edge of items in the second row, creating unwanted visual artifacts.

**Solution**: Use `gap-px` on the grid container with `bg-border/40` background. The 1px gaps expose the container's background, creating clean separators that work for both 2x2 (mobile) and 1x4 (desktop) layouts.

### Background Inheritance Pattern

**Critical**: For gap separators to be visible, grid items (wrapper divs) must have **opaque backgrounds**. The gaps expose the container's `bg-border/40` background between items.

```tsx
// Grid item wrapper - background is essential for gap visibility
<div className={cn(
  "relative w-full",
  isActive ? 'bg-muted' : 'bg-showcase' // Opaque background required
)}>
  <button
    className={cn(
      tabButtonVariants({ isActive, preset: 'grid' }),
      'w-full h-full bg-transparent', // Inherit wrapper background
      "data-[state='active']:bg-transparent"
    )}
  >
    {item.label}
  </button>
</div>
```

**Key Points**:
- Wrapper divs have opaque backgrounds (`bg-showcase` for inactive, `bg-muted` for active)
- Buttons use `bg-transparent` to inherit the wrapper's background
- This ensures the gap separators (container's `bg-border/40`) show through correctly

## ProductShowcase Integration: Dashed Vertical Rails

### Pattern Overview

The ProductShowcase section uses TabSwitcher with decorative dashed vertical rails that:
- Align with the outer edges of the tab button container
- Extend from the top of the tabs down to the top edge of the product image
- Use dynamic height calculation to span the gap between tabs and content

### Implementation

**Rails Wrapper Structure**:
```tsx
<div className="relative"> {/* ShowcaseFrame */}
  {/* Dashed rails - positioned absolutely within ShowcaseFrame */}
  <div
    ref={railsWrapperRef}
    aria-hidden="true"
    className="pointer-events-none absolute left-0 right-0 z-[46]"
  >
    <div className={cn(
      containerWithPaddingVariants({ maxWidth: '7xl', padding: 'lg', centered: true }),
      "relative h-full"
    )}>
      <div className={cn("relative h-full w-full", showcaseTabInner)}>
        {/* Left dashed rail */}
        <div
          className="absolute inset-y-0 left-0 w-px"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 4px, hsl(var(--border) / 0.4) 4px, hsl(var(--border) / 0.4) 10px)',
          }}
        />
        {/* Right dashed rail */}
        <div
          className="absolute inset-y-0 right-0 w-px"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 4px, hsl(var(--border) / 0.4) 4px, hsl(var(--border) / 0.4) 10px)',
          }}
        />
      </div>
    </div>
  </div>
  
  {/* Sticky tabs container */}
  <div className="sticky z-[45] bg-showcase relative">
    {/* TabSwitcher here */}
  </div>
  
  {/* Content container */}
  <div className="relative z-[45]">
    {/* Product image content */}
  </div>
</div>
```

### Dynamic Height Calculation

Rails height is calculated dynamically to span from tabs to product image:

```tsx
useEffect(() => {
  const updateRailsHeight = () => {
    if (!railsWrapperRef.current || !tabContainerRef.current || !contentContainerRef.current) return;

    const railsWrapper = railsWrapperRef.current;
    const tabContainer = tabContainerRef.current;
    const contentContainer = contentContainerRef.current;
    
    const parent = railsWrapper.parentElement as HTMLElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const tabRect = tabContainer.getBoundingClientRect();
    const contentRect = contentContainer.getBoundingClientRect();

    // Start from top of tabs, end at top of content
    const topOffset = tabRect.top - parentRect.top;
    const height = contentRect.top - parentRect.top - topOffset;
    
    railsWrapper.style.top = `${topOffset}px`;
    railsWrapper.style.height = `${Math.max(0, height)}px`;
  };

  updateRailsHeight();
  window.addEventListener('resize', updateRailsHeight);
  const timeoutId = setTimeout(updateRailsHeight, 100);

  return () => {
    window.removeEventListener('resize', updateRailsHeight);
    clearTimeout(timeoutId);
  };
}, [activeTab]);
```

### Z-Index Layering

**Critical z-index values**:
- Rails wrapper: `z-[46]` - Above tabs to be visible as borders
- Sticky tabs container: `z-[45]` - Above content, below rails
- Content container (image): `z-[45]` - Same as tabs, covers rails behind image

**Why this order?**
- Rails need to be visible above tabs to appear as outer borders
- Content (image) should cover rails when they extend behind it
- Tabs remain interactive above content

### Width Alignment

Rails use the same width constraint as tabs (`showcaseTabInner = "xl:max-w-5xl"`) to ensure perfect alignment:

```tsx
// Both use the same width constraint
const showcaseTabInner = "mx-auto w-full xl:max-w-5xl";

// Rails wrapper inner div
<div className={cn("relative h-full w-full", showcaseTabInner)}>
  {/* Rails positioned at left-0 and right-0 */}
</div>

// Tab container
<div className={cn("w-full", showcaseTabInner)}>
  <TabSwitcher ... />
</div>
```

## Border Pattern: Top and Bottom Rails

### Top Border

**Source**: The top border comes from the section wrapper, not TabSwitcher:

```tsx
// In page.tsx
<FullWidthSection
  className="border-t border-border pt-0 sm:pt-0"
>
  <ProductShowcase />
</FullWidthSection>
```

**Why?** This avoids double-thickness. The section's top border serves as the tab strip's top border.

### Bottom Border

**Source**: TabSwitcher's tablist element:

```tsx
<div
  role="tablist"
  className={cn(
    'grid w-full grid-cols-2 lg:grid-cols-4',
    'border-b border-border', // Bottom rail
    gridSeparators && 'gap-px bg-border/40'
  )}
>
```

**Thickness matching**: Both top (section) and bottom (tablist) borders use `border-border` (full opacity) to ensure consistent visual weight.

## Key Learnings & Gotchas

### 1. Gap Separators Require Opaque Backgrounds

**Issue**: If wrapper divs don't have backgrounds, gap separators won't show.

**Solution**: Always apply opaque backgrounds to wrapper divs in grid layout:
```tsx
<div className={cn("relative w-full", isActive ? 'bg-muted' : 'bg-showcase')}>
  <button className="bg-transparent ..."> {/* Inherit wrapper */}
```

### 2. Divide-X Doesn't Work for Multi-Row Grids

**Issue**: `divide-x` adds unwanted borders to wrapped items.

**Solution**: Use `gap-px bg-border/40` pattern instead.

### 3. Z-Index for Decorative Overlays

**Issue**: Rails behind tabs won't be visible.

**Solution**: Position rails above tabs (`z-[46]` vs `z-[45]`) or ensure they align precisely at edges.

### 4. Dynamic Height Calculation Timing

**Issue**: Initial render may calculate incorrect heights.

**Solution**: Add a `setTimeout` delay (100ms) to account for layout shifts, and recalculate on resize and tab changes.

### 5. Background Inheritance Pattern

**Pattern**: Wrapper owns background, button inherits:
- Wrapper: `bg-showcase` (inactive) or `bg-muted` (active)
- Button: `bg-transparent` (inherits wrapper)
- This ensures gap separators show container background

### 6. Width Alignment is Critical

**Issue**: Rails and tabs must use identical width constraints to align.

**Solution**: Use a shared constant (`showcaseTabInner`) for both rails wrapper and tab container.

## Usage Examples

### Basic Grid Layout

```tsx
<TabSwitcher
  tabs={tabsData}
  layout="grid"
  buttonVariant="grid"
  gridSeparators={true}
/>
```

### Grid Layout Without Separators

```tsx
<TabSwitcher
  tabs={tabsData}
  layout="grid"
  buttonVariant="grid"
  gridSeparators={false} // No gap separators
/>
```

### ProductShowcase Pattern (Full Implementation)

See `product-showcase.tsx` in this directory for the complete implementation including:
- Dashed vertical rails
- Dynamic height calculation
- Z-index layering
- Width alignment

## File Locations

- **Component**: `components/landing/sections/product-showcase/tab-switcher.tsx`
- **Styles**: `components/landing/sections/product-showcase/tab-switcher.variants.ts` (Tailwind Variants)
- **Usage**: `components/landing/sections/product-showcase/product-showcase.tsx`

## Related Documentation

- [UI Design Guide](../../../../docs/architecture-design/ui-design-guide.md) - General UI patterns
- [Pattern Library](../../../../docs/pattern-library.md) - Style system patterns
- [Entity Grid Architecture](../../../../.cursor/rules/entity-grid-architecture.mdc) - Table/grid patterns

## Changelog

- **2025-01-15**: Added grid layout with gap-based separators
- **2025-01-15**: Implemented dashed vertical rails pattern for ProductShowcase
- **2025-01-15**: Documented background inheritance pattern for gap separators
- **2025-01-15**: Moved TabSwitcher component to product-showcase directory (component-specific to this section)
