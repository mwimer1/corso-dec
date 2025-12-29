---
title: "Components Clone Refactor Plan — Pass B Clones (P0)"
description: "Documentation and resources."
last_updated: "2025-12-29"
category: "documentation"
status: "draft"
---
# Components Clone Refactor Plan — Pass B Clones (P0)

**Date**: 2025-01-28  
**Based on**: jscpd Pass B report (conservative: 10 lines, 50 tokens minimum)  
**Target**: 4 high-confidence clones requiring refactoring

---

## PR 1: Dashboard Grid — Extract Density Hook & Reset Grid Helper

### Clone Details
- **Type**: Cross-file duplication + internal duplication
- **Files**:
  1. `components/dashboard/entities/shared/grid/entity-grid-host.tsx` (lines 44-66)
  2. `components/dashboard/entities/shared/grid/grid-menubar.tsx` (lines 143-174) — cross-file
  3. `components/dashboard/entities/shared/grid/grid-menubar.tsx` (lines 511-522 vs 692-703) — internal

### Part A: Extract Density Hook (Cross-file Clone)

#### Problem
Identical localStorage density management logic duplicated across two files:
- `entity-grid-host.tsx`: Uses `corso:gridDensity:${config.id}`
- `grid-menubar.tsx`: Uses `corso:gridDensity:${userId}:${props.gridId}`

The logic (SSR check, localStorage read/write, try/catch) is identical.

#### Solution

**1. Create new hook file:**
```typescript
// components/dashboard/entities/shared/grid/hooks/use-grid-density.ts
"use client";

import { useCallback, useState } from 'react';

type DensityMode = 'comfortable' | 'compact';

interface UseGridDensityOptions {
  /** Grid ID (required for storage key) */
  gridId: string;
  /** Optional user ID to include in storage key (for per-user density) */
  userId?: string;
  /** Initial density (defaults to 'comfortable') */
  initialDensity?: DensityMode;
  /** Optional callback when density changes */
  onDensityChange?: (density: DensityMode) => void;
}

/**
 * Hook for managing grid density with localStorage persistence.
 * Handles SSR safety and localStorage errors gracefully.
 */
export function useGridDensity({
  gridId,
  userId,
  initialDensity = 'comfortable',
  onDensityChange,
}: UseGridDensityOptions) {
  const storageKey = userId
    ? `corso:gridDensity:${userId}:${gridId}`
    : `corso:gridDensity:${gridId}`;

  const [density, setDensity] = useState<DensityMode>(() => {
    if (typeof window === 'undefined') return initialDensity;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'comfortable' || stored === 'compact') {
        return stored as DensityMode;
      }
    } catch {
      // Ignore localStorage errors
    }
    return initialDensity;
  });

  const handleDensityChange = useCallback(
    (newDensity: DensityMode) => {
      setDensity(newDensity);
      try {
        localStorage.setItem(storageKey, newDensity);
      } catch {
        // Ignore localStorage errors
      }
      onDensityChange?.(newDensity);
    },
    [storageKey, onDensityChange]
  );

  return {
    density,
    setDensity: handleDensityChange,
  };
}
```

**2. Update `entity-grid-host.tsx`:**

```typescript
// BEFORE (lines 44-66)
const densityStorageKey = `corso:gridDensity:${config.id}`;
const [density, setDensity] = React.useState<DensityMode>(() => {
  if (typeof window === 'undefined') return 'comfortable';
  try {
    const stored = localStorage.getItem(densityStorageKey);
    if (stored === 'comfortable' || stored === 'compact') {
      return stored as DensityMode;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'comfortable';
});

const handleDensityChange = React.useCallback((newDensity: DensityMode) => {
  setDensity(newDensity);
  try {
    localStorage.setItem(densityStorageKey, newDensity);
  } catch {
    // Ignore localStorage errors
  }
}, [densityStorageKey]);

// AFTER
import { useGridDensity } from './grid/hooks/use-grid-density';

// ... in component body (replace lines 44-66):
const { density, setDensity: handleDensityChange } = useGridDensity({
  gridId: config.id,
  onDensityChange: (newDensity) => {
    // Optional: handle density change if needed
  },
});
```

**3. Update `grid-menubar.tsx`:**

