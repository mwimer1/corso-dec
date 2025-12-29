---
status: "active"
last_updated: "2025-12-29"
category: "documentation"
title: "Qa"
description: "Documentation and resources for documentation functionality. Located in qa/."
---
# Pricing Page QA Checklist

**Date:** 2025-01-XX  
**PR:** Pricing Page Above-the-Fold Spacing & Navbar Audit  
**Status:** Ready for Manual Verification

## Changes Summary

### PR 1: Above-the-Fold Spacing Fix
- ✅ Header section padding reduced from `"lg"` (4rem) to `"md"` (3rem)
- ✅ Tiers section padding set to `"none"` (removes stacked 3rem padding)
- **Result:** Reduced vertical whitespace from ~7rem (112px) to ~3rem (48px)

### PR 2: Navbar Consistency Fix
- ✅ Changed `navMode` from `"minimal"` to `"landing"`
- ✅ Added `navItems={landingNavItems}` for explicit consistency
- ✅ Updated README documentation to match current implementation
- **Result:** Pricing page now shows full marketing nav (Insights, FAQ, Pricing links)

## Manual QA Checklist

### 1. Above-the-Fold Visibility ✅ / ❌

**Test on multiple viewport sizes:**

- [ ] **1366×768 (typical laptop)**
  - Pricing cards are visible (at least partially) without scrolling
  - Header section doesn't dominate the viewport
  - Toggle and cards appear visually connected (~3rem gap)

- [ ] **1440×900 (larger laptop)**
  - Cards fully visible above fold
  - Spacing looks balanced, not cramped

- [ ] **1920×1080 (desktop)**
  - Layout scales appropriately
  - No excessive whitespace

- [ ] **768×1024 (tablet portrait)**
  - Cards stack appropriately
  - Header doesn't push content too far down

- [ ] **390×844 (mobile)**
  - Content flows naturally
  - No large blank gaps

**Expected:** At minimum, on 1366×768 and 1440×900, pricing cards should be visible without scrolling.

---

### 2. Navbar Links & Functionality ✅ / ❌

**Desktop view:**

- [ ] Navbar displays three links: **Insights**, **FAQ**, **Pricing** (in that order)
- [ ] Links are visible and clickable
- [ ] Navbar styling matches landing page (background, sticky behavior, shadow on scroll)

**Mobile view:**

- [ ] Hamburger menu contains all three nav links
- [ ] Links are accessible and functional

**Link behavior:**

- [ ] **Insights** link navigates to `/insights` (or correct Insights page)
- [ ] **FAQ** link navigates to `/pricing#faq` and scrolls to FAQ section
- [ ] **Pricing** link (when already on pricing page) either:
  - Does nothing (stays on page), OR
  - Soft reloads without breaking

**Expected:** Navbar should match landing page exactly, with all links functional.

---

### 3. FAQ Scroll Behavior ✅ / ❌

**Initial load with hash:**

- [ ] Navigate directly to `/pricing#faq`
- [ ] Page automatically scrolls to FAQ section
- [ ] FAQ heading is visible (not hidden under sticky navbar)
- [ ] Scroll is smooth (not instant jump)

**Clicking FAQ link from navbar:**

- [ ] Click "FAQ" in navbar while on `/pricing`
- [ ] URL updates to `/pricing#faq`
- [ ] Page scrolls to FAQ section
- [ ] FAQ heading is visible

**Note:** Current implementation only smooth-scrolls on initial load. Clicking FAQ link may cause instant jump (this is a known limitation for future enhancement).

**Expected:** FAQ section should be accessible and visible when navigated to via hash.

---

### 4. Auth State Rendering ✅ / ❌

**Logged-out state:**

- [ ] Navbar shows "Sign in" and "Start for free" buttons on the right
- [ ] Buttons are clickable and functional
- [ ] Mobile menu also shows these CTAs

**Logged-in state:**

