# UI Design System

Atomic design system components organized by complexity: atoms, molecules, organisms, and patterns.

## Structure

```
ui/
├── atoms/         # Basic building blocks (Button, Input, Card, Icon)
├── molecules/     # Composite components (PageHeader, NavItem, TabSwitcher)
├── organisms/     # Complex sections (Navbar, Footer, PublicLayout, ErrorBoundary)
├── patterns/      # Reusable patterns (SectionHeader)
└── shared/        # Shared utilities and helpers
```

## Usage

### Atoms
Basic UI primitives used throughout the app:
```typescript
import { Button, Card, Input, Spinner } from '@/components/ui/atoms';
```

**Key exports**: `Button`, `Card`, `Input`, `Label`, `Link`, `Logo`, `Icon`, `Badge`, `Skeleton`, `Spinner`, `Toggle`, `Slider`, `Progress`

### Molecules
Composite components combining atoms:
```typescript
import { PageHeader, NavItem, TabSwitcher } from '@/components/ui/molecules';
```

**Key exports**: `PageHeader`, `NavItem`, `Select`, `TextArea`, `LoadingStates`, `SkeletonSuite`, `TabSwitcher`, `MetricCard`, `ReadingProgress`

### Organisms
Complex sections with business logic:
```typescript
import { Navbar, Footer, PublicLayout } from '@/components/ui/organisms';
```

**Key exports**: `Navbar`, `Footer`, `PublicLayout`, `FAQ`, `ErrorFallback`, `AppErrorBoundary`, `ResultPanel`, `FullWidthSection`

### Patterns
Reusable design patterns:
```typescript
import { SectionHeader } from '@/components/ui/patterns';
```

## Styling

- **Tailwind CSS**: Primary styling with design tokens
- **CVA Variants**: Component variants defined in `styles/ui/**`
- **CSS Modules**: Used for complex sections (sidebar, landing)

## Server/Client

- **Atoms**: Mostly client-safe (Button, Input require client)
- **Molecules**: Mix of server and client components
- **Organisms**: Complex components, often client-only (Navbar, Footer)

## Related

- [Atoms](./atoms/README.md) - Basic building blocks
- [Molecules](./molecules/README.md) - Composite components
- [Organisms](./organisms/README.md) - Complex sections
