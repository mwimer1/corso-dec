---
status: "draft"
last_updated: "2026-01-02"
category: "documentation"
title: "Vendors"
description: "Documentation and resources for documentation functionality. Located in vendors/."
---
# Vendor Library Tests

> **Comprehensive testing of third-party vendor libraries and their integration.**

## 📋 Quick Reference

**Key Points:**

- **Vendor Integration**: Third-party library integration validation
- **Static Import Guards**: Prevents problematic static imports
- **Module Registration**: Vendor module registration validation

## 📑 Table of Contents

- [Overview](#overview)
- [Test Files](#test-files)
- [Testing Patterns](#testing-patterns)
- [Best Practices](#best-practices)

---

## Overview

Vendor library tests validate third-party library integration, ensuring proper module registration, import patterns, and integration with the application. Tests prevent problematic static imports and ensure correct vendor library usage.

## Test Files

| File | Purpose | Coverage |
|------|---------|----------|
| `register.static-import.guard.test.ts` | Static import guard | AG Grid static import prevention, module registration validation |

## Testing Patterns

### Static Import Guard
```typescript
import { readFileSync } from 'fs';

describe('AG Grid static import guard', () => {
  it('does not contain top-level ag-grid-enterprise string', () => {
    const content = readFileSync('lib/vendors/ag-grid.client.ts', 'utf8');
    const plain = /import\s+.*['"]ag-grid-enterprise['"]/;
    expect(plain.test(content)).toBe(false);
  });
});
```

## Best Practices

### ✅ **Do**
- Validate vendor library integration
- Test module registration patterns
- Guard against problematic static imports
- Ensure proper vendor library configuration

### ❌ **Don't**
- Skip vendor integration validation
- Ignore static import warnings
- Bypass module registration checks

---

## 🎯 Key Takeaways

- **Integration Quality**: Tests ensure proper vendor library integration
- **Import Safety**: Prevents problematic static imports
- **Module Registration**: Validates correct vendor module setup

## 📚 Related Documentation

- [Vendor Integration](../../docs/vendor-integration.md) - Vendor library patterns
- [AG Grid Integration](../../docs/ag-grid.md) - AG Grid integration details

## 🏷️ Tags

`#vendors` `#third-party` `#integration` `#ag-grid`

---

_Last updated: 2025-01-16_
