---
title: "components"
last_updated: "2026-01-03"
category: "automation"
---

# Components Directory

Organized component library following atomic design principles combined with domain grouping.

## Directory Structure

### `components/ui/`
Design system primitives organized by atomic design:
- `atoms/` - Basic building blocks (Button, Input, Card, etc.)
- `molecules/` - Composed components (NavItem, Select, etc.)
- `organisms/` - Complex components (Navbar, Footer, etc.)
- `patterns/` - Reusable patterns (SectionHeader, SectionShell)

### `components/landing/`
**Homepage-specific components** used exclusively on the landing page (`/`).

**When to use**: Components that appear only on the homepage.
- Hero section
- Product Showcase
- ROI Calculator
- Market Insights

**Usage**: Import from `@/components/landing` in `app/(marketing)/page.tsx`.

### `components/marketing/`
**Marketing page components** used on marketing routes beyond the homepage.

**When to use**: Components for marketing pages like `/pricing`, `/contact`, `/legal/*`.
- Pricing sections
- Contact forms
- Legal page content

**Usage**: Import from `@/components/marketing` in marketing route pages.

### Decision Tree: Landing vs Marketing

**Use `components/landing/` when:**
- Component is used exclusively on the homepage (`/`)
- Component is homepage-specific (e.g., Hero, Product Showcase)

**Use `components/marketing/` when:**
- Component is used on other marketing routes (`/pricing`, `/contact`, `/legal/*`)
- Component is reusable across multiple marketing pages

**Use `components/ui/` when:**
- Component is a design system primitive
- Component is reusable across the entire application (not just marketing)

### Other Domain Directories

- `components/dashboard/` - Dashboard-specific components
- `components/chat/` - Chat interface components
- `components/auth/` - Authentication-related components
- `components/forms/` - Form components and utilities
- `components/billing/` - Billing and subscription components

