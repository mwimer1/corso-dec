# Tab Switcher Component

## Purpose

Tab navigation component for switching between content sections with keyboard support and accessibility.

## Key Files

- Tab switcher component with Radix UI primitives

## Usage

```tsx
import { TabSwitcher } from '@/components/ui/molecules/tab-switcher';

<TabSwitcher tabs={[...]} />
```

## Features

- Keyboard navigation (arrow keys, Home/End)
- Accessible ARIA attributes
- Animated transitions

## Styling

- Uses Tailwind CSS with UI design tokens
- Theme-aware active/inactive states

## Client/Server Notes

- Tab switcher is a client component (requires interactivity)