```typescript
// BEFORE (lines 143-174)
const densityStorageKey = `corso:gridDensity:${userId}:${props.gridId}`;
const [density, setDensity] = useState<DensityMode>(() => {
  if (typeof window === 'undefined') return 'comfortable';
  try {
    const stored = localStorage.getItem(densityStorageKey);
    if (stored === 'comfortable' || stored === 'compact') {
      return stored as DensityMode;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'comfortable';
});

// Sync density with parent if provided
useEffect(() => {
  if (props.density && props.density !== density) {
    setDensity(props.density);
  }
}, [props.density, density]);

// Persist density changes
const handleDensityChange = useCallback((newDensity: DensityMode) => {
  setDensity(newDensity);
  try {
    localStorage.setItem(densityStorageKey, newDensity);
  } catch {
    // Ignore localStorage errors
  }
  props.onDensityChange?.(newDensity);
}, [densityStorageKey, props]);

// AFTER
import { useGridDensity } from './hooks/use-grid-density';

// ... in component body (replace lines 143-174):
// Use hook if no density prop provided (standalone mode)
// Otherwise, use controlled density from parent
const { density: localDensity, setDensity: setLocalDensity } = useGridDensity({
  gridId: props.gridId,
  userId,
  onDensityChange: props.onDensityChange,
});

const density = props.density ?? localDensity;
const handleDensityChange = props.onDensityChange ?? setLocalDensity;
```

**Note**: The `grid-menubar.tsx` version needs to handle both controlled (via props) and uncontrolled modes. The hook handles the uncontrolled case; controlled mode uses props directly.

### Part B: Extract Reset Grid Helper (Internal Clone)

#### Problem
Identical "Reset grid" action code appears twice in `grid-menubar.tsx`:
- Line 511-522: Inside DropdownMenu.Item
- Line 692-703: As a standalone button

The code block:
```typescript
onClick={() => {
  try {
    props.gridRef?.current?.api.setFilterModel(null);
    props.gridRef?.current?.api.resetColumnState();
    props.setSearchQuery?.('');
    props.gridRef?.current?.api.refreshServerSide();
  } catch (error) {
    devError("Failed to reset the grid:", error);
  }
}}
```

#### Solution

**1. Extract helper function inside `grid-menubar.tsx`:**

```typescript
// Add after imports, before component (around line 109):
/**
 * Resets the grid state (filters, columns, search) and refreshes data.
 * Wraps grid API calls in try/catch for error handling.
 */
function resetGridState(props: GridMenubarProps) {
  try {
    props.gridRef?.current?.api.setFilterModel(null);
    props.gridRef?.current?.api.resetColumnState();
    props.setSearchQuery?.('');
    props.gridRef?.current?.api.refreshServerSide();
  } catch (error) {
    devError("Failed to reset the grid:", error);
  }
}
```

**2. Replace both occurrences:**

```typescript
// BEFORE (line ~511-522)
<DropdownMenu.Item
  onSelect={() => {
    try {
      props.gridRef?.current?.api.setFilterModel(null);
      props.gridRef?.current?.api.resetColumnState();
      props.setSearchQuery?.('');
      props.gridRef?.current?.api.refreshServerSide();
    } catch (error) {
      devError("Failed to reset the grid:", error);
    }
  }}
  className={cn(DROPDOWN_ITEM_BASE_CLASS, DROPDOWN_ITEM_INTERACTION_CLASS)}
>
  <ListRestart className="h-4 w-4" />
  <span>Reset</span>
</DropdownMenu.Item>

// AFTER
<DropdownMenu.Item
  onSelect={() => resetGridState(props)}
  className={cn(DROPDOWN_ITEM_BASE_CLASS, DROPDOWN_ITEM_INTERACTION_CLASS)}
>
  <ListRestart className="h-4 w-4" />
  <span>Reset</span>
</DropdownMenu.Item>

// BEFORE (line ~692-703)
<button
  onClick={() => {
    try {
      props.gridRef?.current?.api.setFilterModel(null);
      props.gridRef?.current?.api.resetColumnState();
      props.setSearchQuery?.('');
      props.gridRef?.current?.api.refreshServerSide();
    } catch (error) {
      devError("Failed to reset the grid:", error);
    }
  }}
  className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  aria-label="Reset grid"
  title="Reset filters, columns, and search"
>
  <ListRestart className="h-4 w-4" />
</button>

// AFTER
<button
  onClick={() => resetGridState(props)}
  className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  aria-label="Reset grid"
  title="Reset filters, columns, and search"
>
  <ListRestart className="h-4 w-4" />
</button>
```

