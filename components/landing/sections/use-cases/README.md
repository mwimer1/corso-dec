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
- **`use-case-preview-pane.tsx`** - Preview pane with local muted segmented control, KPI cards, and CTA
- **`use-case-explorer.module.css`** - Styles for card grid, preview pane, height alignment, and responsive breakpoints

## Features

### Industry Selection

- **Industry pills row:** Horizontal scrollable pills with muted active state (`bg-muted/60`)
- **Default industry:** Developers & Real Estate (first in order)
- **Order:** Developers & Real Estate → Contractors & Builders → Insurance Brokers → Building Materials Suppliers
- **quickProof badges:** Muted styling (`color="default"`) showing "Texas statewide", "Updated regularly", "Export-ready"

### Workflow Cards Grid

- **Responsive breakpoints:**
  - Mobile (≤767px): 1 column
  - Tablet/Desktop (≥768px): 2 columns
- **Card structure:** Icon container + title + one-liner + output tags (up to 2 visible + "+N")
- **Selected state:** `bg-muted` background with subtle ring (`ring-1 ring-ring/20`)
- **Hover effects:** Subtle elevation (`hover:shadow-md`)
- **Icons:** Lucide React icons stored as component references (not JSX)

### Preview Pane

- **Desktop (≥1024px):**
  - Sticky positioning with `top-[var(--nav-offset,4rem)]`
  - Always visible on the right side
  - 400px fixed width
  - CTA card height-aligned with left bottom cards (`lg:h-48`)
- **Mobile/Tablet (<1024px):**
  - Collapsed in `<details>` accordion by default
  - Expandable with smooth animation
- **Segmented control:** Local implementation with muted styling (active: `bg-muted`, not bright blue)
- **Tabs:**
  - **Dashboard:** Dark KPI card + muted "What you'll do" section with highlights
  - **Sample record:** Muted surface with label/value rows
  - **Outputs:** Muted surface with output badges

### Problem and Help Sections

- **Muted surfaces:** `bg-muted/30` (less boxy than bordered cards)
- **Content:** Paragraphs (not bullet lists)
  - "The problem": Shows `useCase.pain` as paragraph
  - "How Corso helps": Shows `useCase.howCorsoHelps` as paragraph
- **Positioning:** Bottom row in left pane, anchored with `mt-auto`
- **Height alignment:** `lg:h-48` to match right pane CTA card on desktop

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

- Active industry pills: `bg-muted/60` (not dark/black-filled)
- quickProof badges: `color="default"` (muted, not blue-heavy)
- Segmented control: Active tab uses `bg-muted` (not bright blue)
- Problem/Help cards: `bg-muted/30` (subtle, less boxy)

### Height Alignment

On desktop, the right pane CTA card (`lg:h-48`) aligns with the left pane bottom row (Problem + Help cards, also `lg:h-48`) for visual balance.

## Related

- `components/landing/README.md` - Landing page components overview
- `app/(marketing)/README.md` - Marketing routes documentation
- `components/ui/segmented-control.tsx` - Segmented control component
