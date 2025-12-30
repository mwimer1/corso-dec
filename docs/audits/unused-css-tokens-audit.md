---
title: "Audits"
description: ">-"
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
---
# Unused CSS Tokens Audit

## Executive Summary

**Current Status:**
- **Total CSS tokens defined**: ~273 (across 16 token files)
- **Unused tokens found**: 113
- **Unused percentage**: ~41%
- **Assessment**: **Moderate concern** - 41% unused tokens suggests potential over-engineering or incomplete migration

## Context: Is 113 Unused Tokens a Lot?

### Industry Benchmarks
- **Healthy codebase**: < 10% unused tokens
- **Moderate concern**: 10-30% unused tokens
- **High concern**: > 30% unused tokens
- **Current status**: **41%** - Above moderate threshold

### Analysis
With 273 total tokens and 113 unused, this indicates:
1. **Possible over-engineering**: Tokens defined but never adopted
2. **Migration in progress**: Legacy tokens not yet removed
3. **Future-proofing**: Tokens defined for planned features
4. **Incomplete adoption**: Design system not fully integrated

## Audit Prompt

Use this prompt to investigate unused CSS tokens systematically:

```
# CSS Token Usage Audit

I need to investigate 113 unused CSS custom properties in our design system. 
The audit script found these tokens are defined but never referenced via var(--token-name).

## Current State
- Total tokens: ~273
- Unused tokens: 113 (41%)
- Token files: 16 files in styles/tokens/
- Allowlist: styles/tokens/UNUSED.allowlist.json

## Investigation Tasks

### Phase 1: Categorization
For each unused token, categorize into:
1. **Legacy/Deprecated** - Old tokens from previous design system
2. **Future/Planned** - Tokens for upcoming features
3. **Marketing Only** - Used only in docs/demos
4. **False Positive** - Actually used but not detected (inline styles, JS, etc.)
5. **Truly Unused** - Can be safely removed

### Phase 2: Pattern Analysis
Analyze unused tokens for patterns:

**Typography Tokens (unused):**
- text-2xl through text-9xl (8 tokens)
- All font-weight tokens (font-thin, font-light, etc.) (9 tokens)
- All line-height tokens (leading-*) (6 tokens)
- All letter-spacing tokens (tracking-*) (7 tokens)
- **Question**: Are these used via Tailwind classes instead of CSS vars?

**Animation Tokens (unused):**
- All delay-* tokens (delay-100, delay-200, etc.) (7 tokens)
- All duration-* semantic aliases (duration-xs, duration-sm, etc.) (6 tokens)
- All easing-* tokens (easing-ease, easing-linear, etc.) (5 tokens)
- **Question**: Are animations handled via Tailwind or inline styles?

**Button Tokens (unused):**
- btn-link-* (6 tokens: bg, bg-hover, border, border-hover, text, text-hover)
- btn-outline-* (6 tokens: same pattern)
- btn-primary-* (6 tokens: same pattern)
- **Question**: Are buttons using component-level styles instead of tokens?

**Radius Tokens (unused):**
- radius-2xl, radius-3xl, radius-base, radius-chip, radius-cta, radius-default, radius-full, radius-lg, radius-link, radius-md, radius-none, radius-pill, radius-sm, radius-xl (14 tokens)
- **Question**: Are border-radius values hardcoded or using Tailwind?

**Sidebar Tokens (unused):**
- sb-active, sb-border-hover, sb-footer-bg, sb-hover, sb-icon-size, sb-ink-muted, sb-inner-pad, sb-ring, sb-width-collapsed (9 tokens)
- **Question**: Is sidebar using different styling approach?

**Hero/Marketing Tokens (unused):**
- hero-accent-color, hero-bg-color, hero-container-max, hero-fg-color, hero-fg-muted-color, hero-gap (6 tokens)
- **Question**: Are these marketing-only and should be allowlisted?

**Breakpoint Tokens (unused):**
- bp-2xl, bp-lg, bp-md, bp-sm, bp-xl (5 tokens)
- **Question**: Are breakpoints handled via Tailwind config instead?

**Surface/Color Tokens (unused):**
- surface-card, surface-hover, surface-muted (3 tokens)
- accent, accent-foreground (2 tokens)
- danger-foreground, success-foreground, warning-foreground (3 tokens)
- info, input (2 tokens)
- pattern-surface (1 token)
- **Question**: Are these semantic colors used via Tailwind classes?

### Phase 3: Usage Investigation

For each category, investigate:

1. **Search for Tailwind class usage:**
   ```bash
   # Search for Tailwind classes that might use these tokens
   rg "text-(2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)" --type tsx
   rg "font-(thin|light|normal|medium|semibold|bold|extrabold|black)" --type tsx
   rg "leading-(none|tight|snug|normal|relaxed|loose)" --type tsx
   rg "rounded-(none|sm|md|lg|xl|2xl|3xl|full)" --type tsx
   ```

2. **Search for inline style usage:**
   ```bash
   # Check if tokens used in inline styles or JS
   rg "style.*var\(--" --type tsx
   rg "getComputedStyle.*--" --type ts
   ```

3. **Check component-level usage:**
   ```bash
   # Check if components define their own styles
   rg "\.(btn|button|sidebar|hero)" --type css
   ```

4. **Check Marketing usage:**
   ```bash
   # Check if tokens used in docs/marketing
   rg "var\(--(hero|marketing)" --type md
   ```

### Phase 4: Action Plan

Based on findings, create action plan:

1. **Add to allowlist** (if Marketing only):
   - Update `styles/tokens/UNUSED.allowlist.json`
   - Add pattern: `"hero-*"`, `"marketing-*"`

2. **Remove truly unused tokens:**
   - Delete from token files
   - Verify no breaking changes

3. **Migrate to token usage:**
   - Replace hardcoded values with tokens
   - Replace Tailwind classes with token-based utilities

4. **Document decisions:**
   - Add comments explaining why tokens are unused
   - Document migration path for future adoption

### Phase 5: Validation

After cleanup:
1. Re-run audit: `pnpm audit:tokens:list-unused`
2. Target: < 10% unused tokens
3. Verify no visual regressions
4. Update allowlist documentation

## Specific Questions to Answer

1. **Typography tokens**: Are we using Tailwind typography classes instead of CSS vars?
2. **Animation tokens**: Are animations handled via Tailwind or component styles?
3. **Button tokens**: Do button components use their own CSS instead of tokens?
4. **Radius tokens**: Are border-radius values hardcoded or using Tailwind utilities?
5. **Breakpoint tokens**: Are breakpoints defined in Tailwind config instead?
6. **Sidebar tokens**: Is sidebar using a different styling approach?
7. **Hero tokens**: Should these be allowlisted as marketing-only?

## Expected Outcomes

1. **Categorized list** of all 113 unused tokens with reasons
2. **Action plan** for each category (remove, allowlist, migrate)
3. **Updated allowlist** for intentional exceptions
4. **Migration guide** for adopting tokens where appropriate
5. **Target reduction** to < 30 unused tokens (< 10% of total)

## Tools & Commands

```bash
# Run unused tokens audit
pnpm audit:tokens:list-unused

