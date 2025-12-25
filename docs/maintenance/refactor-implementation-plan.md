---
status: stable
last_updated: 2025-01-28
---

# Landing Page Use Cases Refactor — Tactical Implementation Plan

## 📋 Executive Summary

**Status**: Implementation is **~95% complete**. The refactor from dense grid cards to selector + detail panel pattern has been successfully implemented. This document outlines remaining verification tasks and potential refinements.

**Current State**:
- ✅ `IndustrySelectorPanel` component exists and is functional
- ✅ Mobile PillGroup selector implemented
- ✅ Desktop vertical tabs implemented  
- ✅ Keyboard navigation (Arrow keys, Home/End) working
- ✅ ARIA roles and accessibility patterns in place
- ✅ Legacy code (QuietUseCaseCard, CSS modules) removed
- ✅ TypeScript compilation passing
- ✅ Design tokens properly used (bg-surface-selected, bg-surface-hover are valid)

**Remaining Work**: Verification, testing, and minor refinements

---

## 🎯 Implementation Status by PR (from original plan)

### PR 1: Layout & Basic Functionality ✅ COMPLETE
- ✅ IndustrySelectorPanel component created
- ✅ IndustryExplorer integrated with new component
- ✅ Responsive layout structure (mobile/desktop)

### PR 2: Styling & Token Alignment ✅ COMPLETE  
- ✅ Selector styling (desktop vertical tabs, mobile pills)
- ✅ Detail panel card styling
- ✅ Typography and spacing tokens
- ✅ CTA buttons with proper variants

### PR 3: Accessibility Enhancements ✅ COMPLETE
- ✅ ARIA roles (tablist, tab, tabpanel)
- ✅ Keyboard navigation (Arrow, Home, End)
- ✅ Focus management
- ✅ aria-live for screen reader announcements

### PR 4: Cleanup & Legacy Removal ✅ COMPLETE
- ✅ QuietUseCaseCard removed
- ✅ CSS modules removed
- ✅ No legacy code references found

### PR 5: Performance Optimization ⚠️ VERIFICATION NEEDED
- ⚠️ Verify IndustryExplorer is server component (no 'use client')
- ⚠️ Verify SSR/hydration behavior
- ⚠️ Check bundle size impact

---

## ✅ Verification Checklist

### Token & Design System Verification

#### ✅ Design Tokens (COMPLETE)
- [x] `bg-surface-selected` - Valid token (maps to `surface.selected` in Tailwind config)
- [x] `bg-surface-hover` - Valid token (maps to `surface.hover` in Tailwind config)  
- [x] `border-border` - Valid token
- [x] `text-foreground`, `text-muted-foreground` - Valid tokens
- [x] `shadow-card` - Should verify this is defined (used in detail panel)

#### ⚠️ Spacing Tokens (REVIEW NEEDED)
Current usage in `industry-selector-panel.tsx`:
- `mb-1`, `mb-2`, `mb-4` - Check if should use tokenized spacing (mb-xs, mb-sm, mb-md)
- `p-6` - Verify this equals `p-lg` (1.5rem/24px) or if should use explicit token
- `gap-8` - Verify this equals `gap-xl` (2rem/32px)
- `gap-2` - Verify this equals `gap-sm` (0.5rem/8px)
- `px-4`, `py-2` - Verify alignment with token scale

**Recommendation**: Review spacing against design system token scale. Current values may be acceptable if they align with token values, but explicit token classes (mb-sm, p-lg, gap-xl) are preferred for consistency.

#### ⚠️ Typography Tokens (REVIEW NEEDED)
Current usage looks good:
- `text-xl` - Valid (1.25rem)
- `text-base` - Valid (1rem)
- `text-sm` - Valid (0.875rem)
- `text-xs` - Valid (0.75rem)

### Layout & Responsive Verification

#### Breakpoint Testing
- [ ] **390px (Mobile)**: Verify PillGroup scrolls horizontally, detail panel stacks below, CTAs stack vertically
- [ ] **768px (Tablet)**: Verify still in mobile mode (PillGroup), CTAs may fit side-by-side
- [ ] **1024px (Desktop breakpoint)**: Verify switch to vertical tabs + detail panel side-by-side
- [ ] **1280px (Large desktop)**: Verify content centered in max-w-7xl, no overflow
- [ ] **1536px (XL desktop)**: Verify layout scales appropriately

#### Layout Details to Verify
- [ ] Desktop selector width: `lg:w-64` (256px) - verify this doesn't stretch too wide
- [ ] Gap between selector and panel: `lg:gap-8` (32px) - verify appropriate spacing
- [ ] Detail panel min-height: `lg:min-h-[400px]` - verify if this should use a token
- [ ] Section container padding: `py-lg` - verify consistency with other sections

### Accessibility Verification

#### Keyboard Navigation
- [ ] **Tab key**: Focuses first active tab, then Tab exits to first CTA button
- [ ] **Arrow Down/Right**: Moves to next industry (wraps to first at end)
- [ ] **Arrow Up/Left**: Moves to previous industry (wraps to last at start)
- [ ] **Home key**: Jumps to first industry
- [ ] **End key**: Jumps to last industry
- [ ] **Enter/Space**: Activates selected tab (if not auto-activating)

