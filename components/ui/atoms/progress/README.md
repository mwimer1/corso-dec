# Progress Components

## Purpose

Progress indicators (bars, spinners) for loading states and task completion visualization.

## Key Files

- Progress bar component
- Spinner component (if present)

## Usage

```tsx
import { Progress } from '@/components/ui/atoms/progress';

<Progress value={75} max={100} />
```

## Styling

- Uses Tailwind CSS with UI design tokens
- Animated transitions for value changes
- Theme-aware (light/dark mode)

## Client/Server Notes

- Progress components are client components (animated states)
