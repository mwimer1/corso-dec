# Components

Shared React components organized by domain and design system hierarchy.

## Directory Structure

```
components/
├── auth/          # Authentication UI (Clerk integration)
├── billing/       # Subscription and payment components
├── chat/          # AI chat interface components
├── dashboard/     # Dashboard-specific components (tables, grids, entity management)
├── forms/         # Form components and primitives
├── insights/      # Blog/article content components
├── landing/       # Landing page sections and widgets
├── marketing/     # Marketing page sections
└── ui/            # Design system (atoms, molecules, organisms, patterns)
```

## Import Guidelines

### Feature Domains
Prefer domain-specific imports for feature components:
```typescript
import { ContactForm } from '@/components/forms';
import { ChatWindow } from '@/components/chat';
import { EntityGrid } from '@/components/dashboard';
```

### Design System
Use the main barrel for shared UI components:
```typescript
import { Button, Card, Footer } from '@/components';
```

For design system sub-exports:
```typescript
import { Button } from '@/components/ui/atoms';
import { PageHeader } from '@/components/ui/molecules';
import { PublicLayout } from '@/components/ui/organisms';
```

## Styling

- **Tailwind CSS**: Default styling approach with design tokens
- **Variants**: CVA (class-variance-authority) variants in `styles/ui/**`
- **CSS Modules**: Used sparingly for complex sections (e.g., sidebar, landing sections)

## Server/Client Boundaries

- **Client components**: Must include `"use client"` directive
- **Server components**: Default (no directive needed)
- **Design system**: Most UI components are client-safe; check individual component docs

## Related Documentation

- [UI Design System](./ui/README.md) - Atoms, molecules, organisms
- [Dashboard Components](./dashboard/README.md) - Entity management, grids, tables
- [Forms](./forms/README.md) - Form components and validation
