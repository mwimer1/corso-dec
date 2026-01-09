---
description: "Nested industry → workflow structure with interactive preview pane showcasing use cases."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Use Case Explorer

The Use Case Explorer showcases how Corso serves different industries (Developers & Real Estate, Contractors & Builders, Insurance Brokers, and Building Materials Suppliers) with a nested structure: each industry contains multiple workflows (use cases) that users can explore.

## Architecture

### Component Structure

```
use-case-explorer.tsx (Client Component)
├── Header (with thick accent underline on "action")
└── IndustrySelectorPanel (Client Component)
    ├── Industry Pills Row (horizontal scrollable)
    ├── quickProof Badges (muted styling)
    └── Main Two-Column Layout
        ├── Left Pane: Industry Card
        │   ├── Industry Tagline + Helper Line
        │   ├── Workflow Cards Grid (UseCaseCard[])
        │   └── Problem/Help Sections (Paragraphs, muted surfaces)
        └── Right Pane: Preview (Desktop) / Accordion (Mobile)
            └── UseCasePreviewPane
                ├── Local SegmentedControl (muted styling)
                ├── Dashboard Tab (KPI card + "What you'll do")
                ├── Sample Record Tab
                └── Outputs Tab
```

### Key Components

- **`use-case-explorer.tsx`** - Main component with header and thick accent highlight bar on "action"
- **`industry-selector-panel.tsx`** - Manages industry/workflow selection state, industry pills, and two-pane layout
- **`use-case-card.tsx`** - Workflow card with icon, title, one-liner, and output tags (not industry cards)
- **`use-case-preview-pane.tsx`** - Preview pane with unified surface, segmented tabs, KPI section, and CTA footer
- **`segmented-tabs.tsx`** - Shared segmented control component used for both industry and preview tabs
- **`use-case-explorer.module.css`** - Styles for preview transitions, scrollbar hiding, and responsive breakpoints (spacing handled via Tailwind)

## Features

### Industry Selection

- **Industry tabs:** Segmented control using `SegmentedTabs` component with rounded-full pills
- **Styling:** Muted background (`bg-muted/60`), active state uses `bg-muted` with `border-foreground/30`
- **Scrollable:** Horizontal scroll on mobile with hidden scrollbar
- **Default industry:** Developers & Real Estate (first in order)
- **Order:** Developers & Real Estate → Contractors & Builders → Insurance Brokers → Building Materials Suppliers
- **quickProof badges:** Muted styling (`color="default"`) with `rounded-full` showing "Texas statewide", "Updated regularly", "Export-ready"

### Workflow Cards Grid

- **Responsive breakpoints:**
  - Mobile (≤767px): 1 column
  - Tablet/Desktop (≥768px): 2 columns
- **Card structure:** Icon container + title (`text-lg font-semibold`) + one-liner (`text-sm text-muted-foreground line-clamp-2`) + output tags (up to 2 visible + "+N more")
- **Padding:** Consistent `p-5` across all cards
- **Selected state:** `bg-muted/40` background with subtle ring (`ring-1 ring-ring/20`) and `border-foreground/20`
- **Hover effects:** Subtle elevation (`hover:shadow-md`) with smooth transitions (`transition-colors transition-shadow duration-200`)
- **Tags:** Use `Badge` component with `rounded-full` styling
- **Icons:** Lucide React icons stored as component references (not JSX)

### Preview Pane

- **Desktop (≥1024px):**
  - Sticky positioning with `top-[var(--nav-offset,4rem)]`
  - Always visible on the right side
  - 400px fixed width
- **Mobile/Tablet (<1024px):**
  - Collapsed in `<details>` accordion by default
  - Expandable with smooth animation
- **Segmented control:** Uses shared `SegmentedTabs` component matching industry tabs styling
- **Unified surface:** Single `Card` wrapper; no nested Cards (KPI and CTA use muted `div` surfaces)
- **Tabs:**
  - **Dashboard:** KPI section (`bg-muted/30`) + muted "What you'll do" section (`bg-muted/40`) with highlights
  - **Sample record:** Muted surface (`bg-muted/40`) with label/value rows
  - **Outputs:** Muted surface (`bg-muted/40`) with output badges
- **CTA footer:** Subtle callout (`bg-muted/20`) with smaller typography (`text-sm` heading, `text-xs` body)

### Problem and Help Sections

- **Muted surfaces:** `bg-muted/30` (less boxy than bordered cards)
- **Padding:** Consistent `p-5` (removed fixed height for better responsive behavior)
- **Content:** Paragraphs (not bullet lists)
  - "The problem": Shows `useCase.pain` as paragraph
  - "How Corso helps": Shows `useCase.howCorsoHelps` as paragraph
- **Positioning:** Bottom row in left pane, anchored with `mt-auto`

## Data Structure

### Nested Industry → Workflow Model

Data is defined in `use-cases.data.ts` using `STREAMLINED_INDUSTRIES`:

```typescript
interface Industry {
  id: string;
  label: string;
  tagline: string;
  helperLine: string;
  quickProof: string[];
  useCases: UseCase[];
}

interface UseCase {
  id: string;
  title: string;
  oneLiner: string;
  pain: string;              // Paragraph for "The problem"
  howCorsoHelps: string;     // Paragraph for "How Corso helps"
  outputs: string[];         // Used for tags in cards
  icon: LucideIcon;          // Component reference (not JSX)
  preview: UseCasePreview;
}

interface UseCasePreview {
  headline: string;
  highlights: string[];      // "What you'll do" bullets
  kpis: { label: string; value: string }[];
  sampleRecord: { label: string; value: string }[];
}
```


## Integration Points

### Homepage

```tsx
// app/(marketing)/page.tsx
<FullWidthSection
  background="default"
  padding="lg"
  containerMaxWidth="7xl"
  containerPadding="lg"
>
  <IndustryExplorer />
</FullWidthSection>
```

**Note:** `IndustryExplorer` is only used on the homepage. It is not used on `/insights`.

## Styling

### Typography Scale

- **Section heading:** `text-4xl font-bold tracking-tight`
- **Subsection heading:** `text-2xl font-semibold`
- **Card heading:** `text-lg font-semibold`
- **Eyebrow/caption:** `text-xs text-muted-foreground uppercase tracking-wide`
- **Body default:** `text-base`
- **Body secondary:** `text-sm text-muted-foreground`

### Spacing

- Uses Tailwind spacing utilities (`space-y-*`, `gap-*`, `p-*`)
- Standardized spacing: `space-y-6` for sections, `space-y-4` for cards, `gap-4` for grids
- Card padding: `p-5` consistently
- No CSS variable spacing (`var(--space-*)`) - all handled via Tailwind classes

### Design Tokens

- Uses `bg-muted`, `bg-showcase` for backgrounds
- Uses `ring-ring` for selected states
- Uses `border-border` for borders
- Respects `--nav-offset` CSS variable for sticky positioning
- No hardcoded colors (all via design tokens)

### CSS Module

The `use-case-explorer.module.css` file contains:
- Preview transition animations
- Scrollbar hiding utilities
- Tab content fade animations
- Reduced motion support
- Responsive breakpoint utilities

## Accessibility

- **Keyboard navigation:** Cards and tabs are focusable with proper ARIA labels
- **Tab semantics:** Proper `role="tablist"`, `role="tab"`, `role="tabpanel"` with `aria-selected`, `aria-controls`, and `aria-labelledby`
- **Screen readers:** `aria-pressed` for selected cards, proper heading structure
- **Focus management:** Visible focus rings (`focus-visible:ring-2 focus-visible:ring-ring`) on all interactive elements
- **Tab navigation:** `tabIndex` management for keyboard navigation
- **Reduced motion:** Animations respect `prefers-reduced-motion`

## Analytics

Industry selection is tracked via `trackEvent('industry_tab_selected', ...)` with:
- `industry`: Industry ID (e.g., 'developers')
- `industryTitle`: Industry label (e.g., 'Developers & Real Estate')
- `section`: 'use_cases'

CTA buttons use `LinkTrack` for navigation analytics.

## Responsive Behavior

| Breakpoint | Card Grid | Preview Pane |
|------------|-----------|--------------|
| Mobile (≤767px) | 1 column | Accordion (collapsed) |
| Tablet (768-1023px) | 2 columns | Accordion (collapsed) |
| Desktop (≥1024px) | 2 columns | Sticky right pane |

## Design Decisions

### Nested Industry → Workflow Structure

The Use Case Explorer uses a two-level selection model:
1. **Industry selection:** Via horizontal scrollable pills at the top
2. **Workflow selection:** Via workflow cards within the selected industry

This allows users to explore multiple workflows per industry while maintaining a clear hierarchy.

### Muted Styling Throughout

- Active industry tabs: `bg-muted` with `border-foreground/30` (not dark/black-filled)
- quickProof badges: `color="default"` with `rounded-full` (muted, not blue-heavy)
- Segmented control: Active tab uses `bg-muted` (not bright blue)
- Preview KPI section: `bg-muted/30` (replaces dark card)
- Preview CTA footer: `bg-muted/20` (subtle callout, not competing card)
- Problem/Help cards: `bg-muted/30` (subtle, less boxy)

### Unified Preview Surface

The preview pane uses a single `Card` wrapper with unified muted surfaces inside:
- KPI section uses `div` with `bg-muted/30` (replaces nested dark Card)
- CTA footer uses `div` with `bg-muted/20` (replaces nested dark Card)
- This creates a cohesive preview module without "card inside card" clutter

## Related

- `components/landing/README.md` - Landing page components overview
- `app/(marketing)/README.md` - Marketing routes documentation
- `components/landing/sections/use-cases/segmented-tabs.tsx` - Shared segmented tabs component
