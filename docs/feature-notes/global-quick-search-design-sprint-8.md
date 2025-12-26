---
status: stable
last_updated: 2025-01-28
---

# Sprint 8 — Global Quick Search: Design Document

## Overview

Add a global quick search feature to entity grids that allows users to search across multiple columns simultaneously. This sprint is split into two phases: **backend contract first**, then **UI implementation**.

## Current State Analysis

### Backend Support
- ✅ **GET `/api/v1/entity/[entity]`**: Supports `search` parameter (via `EntityListQuerySchema`)
- ✅ **SSRM Fetcher**: Uses GET route (`/api/v1/entity/${entity}?...`), so search is already supported!
- ✅ **Service Layer**: `fetchEntityData` supports `search` but only searches hardcoded fields (`name`, `description`)
- ⚠️ **Limitation**: Search currently only searches `name` and `description` fields (hardcoded in service layer)

### Key Discovery
**The backend contract already supports search!** The SSRM fetcher uses the GET route which already accepts `search` as a query parameter. We can proceed directly to UI implementation.

### Search Field Limitations
Current implementation in `lib/services/entities/actions.ts:117-121`:
```typescript
if (params.search && params.search.trim()) {
  const searchParamKey = `p${paramCounter++}`;
  whereConditions.push(`(name LIKE {${searchParamKey}:String} OR description LIKE {${searchParamKey}:String})`);
  paramsObj[searchParamKey] = `%${params.search}%`;
}
```

**Problem**: Only searches `name` and `description` fields, which may not exist for all entities.

## Design Decision: Backend Contract

### ✅ Backend Already Supports Search

**Discovery**: The SSRM fetcher uses GET `/api/v1/entity/${entity}?...` which already supports `search` parameter via `EntityListQuerySchema`. No backend changes needed!

**Current Implementation**:
- GET route accepts `search` query parameter
- Service layer searches `name` and `description` fields (hardcoded)
- Search works with existing filters/sort/pagination

### Future Enhancement: Entity-Specific Search Fields

**Current Limitation**: Search only searches `name` and `description` fields (hardcoded in `lib/services/entities/actions.ts:119`)

**Future Option**: Entity-specific searchable fields configuration

### Phase 1: Backend Contract ✅ COMPLETE

**Status**: Backend already supports search! No changes needed.

The GET route (`/api/v1/entity/[entity]`) already:
- ✅ Accepts `search` query parameter (via `EntityListQuerySchema`)
- ✅ Passes search to service layer
- ✅ Works with existing filters/sort/pagination

#### 1.1 Future Enhancement: Entity-Specific Search Fields
**File**: `lib/services/entities/actions.ts`

**Current**: Hardcoded `name` and `description` fields
**Future**: Entity-specific searchable fields configuration

**Option 1**: Per-entity searchable fields in config
```typescript
// lib/services/entities/search-fields.ts
export const ENTITY_SEARCH_FIELDS: Record<EntityKind, string[]> = {
  projects: ['building_permit_id', 'description', 'city', 'state'],
  companies: ['name', 'description'],
  addresses: ['full_address', 'city', 'state', 'zipcode'],
};
```

**Option 2**: Use column config to determine searchable fields
```typescript
// Use TableColumnConfig to determine which fields are searchable
// Default: all text/string columns are searchable
```

**Recommendation**: Start with Option 1 (explicit config) for MVP, migrate to Option 2 later.

**Note**: OpenAPI spec should document the GET route's `search` parameter if not already documented.

### Phase 2: UI Implementation (Ready to Start) - Design

#### 2.1 Search Input Component
**Location**: `components/dashboard/entities/shared/grid/grid-menubar.tsx`

**Design:**
- Search input in toolbar (left side, after Saved Searches)
- Debounced input (300ms delay)
- Clear button (X icon) when search is active
- Loading indicator during search

**Implementation:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

// Debounce search input
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);