- [ ] Navbar shows user avatar/account button (UserButton) instead of sign-up button
- [ ] UserButton is clickable and shows account menu
- [ ] No "Sign in" or "Start for free" buttons visible

**Expected:** Auth state should match landing page behavior exactly.

---

### 5. Plan Selection & Routing ✅ / ❌

**Plan selection flow:**

- [ ] Click "Start free" button on any pricing plan card
- [ ] URL redirects to `/sign-in?plan={planSlug}&redirect=/pricing`
- [ ] Plan slug is correctly included in URL
- [ ] After sign-in, user is redirected back to `/pricing`

**Billing cycle toggle:**

- [ ] Toggle switches between "Monthly" and "Annual (Save 20%)"
- [ ] Prices update correctly based on selected cycle
- [ ] Toggle state persists (if applicable)

**Expected:** Plan selection should route correctly with proper query parameters.

---

### 6. Visual Consistency ✅ / ❌

**Spacing verification:**

- [ ] Header section has appropriate top padding (not too large)
- [ ] Gap between toggle and plan cards is ~3rem (48px) - feels intentional, not cramped
- [ ] Gap between plan cards section and FAQ section is ~3rem (acceptable)
- [ ] Overall vertical rhythm feels consistent with other marketing pages

**Layout integrity:**

- [ ] No horizontal overflow on any viewport size
- [ ] Plan cards align correctly in grid
- [ ] FAQ section renders correctly
- [ ] Footer appears correctly (if applicable)

**Expected:** Page should look polished and consistent with design system.

---

### 7. Accessibility ✅ / ❌

**Keyboard navigation:**

- [ ] Tab through navbar links - all are focusable
- [ ] "Skip to content" link works (if present)
- [ ] Focus indicators are visible

**Screen reader:**

- [ ] Navbar has appropriate ARIA labels
- [ ] Page structure is logical (h1 for "Choose Your Plan")
- [ ] FAQ section is properly identified

**Expected:** Page should be accessible and keyboard-navigable.

---

## Code Quality Verification

### Automated Checks ✅

- [x] **TypeScript compilation:** ✅ Passes
- [x] **Linting:** ✅ Passes (1 pre-existing warning unrelated to changes)
- [x] **Type safety:** ✅ All imports and props correctly typed

### Test Status

- [x] **No new test failures:** ✅ Confirmed
- [x] **Pre-existing failures documented:** Chat hydration tests (unrelated)

---

## Known Limitations / Future Enhancements

### Nice-to-Have (Separate PRs)

1. **Active Nav State**
   - Currently, "Pricing" link in navbar is not visually highlighted when on pricing page
   - Enhancement: Add active state styling to indicate current page

2. **Smooth Scroll on Hash Change**
   - Current `ScrollToFAQ` component only smooth-scrolls on initial page load
   - Clicking FAQ link from navbar causes instant jump (browser default)
   - Enhancement: Extend scroll handler to also respond to hash changes via `hashchange` event

---

## QA Sign-Off

**Tester:** _________________  
**Date:** _________________  
**Status:** ✅ Pass / ❌ Fail / ⚠️ Pass with Notes

**Notes:**
```
[Add any issues found or observations here]
```

---

## Deployment Readiness

- [x] Code changes complete
- [x] TypeScript compilation passes
- [x] Linting passes
- [x] Documentation updated (README)
- [ ] Manual QA completed
- [ ] QA sign-off received
- [ ] Ready for merge

---

## Files Changed

1. `app/(marketing)/pricing/page.tsx` - Navbar mode and items
2. `components/marketing/sections/pricing/pricing-page.tsx` - Section padding adjustments
3. `app/(marketing)/README.md` - Documentation update

---

## Rollback Plan

If issues are found:
1. Revert `navMode` to `"minimal"` in `app/(marketing)/pricing/page.tsx`
2. Revert padding changes in `components/marketing/sections/pricing/pricing-page.tsx`
3. All changes are isolated to pricing page - no global impact

