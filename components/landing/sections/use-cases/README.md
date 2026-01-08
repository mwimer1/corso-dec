---
description: "Streamlined card grid layout for showcasing industry use cases with interactive preview pane."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Use Case Explorer

The Use Case Explorer showcases how Corso serves different industries (Insurance Brokers, Building Materials Suppliers, Contractors & Builders, and Developers & Real Estate) with a modern card grid layout and interactive preview pane.

## Architecture

### Component Structure

```
use-case-explorer.tsx (Client Component)
├── Header
└── IndustrySelectorPanel (Client Component)
    ├── Card Grid (Left Pane)
    │   ├── UseCaseCard[] (Interactive cards)
    │   └── Problem/Help Sections (Muted surfaces)
    └── Preview Pane (Right Pane - Desktop / Accordion - Mobile)
        └── UseCasePreviewPane
            ├── SegmentedControl (Dashboard / Sample record / Outputs)
            └── IndustryPreview (Image only, conditionally rendered)
```

### Key Components

- **`use-case-explorer.tsx`** - Main component with header and accent underline on "action"
- **`industry-selector-panel.tsx`** - Manages card selection state and two-pane layout (cards + preview)
- **`use-case-card.tsx`** - Individual use case card with selected state, hover elevation, and tag display
- **`use-case-preview-pane.tsx`** - Sticky preview pane with segmented control tabs and animated transitions
- **`industry-preview.tsx`** - Preview image component (returns null if no image provided)
- **`use-case-explorer.module.css`** - Styles for card grid, preview pane, and responsive breakpoints

## Features

### Card Grid Layout

- **Responsive breakpoints:**
  - Mobile (≤767px): 1 column
  - Tablet/Desktop (≥768px): 2 columns
- **Odd count handling:** Last card spans full width (`md:col-span-2`) when there's an odd number of cards
- **Selected state:** `bg-muted` background with `ring-2 ring-ring` for visual feedback
- **Hover effects:** Elevation with `hover:shadow-lg` and slight translate
- **Tag display:** Shows up to 2 tags with a "+N" badge for additional tags

### Preview Pane

- **Desktop (≥1024px):**
  - Sticky positioning with `top-[var(--nav-offset,4rem)]`
  - Always visible on the right side
  - 400px fixed width
- **Mobile/Tablet (<1024px):**
  - Collapsed in `<details>` accordion by default
  - Expandable with smooth animation
- **Segmented control:** Three tabs (Dashboard / Sample record / Outputs) with animated transitions

### Problem and Help Sections

- **Muted surfaces:** Less boxy than bordered cards (`bg-muted/50`)
- **Content:** Shows description ("The problem") and benefits list ("How Corso helps")
- **Positioning:** Below the card grid in the left pane

## Data Structure

### Use Case Data

Data is defined in `use-cases.data.ts` and validated with `zUseCaseMap`:

```typescript
interface UseCase {
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  impact: string;
  impactMetrics?: string[];
  previewImage?: { src: string; alt: string };
}
```

### Preview Tab Content

Preview tab content (Dashboard, Sample record, Outputs) is defined in `use-case-preview-pane.tsx` as a UI-only mapping layer. This keeps the validation schema intact while providing rich preview content.

## Integration Points

### Homepage

```tsx
// app/(marketing)/page.tsx
<FullWidthSection background="muted" padding="lg">
  <IndustryExplorer />
</FullWidthSection>
```

### Insights Index Page

```tsx
// app/(marketing)/insights/page.tsx
<FullWidthSection background="showcase" padding="lg">
  <IndustryExplorer />
</FullWidthSection>
```

## Styling

### Design Tokens

- Uses `bg-muted`, `bg-showcase` for backgrounds
- Uses `ring-ring` for selected states
- Uses `border-border` for borders
- Respects `--nav-offset` CSS variable for sticky positioning
- No hardcoded colors (all via design tokens)

### CSS Module

The `use-case-explorer.module.css` file contains:
- Card grid responsive styles
- Preview pane sticky positioning
- Mobile accordion styles
- Tab content transition animations
- Reduced motion support

## Accessibility

- **Keyboard navigation:** Cards are focusable buttons with proper ARIA labels
- **Screen readers:** `aria-pressed` for selected state, proper heading structure
- **Focus management:** Visible focus rings on all interactive elements
- **Reduced motion:** Animations respect `prefers-reduced-motion`

## Analytics

Card selection is tracked via `trackEvent('industry_tab_selected', ...)` with:
- `industry`: Use case key
- `industryTitle`: Use case title
- `section`: 'use_cases'

CTA buttons use `LinkTrack` for navigation analytics.

## Responsive Behavior

| Breakpoint | Card Grid | Preview Pane |
|------------|-----------|--------------|
| Mobile (≤767px) | 1 column | Accordion (collapsed) |
| Tablet (768-1023px) | 2 columns | Accordion (collapsed) |
| Desktop (≥1024px) | 2 columns | Sticky right pane |

## Design Decisions

### Cards-Only Selection

The Use Case Explorer intentionally uses cards-only selection (no separate industry tabs row). Cards serve as both navigation controls and content preview, providing a cleaner UX that avoids duplicated selection mechanisms. This design is touch-friendly on mobile and eliminates the need for horizontal scrolling tabs.

## Related

- `components/landing/README.md` - Landing page components overview
- `app/(marketing)/README.md` - Marketing routes documentation
- `components/ui/segmented-control.tsx` - Segmented control component