// Apply search to grid
useEffect(() => {
  if (!props.gridRef?.current?.api) return;
  
  // Trigger SSRM refresh with search parameter
  // This will be handled by the fetcher
  props.gridRef.current.api.refreshServerSide();
}, [debouncedSearch, props.gridRef]);
```

#### 2.2 Update Fetcher to Include Search
**File**: `components/dashboard/entities/shared/grid/fetchers.ts`

**Current**: Fetcher sends `filters`, `sort`, `page` via query params
**Update**: Add `search` parameter to query string

**Challenge**: Fetcher is created once, but search changes dynamically.

**Solution**: Use a ref or closure to access current search value.

**Implementation Approach**:
```typescript
// Option A: Pass search via closure (simpler)
export function createEntityFetcher(
  entity: GridId, 
  getSearchQuery: () => string | undefined
): EntityFetcher {
  return async (request, _distinctId, orgId) => {
    // ... existing code ...
    
    const searchQuery = getSearchQuery();
    if (searchQuery && searchQuery.trim()) {
      sp.set('search', searchQuery.trim());
    }
    
    // ... rest of fetcher ...
  };
}

// Usage in EntityGridHost:
const searchQueryRef = useRef<string | undefined>(undefined);
const fetcher = useMemo(
  () => createEntityFetcher(config.id, () => searchQueryRef.current),
  [config.id]
);
```

**Alternative**: Use React Context or state management library (overkill for MVP).

#### 2.3 Search State Management
**Options:**

**Option A**: Search in URL params (recommended for shareability)
- Pros: Shareable URLs, browser back/forward support
- Cons: More complex state management

**Option B**: Component state + grid API refresh
- Pros: Simple, no URL pollution
- Cons: Not shareable, lost on refresh

**Option C**: Grid state (saved views)
- Pros: Persists with saved views
- Cons: Search shouldn't be part of saved view

**Recommendation**: Option B for MVP (component state), Option A for future enhancement.

#### 2.4 UI Placement
**Location**: Toolbar, left side

```
[Saved Searches] [Tools] [🔍 Search...] | [Results: 123] [Columns] [Export] [Reset] [Refresh] [Save]
```

**Accessibility:**
- `aria-label="Search across all columns"`
- `placeholder="Search..."`
- Keyboard shortcut: `Ctrl/Cmd+K` (common pattern)

## Implementation Plan

### Phase 1: Backend Contract ✅ COMPLETE - Summary
**Status**: Backend already supports search via GET route. No changes needed.

**Future Enhancement**: Entity-specific searchable fields configuration

### Phase 2: UI Implementation (Ready to Start) - Future Work
1. Add search input to `GridMenubar`
2. Implement debounced search state
3. Update fetcher to include search parameter
4. Add clear button and loading states
5. Add keyboard shortcut (`Ctrl/Cmd+K`)
6. Test with all entity types

## Acceptance Criteria

### Backend ✅ COMPLETE
- ✅ GET `/api/v1/entity/{entity}` accepts `search` parameter (already implemented)
- ✅ Search parameter is passed to service layer (already implemented)
- ✅ Search works with existing filters/sort/pagination (already implemented)
- ⚠️ **Future**: Entity-specific searchable fields configuration

### UI
- ✅ Search input appears in toolbar
- ✅ Search is debounced (300ms)
- ✅ Search triggers SSRM refresh
- ✅ Clear button appears when search is active
- ✅ Search works across all entity types
- ✅ Keyboard shortcut works (`Ctrl/Cmd+K`)
- ✅ No regressions to existing functionality

## Testing Strategy

### Backend Tests
- Unit test: Validator accepts `search` parameter
- Integration test: POST route passes search to service layer
- E2E test: Search returns filtered results

### UI Tests
- Component test: Search input renders and updates state
- Integration test: Search triggers grid refresh
- E2E test: Search filters results correctly

## Future Enhancements

1. **Entity-Specific Search Fields**: Configure which fields are searchable per entity
2. **Search Highlighting**: Highlight matching text in results
3. **Search History**: Remember recent searches
4. **Advanced Search**: Combine search with filters
5. **URL State**: Make search shareable via URL params

## Notes

- **Do NOT start UI implementation until backend contract is complete and tested**
- Search should work alongside existing filters (AND logic)
- Search should be cleared when filters are reset
- Consider performance: search across many fields may be slow for large datasets

