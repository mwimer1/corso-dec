# Icon Components

## Purpose

Icon component system using Lucide React icons with consistent sizing, styling, and accessibility.

## Key Files

- Individual icon components exported from `index.ts`
- Icon wrapper utilities for consistent styling

## Usage

```tsx
import { MessageSquareIcon, UserIcon } from '@/components/ui/atoms/icon';

<MessageSquareIcon className="h-4 w-4" />
```

## Features

- Lucide React icon library integration
- Consistent sizing via className props
- Accessibility support (ARIA labels when needed)

## Styling

- Inherits text color from parent
- Size controlled via Tailwind classes (`h-4 w-4`, etc.)
- Stroke width consistent across icon set

## Client/Server Notes

- Icons are client components (SVG rendering)
- No server-only dependencies
