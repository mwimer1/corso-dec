---
status: "draft"
last_updated: "2026-01-04"
category: "documentation"
title: "Scripts"
description: "Documentation and resources for documentation functionality. Located in scripts/."
---
# Test Scripts & Validation Tools

> **Test infrastructure scripts, pattern enforcement, and validation utilities.**

## 📋 Quick Reference

**Key Points:**

- **Pattern Enforcement**: Test file naming and pattern validation
- **Flake Detection**: Test flakiness detection and analysis
- **Style Validation**: Design system contract validation

## 📑 Table of Contents

- [Overview](#overview)
- [Script Files](#script-files)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

Test scripts provide validation, pattern enforcement, and analysis tools for the test suite. These scripts ensure consistent test patterns, detect flaky tests, and validate design system contracts.

## Script Files

| File | Purpose | Coverage |
|------|---------|----------|
| `enforce-test-patterns.ts` | Pattern enforcement | Test file naming, request patterns, mock usage |
| `detect-flakes.ts` | Flake detection | Test flakiness analysis, retry patterns |
| `scan-styles-usage.test.ts` | Style validation | Design system contract, token usage |

## Usage Examples

### Pattern Enforcement
```bash
# Run pattern enforcement
pnpm tsx tests/scripts/enforce-test-patterns.ts
```

### Flake Detection
```bash
# Detect flaky tests
pnpm tsx tests/scripts/detect-flakes.ts
```

### Style Validation
```bash
# Validate design system contract
pnpm test tests/scripts/scan-styles-usage.test.ts
```

## Testing Patterns

### Pattern Validation
```typescript
// enforce-test-patterns.ts validates:
// 1. DOM component tests must be named *.dom.test.tsx
// 2. API route tests must use new Request(...) and JSON.stringify(body)
// 3. Disallow direct vi.mock('@clerk/nextjs/server') when centralized helper exists
```

## Best Practices

### ✅ **Do**
- Run pattern enforcement in CI/CD
- Regularly check for flaky tests
- Validate design system contracts
- Keep validation scripts up to date

### ❌ **Don't**
- Skip pattern enforcement checks
- Ignore flaky test warnings
- Bypass design system validation

---

## 🎯 Key Takeaways

- **Pattern Consistency**: Scripts ensure consistent test patterns
- **Quality Assurance**: Validation tools maintain test quality
- **Design System**: Contract validation prevents drift

## 📚 Related Documentation

- [Test Patterns](../../docs/test-patterns.md) - Test pattern guidelines
- [Design System](../../docs/design-system.md) - Design system architecture

## 🏷️ Tags

`#scripts` `#validation` `#tooling` `#patterns`

---

_Last updated: 2025-01-16_
