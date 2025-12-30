---
status: "draft"
last_updated: "2025-12-30"
category: "documentation"
---
# Components Clone Audit Summary

**Date**: 2025-01-28  
**Scope**: `components/**` directory  
**Tool**: jscpd (JavaScript Copy/Paste Detector)

---

## Quick Links

- **Full Refactor Plan**: [components-clone-refactor-plan.md](./components-clone-refactor-plan.md)
- **Pass A HTML Report**: `reports/jscpd/components/pass-a/html/index.html`
- **Pass B HTML Report**: `reports/jscpd/components/pass-b/html/index.html`
- **Baseline**: `reports/jscpd/components/BASELINE.txt`

---

## Executive Summary

### Metrics

**Pass A (Sensitive — 5 lines, 20 tokens minimum)**
- ✅ **44 clones** found
- ✅ **541 duplicated lines** (3.47% of total)
- ✅ **4,318 duplicated tokens** (3.15% of total)

**Pass B (Conservative — 10 lines, 50 tokens minimum)**
- ✅ **4 clones** found (P0 targets)
- ✅ **52 duplicated lines** (0.33% of total)
- ✅ **509 duplicated tokens** (0.37% of total)

### Interpretation

The shape (44 vs 4 clones) indicates:
- **Most duplication is small/medium** — often internal-in-file repeats
- **Only 4 high-confidence clones** — true cross-file duplication worth fixing
- **Low overall duplication** — 3.47% is below typical thresholds (5-10%)
- **Focus on Pass B** — highest ROI fixes

---

## Top 4 Priority Clones (Pass B)

| Rank | Files | Type | Priority | PR |
|------|-------|------|----------|-----|
| 1 | `grid-menubar.tsx` ↔ `entity-grid-host.tsx` | Cross-file (density hook) | **P0** | PR 1 |
| 2 | `grid-menubar.tsx` (internal) | Internal (reset grid) | **P0** | PR 1 |
| 3 | `industry-selector-panel.tsx` ↔ `use-case-explorer.tsx` | Cross-file (Industry type) | **P0** | PR 2 |
| 4 | `slider.tsx` (internal) | Internal (type duplication) | **P0** | PR 3 |

---

## Implementation Plan

### PR 1: Dashboard Grid (P0) — **Start Here**
- Extract `useGridDensity` hook
- Extract `resetGridState` helper
- **Impact**: Removes 2 Pass B clones
- **Estimated time**: 1-2 hours

### PR 2: Use-Cases Types (P0)
- Extract `Industry` interface to `types.ts`
- **Impact**: Removes 1 Pass B clone
- **Estimated time**: 15 minutes (pure TypeScript)

### PR 3: Slider Types (P0)
- Extract `SliderProps` interface
- **Impact**: Removes 1 Pass B clone
- **Estimated time**: 10 minutes (pure TypeScript)

### PR 4: Product Showcase (P1)
- Extract `DemoImage` component
- **Impact**: Reduces Pass A clones
- **Estimated time**: 20 minutes

**Total estimated effort**: 2-3 hours for P0 items

---

## Post-Refactor Success Criteria

After all P0 PRs:
- ✅ Pass B clone count: **0-1** (from 4)
- ✅ No cross-file duplication in grid/use-cases/slider
- ✅ Improved maintainability (single source of truth)
- ✅ No behavior changes (verified via tests)

---

## Additional Findings (Pass A — Deferred)

These are **intentional or acceptable** duplications:

- ✅ `insights-section.tsx` ↔ `landing-section.tsx` — Route-specific wrappers (KEEP)
- ✅ `insight-card.tsx` vs `pricing-card.tsx` — Domain-specific compositions (KEEP)
- ✅ Nav config files — Different content, same pattern (KEEP)
- ✅ Import header blocks — Boilerplate (KEEP)

**Decision**: Only refactor if pattern appears 3+ times and behavior likely to change.

---

## Next Steps

1. ✅ **Audit complete** — Reports generated
2. 📋 **Review refactor plan** — `components-clone-refactor-plan.md`
3. 🚀 **Start PR 1** — Dashboard grid (highest impact)
4. ✅ **Run validation** — Re-run Pass B after each PR

---

## Commands Reference

```bash
# Generate reports (sensitive)
pnpm dlx jscpd components --format typescript --format tsx --min-lines 5 --min-tokens 20 --reporters console,html,json --output reports/jscpd/components/pass-a

# Generate reports (conservative) - Use for CI gates
pnpm dlx jscpd components --format typescript --format tsx --min-lines 10 --min-tokens 50 --reporters console,html,json --output reports/jscpd/components/pass-b

# Validation after refactor
pnpm dlx jscpd components --format typescript --format tsx --min-lines 10 --min-tokens 50 --reporters console,json --output reports/jscpd/components/validation
```

---

**Last Updated**: 2025-01-28


