---
title: "Accessibility"
description: "Documentation and resources for documentation functionality. Located in accessibility/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
# Accessibility Guide

> **Complete guide to accessibility standards, testing tools, and best practices for the Corso platform**

## 📋 Quick Reference

**Key Commands:**
```bash
# Check color contrast
pnpm a11y:contrast

# Analyze CSS size
pnpm a11y:css-size

# Run accessibility tests
pnpm test -- --grep a11y
```

## 🎯 Accessibility Principles

### Core Principles

1. **Perceivable**: Information must be presentable in ways users can perceive
2. **Operable**: Interface components must be operable by all users
3. **Understandable**: Information and UI operation must be understandable
4. **Robust**: Content must be robust enough for assistive technologies

### WCAG 2.1 Compliance

**Target Level:** WCAG 2.1 AA (minimum)

**Key Requirements:**
- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation: All interactive elements accessible via keyboard
- Screen reader support: Proper ARIA labels and semantic HTML
- Focus management: Visible focus indicators
- Error identification: Clear error messages and validation

## ♿ Accessibility Standards

### Semantic HTML

**✅ CORRECT: Use semantic HTML elements**
```typescript
// Navigation
<nav aria-label="Primary navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

// Headings
<h1>Page Title</h1>
<h2>Section Title</h2>

// Forms
<form>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
</form>
```

**❌ INCORRECT: Using divs for semantic elements**
```typescript
// Don't use divs for navigation
<div onClick={handleClick}>Dashboard</div>

// Don't use divs for headings
<div className="text-2xl font-bold">Title</div>
```

### ARIA Labels

**When to Use ARIA:**
- When semantic HTML isn't sufficient
- For complex interactive components
- For dynamic content updates
- For custom components

**✅ CORRECT: Proper ARIA usage**
```typescript
// Button with icon only
<button aria-label="Close dialog">
  <XIcon />
</button>

// Form field with error
<input
  id="email"
  aria-invalid={hasError}
  aria-errormessage={hasError ? "email-error" : undefined}
/>
{hasError && (
  <p id="email-error" role="alert" aria-live="polite">
    Invalid email address
  </p>
)}

// Loading state
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : content}
</div>
```

**❌ INCORRECT: Redundant or missing ARIA**
```typescript
// Redundant - button already has accessible name
<button aria-label="Submit">Submit</button>

// Missing - icon button without label
<button onClick={handleClose}>
  <XIcon />
</button>
```

### Keyboard Navigation

**✅ CORRECT: Keyboard accessible**
```typescript
function Button({ onClick, children }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {children}
    </button>
  );
}
```

**Focus Management:**
```typescript
// Trap focus in modal
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {children}
    </div>
  );
}
```

### Color Contrast

**Requirements:**
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**✅ CORRECT: High contrast colors**
```typescript
// Use Tailwind classes with proper contrast
<p className="text-foreground">Text with good contrast</p>
<button className="bg-primary text-primary-foreground">
  Accessible button
</button>
```

**Testing:**
```bash
# Check contrast ratios
pnpm a11y:contrast
```

## 🧪 Accessibility Testing

### Automated Testing

**Vitest + Axe:**
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { expect } from 'vitest';

expect.extend(toHaveNoViolations);