### Success Criteria
- ✅ Pass B clone count drops from 4 to 2 (removes both grid-menubar clones)
- ✅ `useGridDensity` hook is reusable for future grid components
- ✅ Reset grid logic is DRY and easier to maintain
- ✅ No behavior changes (verified via existing tests)

---

## PR 2: Landing Use-Cases — Extract Industry Type

### Clone Details
- **Type**: Cross-file TypeScript interface duplication
- **Files**:
  1. `components/landing/sections/use-cases/industry-selector-panel.tsx` (lines 13-24)
  2. `components/landing/sections/use-cases/use-case-explorer.tsx` (lines 6-17)

### Problem
The `Industry` interface is defined identically in both files:
```typescript
interface Industry {
  key: UseCaseKey;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  impact: string;
  impactMetrics?: string[];
  previewImageSrc?: string;
  previewImageAlt?: string;
  previewImage?: { src: string; alt: string };
}
```

### Solution

**1. Create shared types file:**

```typescript
// components/landing/sections/use-cases/types.ts
import type { UseCaseKey } from '@/lib/marketing/client';

export interface Industry {
  key: UseCaseKey;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  impact: string;
  impactMetrics?: string[];
  previewImageSrc?: string;
  previewImageAlt?: string;
  previewImage?: { src: string; alt: string };
}
```

**2. Update `industry-selector-panel.tsx`:**

```typescript
// BEFORE (lines 13-24)
interface Industry {
  key: UseCaseKey;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  impact: string;
  impactMetrics?: string[];
  previewImageSrc?: string;
  previewImageAlt?: string;
  previewImage?: { src: string; alt: string };
}

// AFTER
import type { Industry } from './types';

// Remove the interface declaration (lines 13-24)
```

**3. Update `use-case-explorer.tsx`:**

```typescript
// BEFORE (lines 6-17)
interface Industry {
  key: UseCaseKey;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  impact: string;
  impactMetrics?: string[];
  previewImageSrc?: string;
  previewImageAlt?: string;
  previewImage?: { src: string; alt: string };
}

// AFTER
import type { Industry } from './types';

// Remove the interface declaration (lines 6-17)
```

### Success Criteria
- ✅ Pass B clone count drops from 4 to 3 (removes use-cases clone)
- ✅ Single source of truth for `Industry` type
- ✅ Type changes propagate automatically to both files
- ✅ No runtime changes (pure TypeScript refactor)

---

## PR 3: UI Atom — Fix Slider Type Duplication

### Clone Details
- **Type**: Internal TypeScript type duplication
- **File**: `components/ui/atoms/slider.tsx` (lines 18-31 vs 33-46)

### Problem
The props type definition is duplicated in the function signature:
- Lines 18-31: Type in `React.forwardRef<..., PropsType>`
- Lines 33-46: Same type repeated in function parameter

This is a TypeScript pattern issue, not runtime duplication.

### Solution

**Extract type to a single declaration:**

```typescript
// BEFORE (lines 16-47)
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "value" | "onValueChange"> & SliderVariantProps & {
    /** Controlled slider value (array of numbers, one per thumb). */
    value: number[];
    /** Handler for value change (controlled usage). Optional for read-only. */
    onValueChange?: (_value: number[]) => void;
    /** Handler fired when the user finishes interaction (commit). */
    onValueCommit?: (_value: number[]) => void;
    /** If true, shows numeric value labels above thumbs. */
    showTooltips?: boolean;
    /** Optional label formatter for tooltip text (e.g., (n) => `${n}\u00B0F`). */
    formatValue?: (value: number, index: number) => string;
    /** Optional size override for the thumb only (lets us keep a skinny track with larger knobs). */
    thumbSize?: SliderVariantProps["size"];
  }
>(function Slider(
  props: Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "value" | "onValueChange"> & SliderVariantProps & {
    /** Controlled slider value (array of numbers, one per thumb). */
    value: number[];
    /** Handler for value change (controlled usage). Optional for read-only. */
    onValueChange?: (_value: number[]) => void;
    /** Handler fired when the user finishes interaction (commit). */
    onValueCommit?: (_value: number[]) => void;
    /** If true, shows numeric value labels above thumbs. */
    showTooltips?: boolean;
    /** Optional label formatter for tooltip text (e.g., (n) => `${n}\u00B0F`). */
    formatValue?: (value: number, index: number) => string;
    /** Optional size override for the thumb only (lets us keep a skinny track with larger knobs). */
    thumbSize?: SliderVariantProps["size"];
  },
  ref: React.ForwardedRef<React.ElementRef<typeof SliderPrimitive.Root>>,
) {

// AFTER
/**
 * Slider component props.
 */
export interface SliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "value" | "onValueChange">,
    SliderVariantProps {
  /** Controlled slider value (array of numbers, one per thumb). */
  value: number[];
  /** Handler for value change (controlled usage). Optional for read-only. */
  onValueChange?: (_value: number[]) => void;
  /** Handler fired when the user finishes interaction (commit). */
  onValueCommit?: (_value: number[]) => void;
  /** If true, shows numeric value labels above thumbs. */
  showTooltips?: boolean;
  /** Optional label formatter for tooltip text (e.g., (n) => `${n}\u00B0F`). */
  formatValue?: (value: number, index: number) => string;
  /** Optional size override for the thumb only (lets us keep a skinny track with larger knobs). */
  thumbSize?: SliderVariantProps["size"];
}

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(function Slider(props: SliderProps, ref) {
```