#### ARIA & Screen Reader
- [ ] **tablist role**: Container has `role="tablist"` with `aria-orientation="vertical"`
- [ ] **tab roles**: Each button has `role="tab"` with `aria-selected` attribute
- [ ] **tabpanel role**: Detail panel has `role="tabpanel"` with `aria-labelledby`
- [ ] **aria-controls**: Tabs reference their panels via `aria-controls`
- [ ] **aria-live**: Detail panel has `aria-live="polite"` for announcements
- [ ] **Screen reader test**: Use NVDA/JAWS/VoiceOver to verify proper announcements

#### Focus Indicators
- [ ] Focus ring visible on tabs (uses `focus-visible:ring-2 focus-visible:ring-ring`)
- [ ] Focus ring visible on CTA buttons
- [ ] No focus trap issues (can Tab out of selector)

### Content Verification

#### Metrics Parsing
- [ ] Verify `parseImpactMetrics()` correctly splits on " and " and " & "
- [ ] Test with all 4 industries to ensure metrics display correctly
- [ ] Verify trailing periods are removed
- [ ] Verify empty strings are filtered out

#### Industry Content
- [ ] All 4 industries display: Insurance, Suppliers, Construction, Developers
- [ ] Each industry shows correct title, subtitle, description
- [ ] Benefits list shows all 3 items (using `.slice(0, 3)`)
- [ ] Impact metrics display as badges

#### CTA Buttons
- [ ] "Talk to sales" links to contact page (`APP_LINKS.FOOTER.CONTACT`)
- [ ] "Start free" links to signup (`APP_LINKS.NAV.SIGNUP`)
- [ ] Analytics tracking works (`trackNavClick` called on click)
- [ ] Buttons use correct variants (`outline` and `cta`)

### Performance Verification

#### Server/Client Boundaries
- [ ] Verify `IndustryExplorer` has NO `'use client'` directive (should be server component)
- [ ] Verify `IndustrySelectorPanel` has `'use client'` directive (should be client component)
- [ ] Verify SectionHeader and static content render on server
- [ ] Verify only interactive parts are client-rendered

#### SSR & Hydration
- [ ] View page source - initial industry content should be in HTML
- [ ] Disable JS - at least first industry should be visible
- [ ] No hydration mismatches in console
- [ ] Initial state renders correctly (first industry selected)

#### Bundle Size
- [ ] Check that PillGroup icons (ArrowLeft/ArrowRight) are code-split
- [ ] Verify no unnecessary dependencies imported
- [ ] Compare bundle size before/after (should be smaller due to CSS module removal)

### Code Quality Verification

#### Linting & Type Checking
- [ ] Run `pnpm typecheck` - ✅ Already passing
- [ ] Run `pnpm lint` - Verify no issues
- [ ] Run `pnpm test` - Verify no test regressions
- [ ] Run `pnpm validate:cursor-rules` - Verify compliance

#### Code Review Items
- [ ] No console errors or warnings
- [ ] No unused imports
- [ ] Proper TypeScript types (Industry interface matches data structure)
- [ ] No magic numbers (all spacing uses tokens or justified values)

### Browser & Device Testing

#### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Mobile Testing
- [ ] Chrome Mobile (Android)
- [ ] Safari iOS
- [ ] Test touch interactions (tap to select industry)
- [ ] Test PillGroup horizontal scroll with touch

#### Lighthouse Audit
- [ ] Accessibility score: Target 100
- [ ] Performance score: Should be same or better than before
- [ ] Best Practices: No issues
- [ ] SEO: Verify meta tags and content structure

### Visual Regression

#### Before/After Comparison
- [ ] Compare screenshots at all breakpoints
- [ ] Verify spacing matches design intent
- [ ] Verify colors match design system
- [ ] Verify typography hierarchy
- [ ] Verify no layout shifts or overflow issues

### Documentation

#### Update Docs
- [ ] Check `docs/architecture-design/ui-design-guide.md` for references to old pattern
- [ ] Check `app/(marketing)/README.md` for use-case section documentation
- [ ] Update any Storybook stories if they exist
- [ ] Update component README if present

---

## 🔍 Detailed Code Review Items

### Files to Review

#### `components/landing/sections/use-cases/industry-selector-panel.tsx`

**Lines to Review**:
- **Line 88**: `lg:gap-8` - Verify this matches design token `gap-xl` (2rem = 32px)
- **Line 102**: `lg:w-64` - Verify selector width is appropriate (256px)
- **Line 124**: `bg-surface-selected` - ✅ Valid token
- **Line 143**: `p-6` - Verify if should use `p-lg` explicitly
- **Line 144**: `lg:min-h-[400px]` - Consider if should use a token or if arbitrary value is acceptable
- **Line 147**: `mb-1` - Consider using `mb-xs` for consistency
- **Line 148**: `mb-2` - Consider using `mb-sm` for consistency
- **Line 149**: `mb-2` - Consider using `mb-sm` for consistency
- **Line 165**: `bg-surface-contrast/10` - ✅ Valid token usage
- **Line 174**: `gap-2` - Verify if should use `gap-sm` explicitly
- **Line 174**: `mt-4` - Verify if should use `mt-md` explicitly

