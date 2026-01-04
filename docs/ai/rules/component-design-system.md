# Component Design System - Extended Documentation

This document contains extended import examples, component hierarchy details, and theming patterns. For the concise rule, see [`.cursor/rules/component-design-system.mdc`](../../.cursor/rules/component-design-system.mdc).

## Extended Import Examples

### UI System Imports

```typescript
// Use short alias UI barrels
import { Button } from '@/atoms';
import { FormField } from '@/molecules';
import { AnalyticsChart } from '@/organisms';

// Domain-specific imports
import { useDashboardContext } from '@/components/dashboard';
import { EnhancedOnboardingFlow } from '@/components/onboarding';
import { ContactForm } from '@/components/forms';
import { Hero } from '@/components/landing';

// Auth components
import { ClerkEventsHandler } from '@/components/auth';

// Billing components
import { PlanPicker, SubscriptionStatus } from '@/components/billing';

// Marketing components
import { PricingPage } from '@/components/marketing';

// Type imports
import type { NavItem } from '@/types/dashboard/table';
import type { OnboardingStepId } from '@/types/onboarding/flow/types';
```

### App Route Imports

```typescript
// Import heavy organisms via leaf modules (not the organisms aggregator)
import { ErrorFallback } from '@/components/ui/organisms/error-fallback';
```

### Internal Component Imports

```typescript
// Inside components/** - use leaf modules or relative paths
import { Button } from '@/components/ui/atoms/button';
import { LinkTrack } from '@/components/ui/molecules/link-track';
```

### Import Violations

```typescript
// ❌ Cross-domain imports
// import { logger } from '@/lib/monitoring';
// Note: contexts/ directory was removed - providers are now in app/providers/

// ❌ Deep paths when facades exist
// import { BarChart } from '@/components/ui/organisms/charts/bar-chart';

// ❌ Root barrel imports from within components/**
// import { Button } from '@/components/ui';
// import { LinkTrack } from '@/components';

// ❌ Organisms aggregator in app routes
// import { ErrorFallback } from '@/organisms';
```

## Component Hierarchy Details

### Component Organization

```typescript
components/
├── ui/                    # Atomic design system (120+ components)
│   ├── atoms/            # Basic primitives (29 components)
│   ├── molecules/        # Composed components (27+ components)
│   └── organisms/        # Complex sections (24+ components)
├── auth/                 # Authentication (5 components)
├── billing/              # Subscription & billing (4 components)
├── dashboard/            # Business intelligence (19 components)
├── forms/                # Form handling (5 components)
├── landing/              # Marketing sections (15+ components)
├── marketing/            # Lead capture (16 components)
├── onboarding/           # Multi-step wizard (29 components)
```

### Component Hierarchy
- **Atoms** → **Molecules** → **Organisms** → **Domain Modules**
- **Domain Modules**: Feature-complete sections (dashboard/, onboarding/, marketing/, etc.)
- **Current Structure**: auth/, billing/, dashboard/, forms/, landing/, marketing/, onboarding/, ui/
- Place route-specific components under route `_components/` when applicable

## Theming Patterns

### Theme Implementation
- Tokens target `:root[data-route-theme]`
- Default theme set on `<html data-route-theme="protected">` in `app/layout.tsx`
- Route groups like `(marketing)` set theme before paint via `next/script` (strategy: `beforeInteractive`)
- Maintain theme during client navigations with client helpers (e.g., `app/(marketing)/_theme.tsx`)
- Keep theme logic confined to layout glue; don't move providers or auth for theming

### Theme Structure

```typescript
// app/layout.tsx
<html data-route-theme="protected">
  {/* Default theme */}
</html>

// app/(marketing)/_theme.tsx
'use client';
import { useEffect } from 'react';

export function ThemeProvider() {
  useEffect(() => {
    document.documentElement.setAttribute('data-route-theme', 'marketing');
  }, []);
  return null;
}
```

## Accessibility & Testing

### Accessibility Requirements
- Provide ARIA labels where needed
- Include axe checks in component tests
- Use semantic HTML elements
- Ensure keyboard navigation support

### Testing Standards

```typescript
// Use Testing Library + Vitest; include behavior and a11y tests
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('component has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Animations

### Animation Guidelines
- Use React Spring (`@react-spring/web`) for complex animations
- Respect `prefers-reduced-motion` with built-in support
- Place animation logic in Client Components (`"use client"`)
- Keep Server Components for static content

```typescript
import { useSpring, animated } from '@react-spring/web';

function AnimatedComponent() {
  const spring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 300, friction: 30 }
  });

  return (
    <animated.div style={spring}>
      Content
    </animated.div>
  );
}
```