### Success Criteria
- ✅ Pass B clone count drops from 4 to 3 (or 2 after PR1)
- ✅ Type definition declared once, referenced twice
- ✅ Better TypeScript maintainability (single source of truth)
- ✅ No runtime changes

---

## PR 4 (P1): Product Showcase — Extract Image Component

### Clone Details (from Pass A, but high value)
- **Type**: Internal duplication
- **File**: `components/landing/sections/product-showcase/product-showcase.tsx`
- **Pattern**: Repeated `<Image>` blocks with identical props (lines 76-84, 91-99, 106-114, 121-129)

### Problem
Four identical `<Image>` component blocks with only `src` and `alt` differing:
```typescript
<Image
  src="/demos/projects-interface.png"
  alt="Projects dashboard demo"
  width={1920}
  height={1080}
  className="mx-auto max-w-5xl w-full rounded-lg border border-border shadow-sm h-auto"
  priority={false}
  sizes="(max-width: 1024px) 100vw, 1024px"
/>
```

### Solution

**Extract inline helper component:**

```typescript
// Add inside component file, before tabsData constant:
/**
 * Reusable demo image component with consistent styling.
 */
function DemoImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      className="mx-auto max-w-5xl w-full rounded-lg border border-border shadow-sm h-auto"
      priority={false}
      sizes="(max-width: 1024px) 100vw, 1024px"
    />
  );
}

// Update tabsData (replace all 4 Image blocks):
const tabsData: TabItem[] = [
  {
    id: "projects",
    label: "Projects",
    content: <DemoImage src="/demos/projects-interface.png" alt="Projects dashboard demo" />,
  },
  {
    id: "companies",
    label: "Companies",
    content: <DemoImage src="/demos/companies-interface.png" alt="Companies dashboard demo" />,
  },
  {
    id: "addresses",
    label: "Addresses",
    content: <DemoImage src="/demos/addresses-interface.png" alt="Addresses dashboard demo" />,
  },
  {
    id: "corso-ai",
    label: "CorsoAI",
    content: <DemoImage src="/demos/corso-ai-interface.png" alt="CorsoAI interface demo" />,
  },
];
```

### Success Criteria
- ✅ Pass A internal clones drop (removes multiple clone groups)
- ✅ Image styling changes in one place
- ✅ `tabsData` becomes more readable (data-focused)
- ✅ No behavior changes

---

## Implementation Order

1. **PR 1** (P0) — Dashboard Grid — Highest impact (removes 2 Pass B clones)
2. **PR 2** (P0) — Use-Cases Types — Quick win (pure TypeScript)
3. **PR 3** (P0) — Slider Types — Quick win (pure TypeScript)
4. **PR 4** (P1) — Product Showcase — Good cleanup (Pass A reduction)

## Post-Refactor Validation

After each PR, run:
```bash
pnpm dlx jscpd components --format typescript --format tsx --min-lines 10 --min-tokens 50 --reporters console,json --output reports/jscpd/components/validation
```

Record the clone count in each PR description to track progress.

---

**Target**: Reduce Pass B from 4 clones to 0-1 clones (acceptable threshold for intentional domain specialization).