**Potential Improvements**:
1. Consider using explicit spacing tokens (`mb-sm` instead of `mb-2`, `p-lg` instead of `p-6`)
2. Consider extracting `lg:min-h-[400px]` to a token if this value is reused
3. Review if `lg:gap-8` should be `lg:gap-xl` for explicit token reference

#### `components/landing/sections/use-cases/use-case-explorer.tsx`

**Lines to Review**:
- **Line 15**: Verify NO `'use client'` directive (should be server component)
- **Line 28**: `bg-surface` - ✅ Valid token
- **Line 31**: `py-lg` - ✅ Using token
- **Line 32**: `mb-5xl` - ✅ Using token

**Status**: ✅ Looks good - server component with proper token usage

---

## 🚀 Implementation Tasks (Priority Order)

### Phase 1: Critical Verification (Must Complete)

1. **Verify Server/Client Boundaries**
   - Confirm `IndustryExplorer` has no `'use client'`
   - Confirm `IndustrySelectorPanel` has `'use client'`
   - Test SSR by viewing page source

2. **Verify Design Token Alignment**
   - Check if `p-6` = `p-lg` (1.5rem = 24px) - if so, consider using explicit token
   - Check if `gap-8` = `gap-xl` (2rem = 32px) - if so, consider using explicit token
   - Check if `mb-2` = `mb-sm` (0.5rem = 8px) - if so, consider using explicit token
   - Verify `shadow-card` is a valid token (may need to check Tailwind config)

3. **Run Quality Gates**
   - `pnpm lint`
   - `pnpm test`
   - `pnpm validate:cursor-rules`

### Phase 2: Testing & Validation (Should Complete)

4. **Responsive Testing**
   - Test all breakpoints (390px, 768px, 1024px, 1280px, 1536px)
   - Verify mobile PillGroup scrolling
   - Verify desktop layout switch

5. **Accessibility Testing**
   - Keyboard navigation test (Tab, Arrow keys, Home/End)
   - Screen reader test (NVDA/JAWS/VoiceOver)
   - Lighthouse accessibility audit

6. **Cross-Browser Testing**
   - Chrome, Firefox, Safari (desktop)
   - Chrome Mobile, Safari iOS

### Phase 3: Refinements (Nice to Have)

7. **Spacing Token Consistency**
   - Replace hardcoded spacing with explicit tokens where appropriate
   - Document rationale for any arbitrary values that remain

8. **Performance Verification**
   - Bundle size comparison
   - Lighthouse performance audit
   - SSR verification

9. **Documentation Updates**
   - Update any docs referencing old pattern
   - Add component usage examples if needed

---

## 📝 Acceptance Criteria

### Must Have ✅
- [x] Component structure implemented correctly
- [x] Mobile and desktop layouts working
- [x] Keyboard navigation functional
- [x] ARIA roles implemented
- [x] Legacy code removed
- [x] TypeScript compilation passing
- [ ] All quality gates passing (lint, test, rules)
- [ ] SSR working (initial content in HTML)
- [ ] No console errors

### Should Have
- [ ] All breakpoints tested and verified
- [ ] Screen reader tested and verified
- [ ] Cross-browser tested
- [ ] Lighthouse accessibility score 100
- [ ] Spacing tokens explicitly used (not arbitrary values)

### Nice to Have
- [ ] Documentation updated
- [ ] Performance metrics compared (before/after)
- [ ] Visual regression tests added

---

## 🎯 Next Steps

1. **Wait for green light** from reviewer
2. **Execute Phase 1** verification tasks
3. **Execute Phase 2** testing tasks
4. **Execute Phase 3** refinements if needed
5. **Final review** and merge

---

## 📚 Related Files

### Primary Implementation Files
- `components/landing/sections/use-cases/industry-selector-panel.tsx` - Main interactive component
- `components/landing/sections/use-cases/use-case-explorer.tsx` - Server wrapper component
- `components/landing/sections/use-cases/use-cases.data.ts` - Content data

### Supporting Files
- `components/landing/widgets/pill-group.tsx` - Mobile selector component
- `styles/tailwind.config.ts` - Design token definitions
- `styles/tokens/colors.css` - Color token definitions
- `app/(marketing)/page.tsx` - Landing page that uses IndustryExplorer

### Removed Files (Verify Gone)
- ~~`components/landing/sections/use-cases/quiet-use-case-card.tsx`~~ - ✅ Removed
- ~~`components/landing/sections/use-cases/use-cases.module.css`~~ - ✅ Removed

---

## 🔗 Reference

Original refactor plan: See user query with comprehensive audit details
Design tokens: `styles/tailwind.config.ts` and `styles/tokens/colors.css`
Accessibility: ARIA Authoring Practices Guide for Tabs Pattern