# Search for token usage patterns
rg "var\(--token-name\)" --type tsx
rg "text-2xl|text-3xl" --type tsx
rg "rounded-lg|rounded-md" --type tsx

# Check Tailwind config
cat tailwind.config.ts | grep -A 20 "extend"

# Check component styles
find components -name "*.css" -o -name "*.module.css"
```

## Related Documentation

- [Pattern Library](../pattern-library.md) - Design system patterns
- [Token System Guide](../../styles/tokens/README.md)
- [Maintenance Documentation](../../scripts/maintenance/README.md)
```

## Quick Reference: Unused Token Categories

### Typography (30 tokens)
- Text sizes: `text-2xl` through `text-9xl` (8 tokens)
- Font weights: `font-thin` through `font-black` (9 tokens)
- Line heights: `leading-none` through `leading-loose` (6 tokens)
- Letter spacing: `tracking-tighter` through `tracking-widest` (7 tokens)

### Animation (18 tokens)
- Delays: `delay-100`, `delay-200`, `delay-xs`, `delay-sm`, `delay-md`, `delay-lg`, `delay-xl`, `delay-2xl` (8 tokens)
- Durations: `duration-xs`, `duration-sm`, `duration-md`, `duration-lg`, `duration-xl`, `duration-2xl` (6 tokens)
- Easing: `easing-ease`, `easing-ease-in`, `easing-ease-in-out`, `easing-ease-out`, `easing-linear` (5 tokens)

### Buttons (18 tokens)
- Link variant: `btn-link-*` (6 tokens)
- Outline variant: `btn-outline-*` (6 tokens)
- Primary variant: `btn-primary-*` (6 tokens)

### Radius (14 tokens)
- All radius variants: `radius-*` (14 tokens)

### Sidebar (9 tokens)
- All sidebar tokens: `sb-*` (9 tokens)

### Hero/Marketing (6 tokens)
- Hero tokens: `hero-*` (6 tokens)

### Breakpoints (5 tokens)
- All breakpoint tokens: `bp-*` (5 tokens)

### Colors/Surfaces (13 tokens)
- Surface variants: `surface-card`, `surface-hover`, `surface-muted`
- Accent colors: `accent`, `accent-foreground`
- Semantic foregrounds: `danger-foreground`, `success-foreground`, `warning-foreground`
- Other: `info`, `input`, `pattern-surface`

## Next Steps

1. **Immediate**: Run the audit prompt above to categorize all 113 tokens
2. **Short-term**: Update allowlist for intentional exceptions (Marketing)
3. **Medium-term**: Remove truly unused tokens (target: < 30 unused)
4. **Long-term**: Migrate hardcoded values to use tokens where appropriate
