---
status: "draft"
last_updated: "2025-12-31"
category: "library"
title: "Lib"
description: "Core lib utilities and functionality for the Corso platform. Located in lib/."
---
# Library Module Tests

> **Comprehensive testing of library modules, validators, and service adapters.**

## 📋 Quick Reference

**Key Points:**

- **Validators**: Schema validation and type checking
- **Service Adapters**: Entity service adapter testing
- **Marketing Modules**: Marketing barrel and module validation

## 📑 Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Testing Patterns](#testing-patterns)
- [Best Practices](#best-practices)

---

## Overview

Library module tests validate core library functionality, including validators, service adapters, and domain-specific modules. Tests ensure proper schema validation, data transformation, and module exports.

## Directory Structure

| Directory | Purpose | Coverage |
|-----------|---------|----------|
| `validators/` | Validator tests | Schema validation, type checking |
| `adapters/` | Entity adapter tests | AG Grid adapter, data transformation |
| `marketing/` | Marketing module tests | Barrel exports, module structure |

## Test Files

| File | Purpose | Coverage |
|------|---------|----------|
| `validators/tableColumnConfig.test.ts` | Table column config | Schema validation, format enums |
| `adapters/aggrid.test.ts` | AG Grid adapter | Column definition transformation |
| `marketing/barrels.test.ts` | Marketing barrels | Barrel export validation |

## Testing Patterns

### Validator Testing
```typescript
import { TableColumnConfigSchema } from '@/lib/validators/tableColumnConfig';

describe('TableColumnConfigSchema', () => {
  it('validates a minimal config', () => {
    const config = { id: 'name', label: 'Name', accessor: 'name' };
    const result = TableColumnConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});
```

### Adapter Testing
```typescript
import { toColDef } from '@/lib/entities/adapters/aggrid';

describe('AG Grid adapter', () => {
  it('transforms column config to ColDef', () => {
    const config = { id: 'name', label: 'Name', accessor: 'name' };
    const colDef = toColDef(config);
    expect(colDef.field).toBe('name');
  });
});
```

## Best Practices

### ✅ **Do**
- Test all schema validation scenarios
- Validate data transformation logic
- Test edge cases and error conditions
- Ensure proper type safety

### ❌ **Don't**
- Skip testing validation edge cases
- Ignore type safety requirements
- Test implementation details unnecessarily

---

## 🎯 Key Takeaways

- **Validation Critical**: Validators ensure data integrity
- **Adapter Quality**: Adapters enable framework integration
- **Module Structure**: Tests maintain clean module organization

## 📚 Related Documentation

- [Validation Patterns](../../docs/validation.md) - Validation implementation
- [Entity Architecture](../../docs/entity-architecture.md) - Entity system design

## 🏷️ Tags

`#library` `#validators` `#adapters` `#modules`

---

_Last updated: 2025-01-16_
