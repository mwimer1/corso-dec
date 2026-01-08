---
description: "UI components for the components system, following atomic design principles. Located in insights/."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Insights Components

Components for the Insights landing page and article detail pages.

- Directory: `components/insights`
- Last updated: `2026-01-07`

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

Compact hero section for the landing page with eyebrow, title, and description.

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