describe('Component Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing

**Keyboard Navigation:**
1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Test Enter/Space activation
4. Verify focus order is logical
5. Test Escape key for modals/dialogs

**Screen Reader Testing:**
1. Test with NVDA (Windows) or VoiceOver (Mac)
2. Verify all content is announced
3. Check form labels and error messages
4. Verify navigation landmarks
5. Test dynamic content updates

**Visual Testing:**
1. Test with browser zoom (200%)
2. Test with high contrast mode
3. Test with color blindness simulators
4. Verify text is readable at all sizes

## 📝 Component Patterns

### Form Fields

**✅ CORRECT: Accessible form field**
```typescript
import { FormFieldBase } from '@/components/forms/primitives/field-base';

<FormFieldBase field={field} variants={variants}>
  {(fieldId, describedBy, errorId) => (
    <input
      id={fieldId}
      aria-describedby={describedBy || undefined}
      aria-invalid={errorId ? 'true' : undefined}
      aria-errormessage={errorId || undefined}
    />
  )}
</FormFieldBase>
```

**Features:**
- Automatic label association
- Help text support
- Error message handling
- ARIA attributes

### Buttons

**✅ CORRECT: Accessible button**
```typescript
// Icon button with label
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon />
</button>

// Button with visible text
<button onClick={onSubmit}>
  Submit Form
</button>

// Loading state
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

### Navigation

**✅ CORRECT: Accessible navigation**
```typescript
<nav aria-label="Primary navigation">
  <ul>
    <li>
      <a href="/dashboard" aria-current={isActive ? 'page' : undefined}>
        Dashboard
      </a>
    </li>
  </ul>
</nav>

// Breadcrumb navigation
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li aria-current="page">Current Page</li>
  </ol>
</nav>
```

### Modals and Dialogs

**✅ CORRECT: Accessible modal**
```typescript
function Modal({ isOpen, onClose, title, children }) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <h2 id={titleId}>{title}</h2>
      <div id={descriptionId}>{children}</div>
      <button onClick={onClose} aria-label="Close dialog">
        Close
      </button>
    </div>
  );
}
```

## 🎨 Visual Accessibility

### Color Contrast Testing

**Testing Tools:**
- Browser DevTools (Accessibility panel)
- WebAIM Contrast Checker
- `pnpm a11y:contrast` script

**Common Issues:**
- Light gray text on white background
- Colored text without sufficient contrast
- Placeholder text with low contrast

### Focus Indicators

**✅ CORRECT: Visible focus indicators**
```css
/* Default browser focus */
button:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Custom focus styles */
button:focus-visible {
  outline: 2px solid theme('colors.primary');
  outline-offset: 2px;
}
```

### Reduced Motion

**✅ CORRECT: Respect prefers-reduced-motion**
```typescript
import { useReducedMotion } from '@/hooks/accessibility';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      style={{
        transition: prefersReducedMotion ? 'none' : 'all 0.3s ease',
      }}
    >
      Content
    </div>
  );
}
```

## 🔧 Tools & Scripts

### Available Scripts

**Contrast Checking:**
```bash
pnpm a11y:contrast
```

**CSS Size Analysis:**
```bash
pnpm a11y:css-size
```

### ESLint Rules

**jsx-a11y Plugin:**
- `jsx-a11y/alt-text` - Require alt text for images
- `jsx-a11y/aria-props` - Validate ARIA props
- `jsx-a11y/aria-proptypes` - Validate ARIA prop types
- `jsx-a11y/aria-unsupported-elements` - Prevent ARIA on unsupported elements
- `jsx-a11y/click-events-have-key-events` - Require keyboard handlers
- `jsx-a11y/heading-has-content` - Require heading content
- `jsx-a11y/img-redundant-alt` - Prevent redundant alt text
- `jsx-a11y/interactive-supports-focus` - Require focusable interactive elements
- `jsx-a11y/label-has-associated-control` - Require label association
- `jsx-a11y/no-autofocus` - Prevent autofocus
- `jsx-a11y/no-redundant-roles` - Prevent redundant roles

## 📊 Accessibility Checklist

### Component Checklist

- [ ] Semantic HTML used appropriately
- [ ] ARIA labels provided where needed
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Error messages accessible
- [ ] Loading states announced
- [ ] Dynamic content updates announced

### Page Checklist

- [ ] Page has descriptive title
- [ ] Headings are hierarchical (h1 → h2 → h3)
- [ ] Navigation landmarks present
- [ ] Skip links available
- [ ] Language attribute set
- [ ] All images have alt text
- [ ] Forms are properly labeled
- [ ] Error states are clear

## 🚨 Common Issues & Fixes

### Missing Alt Text

**❌ INCORRECT:**
```typescript
<img src="/logo.png" />
```

**✅ CORRECT:**
```typescript
<img src="/logo.png" alt="Corso logo" />
<img src="/decorative.png" alt="" role="presentation" />
```

### Missing Labels

**❌ INCORRECT:**
```typescript
<input type="email" placeholder="Email" />
```

**✅ CORRECT:**
```typescript
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### Missing Focus Indicators

**❌ INCORRECT:**
```css
button:focus {
  outline: none;
}
```

**✅ CORRECT:**
```css
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

### Low Contrast

**❌ INCORRECT:**
```typescript
<p className="text-gray-300">Low contrast text</p>
```

**✅ CORRECT:**
```typescript
<p className="text-foreground">High contrast text</p>
```

## 📚 Best Practices

### ✅ DO

- Use semantic HTML elements
- Provide ARIA labels for icon-only buttons
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios
- Provide focus indicators
- Announce dynamic content updates
- Use proper heading hierarchy

### ❌ DON'T

- Use divs for interactive elements
- Rely solely on color for information
- Remove focus indicators
- Use placeholder text as labels
- Create keyboard traps
- Ignore screen reader announcements
- Use low contrast colors
- Skip accessibility testing

## 🔗 Related Documentation

- [Component Design System](../ui/component-design-system.md) - Component accessibility patterns
- [Testing Strategy](../testing-quality/testing-strategy.md) - Accessibility testing
- [Form Components](../forms/form-field-base.md) - Accessible form patterns

---

**Last updated:** 2025-01-15
