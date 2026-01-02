---
status: "draft"
last_updated: "2026-01-02"
category: "documentation"
title: "Core"
description: "Documentation and resources for documentation functionality. Located in core/."
---
# Core Platform Tests

> **Comprehensive testing of core platform utilities, validation, and tooling.**

## 📋 Quick Reference

**Key Points:**

- **Import Discipline**: Cross-domain import validation
- **Structure Validation**: Library structure and barrel file validation
- **Runtime Boundaries**: Server/client separation enforcement
- **Tooling**: Test utilities and validation scripts

## 📑 Table of Contents

- [Overview](#overview)
- [Test Files](#test-files)
- [Testing Patterns](#testing-patterns)
- [Best Practices](#best-practices)

---

## Overview

Core platform tests validate the foundational architecture, import discipline, library structure, and runtime boundaries. These tests ensure code quality, maintainability, and proper separation of concerns.

## Test Files

| File | Purpose | Coverage |
|------|---------|----------|
| `import-discipline.test.ts` | Import discipline | Cross-domain import validation, baseline enforcement |
| `lib-structure-validator.test.ts` | Library structure | Domain structure, barrel files, naming conventions |
| `lib-api-edge-safety.test.ts` | Edge safety | Edge runtime compatibility, barrel exports |
| `lib-boundary-guards.test.ts` | Boundary guards | Server/client separation enforcement |
| `runtime-boundaries.test.ts` | Runtime boundaries | Runtime configuration validation |
| `orphans-audit.test.ts` | Orphan detection | Unused code detection, cleanup validation |
| `with-error-handling-node.node.test.ts` | Error handling | Node.js error handling wrapper |
| `api-error-conversion.test.ts` | Error conversion | Error type conversion, API error formatting |
| `constants-barrel.test.ts` | Constants barrel | Barrel file validation |
| `constants-barrel.node.test.ts` | Constants barrel (Node) | Node-specific barrel validation |
| `is-development.test.ts` | Environment detection | Development mode detection |
| `root-tailwind-config.test.ts` | Tailwind config | Root configuration validation |
| `tailwind-config.reexport.test.ts` | Tailwind reexport | Configuration reexport validation |

## Testing Patterns

### Import Discipline
```typescript
import baseline from '../../scripts/policies/import-baseline.json';

describe('import discipline', () => {
  it('no new cross-domain leaf imports', async () => {
    // Scan for cross-domain imports
    // Compare against baseline
  });
});
```

### Structure Validation
```typescript
describe('lib structure validation', () => {
  it('validates domain structure', () => {
    // Check for README files
    // Validate barrel exports
    // Check naming conventions
  });
});
```

## Best Practices

### ✅ **Do**
- Maintain import discipline baseline
- Validate library structure regularly
- Test runtime boundary enforcement
- Keep orphan detection up to date

### ❌ **Don't**
- Skip structure validation tests
- Ignore import discipline violations
- Test implementation details of tooling

---

## 🎯 Key Takeaways

- **Architecture Validation**: Core tests ensure architectural integrity
- **Import Discipline**: Prevents cross-domain coupling
- **Structure Quality**: Maintains clean, organized codebase

## 📚 Related Documentation

- [File Organization](../../docs/file-organization.md) - Directory structure guidelines
- [Import Discipline](../../docs/import-discipline.md) - Import patterns

## 🏷️ Tags

`#core` `#architecture` `#validation` `#tooling`

---

_Last updated: 2025-01-16_
