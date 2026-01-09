---
description: "UI components for the components system, following atomic design principles. Located in insights/."
last_updated: "2026-01-27"
category: "documentation"
status: "draft"
---
# Insights Components

Components for the Insights landing page and article detail pages.

- Directory: `components/insights`
- Last updated: `2026-01-27`

## UI Structure

The `/insights` landing page follows a structured layout:

1. **Hero Section** (`InsightsHero`)
   - Wrapped in `FullWidthSection` with `padding="hero"`, `containerMaxWidth="7xl"`, `containerPadding="lg"`
   - Card/panel styling: `rounded-2xl border border-border bg-card/50` with subtle gradient wash
   - Typography: eyebrow (uppercase), large title, description with max-width for readability
   - Uses design tokens for spacing and typography

2. **Controls Row** (Search + Sort + Clear)
   - Wrapped in `FullWidthSection` with `padding="md"`, `containerMaxWidth="7xl"`, `containerPadding="lg"`
   - Consistent height (`h-10`) across all controls (Input, Select, Button)
   - Tighter spacing (`gap-2.5`) for CMS-grade toolbar feel
   - Results summary displays filtered count and active category

3. **Category Chips Row** (`CategoryFilter`)
   - Sticky positioning with backdrop blur
   - Horizontal scrollable chips on desktop, dropdown on mobile
   - Count badges match `badgeVariants` patterns (`rounded-lg px-2.5 py-1 bg-muted`)
   - No heavy divider lines (clean, minimal appearance)

4. **Card Grid** (`InsightsList`)
   - Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
   - Consistent card heights via `h-full flex flex-col`
   - Empty state with design system icon (FileText from lucide-react)
   - Loading state with `ContentListSkeleton`

### Design Token Usage

- **Spacing**: Use token-based classes (`gap-2.5`, `space-y-4`, etc.) instead of arbitrary values
- **Typography**: Follow design system scale (`text-lg`, `text-sm`, etc.)
- **Colors**: Use semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, etc.)
- **FullWidthSection**: Always use `FullWidthSection` for consistent section spacing; never use manual container wrappers (`max-w-7xl px-4 sm:px-6 lg:px-8`)

## URL Parameters

The Insights landing page (`/insights`) supports the following URL query parameters:

- `?category=slug` - Filter by category slug (e.g., `?category=technology`)
  - Falls back to `all` if category doesn't exist
  - Use `all` or omit parameter to show all categories

- `?q=search` - Search query (filters by title and description)
  - Case-insensitive search
  - Example: `?q=construction`

- `?sort=newest|oldest|title` - Sort order
  - `newest` (default) - Sort by publish date, newest first
  - `oldest` - Sort by publish date, oldest first
  - `title` - Sort alphabetically by title (A-Z)
  - Falls back to `newest` if invalid sort value

Examples:
- `/insights?category=technology&q=construction&sort=newest`
- `/insights?q=market`
- `/insights?category=sustainability&sort=title`

All parameters can be combined. Invalid values fall back safely to defaults.

## Filtering & Search

Filtering, search, and sorting logic lives in `components/insights/insights-client.tsx`.

### Implementation Details

- **Search**: Case-insensitive search on `title` and `description` fields, debounced (300ms) to avoid excessive re-renders
- **Category Filter**: Checks ALL categories per article (articles can belong to multiple categories)
- **Sort**: Applied after filtering, supports `newest`, `oldest`, `title`
- **URL Sync**: All filter state syncs with URL parameters for shareable links and browser back/forward navigation

### Extending Filters

To add new filters:

1. Add URL param sync in `insights-client.tsx`:
   ```typescript
   const newFilterParam = searchParams.get('newFilter') || 'default';
   const [newFilter, setNewFilter] = useState(newFilterParam);
   ```

2. Update `updateUrlParams` function to handle the new param

3. Add filter logic to the `filtered` useMemo:
   ```typescript
   if (newFilter !== 'default') {
     result = result.filter(/* your filter logic */);
   }
   ```

4. Add UI controls in the controls row (before CategoryFilter)

## Components

### CategoryFilterClient

Main client component that handles filtering, search, and sorting. Renders:
- Search input with icon
- Sort dropdown
- Clear filters button
- Results summary
- CategoryFilter (responsive)
- InsightsList with filtered/sorted results

### CategoryFilter

Responsive category filter:
- **Mobile** (`< md`): Dropdown Select component
- **Desktop** (`≥ md`): Horizontal scrollable chips (no wrap)
- Automatically hides categories with 0 results
- Preserves keyboard navigation (arrow keys on desktop)

### InsightsHero

Hero section for the landing page with card/panel styling:
- **Styling**: Rounded corners (`rounded-2xl`), subtle border, calm background (`bg-card/50`)
- **Layout**: Wrapped in `FullWidthSection` with hero padding
- **Typography**: Eyebrow (uppercase), large responsive title, description with max-width
- **Decoration**: Subtle gradient wash behind content (non-interactive)
- **Ownership**: Hero component owns its internal layout; don't move hero markup to other components

### InsightsList

Grid layout component that renders insight cards:
- Responsive: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Empty state with context-aware messaging
- Supports `onClearFilters` prop for filtered-out empty states

### InsightCard

Individual insight/article card component with:
- 16:9 aspect ratio image
- Category badge, date, reading time
- Title and excerpt
- Author information
- Consistent heights via `h-full flex flex-col`

## Content Schema

### InsightItem Fields

The `InsightItem` type (used for detail pages) supports the following fields:

- **`keyTakeaways?: string[]`** - Optional array of structured key takeaways (1-8 items)
  - Each item must be a plain text string (no HTML tags)
  - Maximum 300 characters per item (editorial guidance: keep under 180 for readability)
  - If present, the detail page will render a styled takeaways block
  - The HTML "Key takeaways" section will be automatically removed at render-time to avoid duplication
  - Prefer using `keyTakeaways` over HTML for consistent styling

### Editorial Guidance

When creating or updating insight content:

- **Do not include `<h1>` in content HTML** - Start headings at `<h2>`
- **Always include `alt` attributes** on inline images
- **Prefer `keyTakeaways` over HTML** - Use the structured field for consistent styling instead of embedding takeaways in HTML
- **Keep takeaways concise** - Maximum 300 characters per item, ideally under 180 for better readability

