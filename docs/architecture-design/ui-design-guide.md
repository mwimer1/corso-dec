---
title: "Architecture Design"
description: "Documentation and resources for documentation functionality. Located in architecture-design/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
# UI Design Guide

This guide consolidates design principles, component patterns, and styling guidelines for consistent UI development across Corso applications.

## 🎨 Design System Principles

### Token Usage
- **Always use design tokens**: No hardcoded colors (`text-[#1C1D1F]` ❌ → `text-foreground` ✅)
- **Token categories**:
  - Colors: `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`
  - Spacing: Use Tailwind utilities or custom tokens
  - Typography: Consistent font scales and weights

### Responsive Design
- **Typography scaling**: Use `clamp()` for responsive headings
  ```css
  fontSize: 'clamp(1.875rem, calc(1.2rem + 2.2vw), 3rem)'
  ```
- **Layout breakpoints**: Follow Tailwind's responsive utilities
- **Touch targets**: Minimum 44px for mobile interactions

## 🧩 Component Patterns

### Authentication Components
- **Shell**: Use `components/auth/auth-shell.tsx` with tokenized card chrome
- **Password fields**: Use `components/auth/password-field.tsx` with visibility toggle
- **Error handling**: Use `components/auth/form-error.tsx` banner alongside toasts

### Chat Components
- **ChatWindow**: Main interface with message list, suggestions, and composer
- **ChatDock**: Anchored container for dashboard positioning (deprecated; use `ChatInputContainer` / `ChatWindow`)
- **Variants**: Use `chatBubbleVariants` and `followUpSuggestionVariants`
- **Accessibility**: Provide `aria-label`s and retain `role="complementary"`

### Landing Page Components
- **Section wrapper**: Use `LandingSection` with `tone` variants and `guidelines` prop
- **Animations**: Pure CSS animations with `prefers-reduced-motion` support
- **Images**: Use `loading="eager"`, `decoding="async"`, and proper alt text

## 🎭 Animation & Motion

### CSS-Only Animations
- **Performance**: Zero runtime overhead with Tailwind animation classes
- **Reduced motion**: Always respect `prefers-reduced-motion` media query
- **Common patterns**: `animate-fade-up`, `animate-fade-in`, entrance animations

### Interactive States
- **Hover effects**: Subtle feedback using CSS transforms and transitions
- **Focus states**: Clear keyboard navigation indicators
- **Loading states**: Skeleton screens or spinners during async operations

## 📱 Layout & Structure

### Landing Page Layout
- **Section order**: hero → showcase → use cases → insights → ROI → CTA → footer
- **Spacing rhythm**: Consistent vertical spacing using Tailwind utilities
- **Container widths**: Use responsive max-widths with centered alignment

### Dashboard Layout
- **Grid systems**: Flexible layouts that adapt to content and screen size
- **Navigation**: Clear information hierarchy with consistent patterns
- **Data density**: Balance whitespace with information density

## 🛠️ Development Guidelines

### Import Patterns
- **Barrel imports**: Use `@/components/ui` for design system components
- **Avoid self-barrels**: No barrel imports within `components/landing/**`
- **Edge-safe imports**: Keep client components free of server-only dependencies

### Quality Gates
- **No hardcoded values**: All colors and spacing use design tokens
- **Accessibility**: Reduced motion support, proper ARIA labels, semantic HTML
- **Performance**: Optimized image loading, efficient CSS animations
- **Validation**: Run `pnpm typecheck && pnpm lint && pnpm validate:cursor-rules`

## 🚫 Anti-Patterns

- No inline colors or arbitrary values
- No Framer Motion (use CSS animations)
- No self-barrel imports in component subdirectories
- No runtime style injection

## 📚 Related Resources

- [Pattern Library](../../styles/README.md) - Detailed style system implementation
- [Codebase Structure](../codebase-apis/codebase-structure.md) - Component organization patterns
