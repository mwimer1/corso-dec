---
title: "Contributing"
description: "Documentation and resources for documentation functionality. Located in contributing/."
last_updated: "2026-01-03"
category: "documentation"
status: "draft"
---
# Unused Exports Audit & Remediation

Comprehensive system for identifying, classifying, and safely remediating unused exports across the Corso codebase. This system ensures code cleanliness while protecting intentional public APIs and Next.js framework requirements.

## 🎯 Overview

The unused exports system provides:

- **Automated Classification**: Intelligently categorizes unused exports by intent and safety
- **Safe Auto-fixing**: Uses ts-morph for reliable AST transformations
- **CI Verification**: Ensures only suppressed categories remain after remediation
- **Audit Trail**: Comprehensive reporting with actionable insights

## 🚀 Quick Start

### Basic Workflow

```bash
# 1. Run analysis to find unused exports
pnpm validate:ts-unused

# 2. Review unused exports in console output
# 3. Manually remove or internalize unused exports based on results

# 4. Re-run to verify no unused exports remain
pnpm validate:ts-unused
```

### Development Integration

```bash
# Pre-commit validation
pnpm validate:ts-unused

# After major refactoring
pnpm validate:ts-unused  # Review output and manually fix issues

# CI/CD integration
pnpm validate:ts-unused  # Reports unused exports for review
```

## 📊 Classification System

The system automatically classifies unused exports into six categories:

### ✅ Suppressed Categories (Never Modified)

#### 1. Next.js Special Exports
**Examples**: `runtime`, `GET`, `POST`, `generateMetadata`, `metadata`, `viewport`, `default`

**Detection**: File path matches Next.js route patterns AND export name is in special set
**Action**: Always suppressed, never touched
**Rationale**: Required for Next.js framework functionality

```typescript
// In app/api/health/route.ts - NEVER modify these
export const runtime = 'edge';
export async function GET() { /* ... */ }
export const dynamic = 'force-dynamic';
```

#### 2. Generated Types
**Examples**: `types/api/openapi.d.ts`, any `*.d.ts` file
**Detection**: File extension is `.d.ts` or path matches generated file patterns
**Action**: Always suppressed, never touched
**Rationale**: Auto-generated type definitions

#### 3. Intentional Public Surface
**Examples**: Components marked with `@public` JSDoc tag, allow-listed exports
**Detection**: JSDoc `@public` tag or presence in allow-list configuration
**Action**: Always suppressed, never touched
**Rationale**: Explicitly marked as public API

```typescript
/**
 * @public
 * Core utility function for the design system
 */
export function cn(...classes: string[]) {
  // Implementation
}
```

### 🔧 Actionable Categories (Safe to Fix)

#### 4. Barrel Drift
**Examples**: `components/ui/atoms/index.ts` with unused re-exports
**Detection**: File is `**/index.ts` with unused `export * from` or `export { ... } from` statements
**Action**: Prune unused re-exports, keep only actually used exports
**Rationale**: Barrel files should only export what's actually consumed

```typescript
// Before (barrel drift)
export * from './button';
export * from './input';
export * from './tooltip';  // ← Unused, will be pruned

// After (clean barrel)
export * from './button';
export * from './input';
```

#### 5. CLI/Tooling Exports
**Examples**: `scripts/**/*.ts` with exported helper functions not imported elsewhere
**Detection**: File path matches `scripts/**` or `tools/**` patterns
**Action**: Remove `export` keyword (internalize) unless explicitly allow-listed
**Rationale**: Scripts are typically CLI tools, not libraries

```typescript
// Before (unnecessarily exported)
export function helperFunction() { /* ... */ }

// After (internalized)
function helperFunction() { /* ... */ }
```

#### 6. Legacy/Dead Code
**Examples**: Truly unused exports not in any special category
**Detection**: Not in suppressed categories AND confirmed unused by multiple tools
**Action**: Delete export (or entire file if empty)
**Rationale**: Dead code should be removed

## ⚙️ Configuration

### Allow-Lists

To keep specific exports, add `@public` JSDoc tags or mark as intentionally used:

```typescript
/**
 * @public
 * This is part of our public API
 */
export const Button = () => { /* ... */ };
```

### Marking Public APIs

Use JSDoc `@public` tag for intentional public exports:

```typescript
/**
 * @public
 * This component is part of our public API
 */
export const PublicComponent = () => {
  return <div>Public API</div>;
};
```

## 🛠️ Commands Reference

### Analysis Commands

| Command | Purpose | Output |
|---------|---------|--------|
| `pnpm validate:ts-unused` | Run ts-prune to find unused exports | Console output with file paths and line numbers |

### Report Output

After running `pnpm validate:ts-unused`, review the console output for:
- Unused exports organized by file
- Type information for context

## 🔍 Manual Review Process

### 1. Review Console Output

Run `pnpm validate:ts-unused` and review the console output:

Each unused export is listed with:
- File path
- Export name
- Type definition
- Line number

Decide if the export should be:
- Kept (if it's intentionally public)
- Internalized (remove `export` keyword if used only within file)
- Deleted (if truly unused)

### 2. Handle Special Cases

#### Promoting to Public API

For exports that should be public but aren't detected:

```typescript
/**
 * @public
 * This is intentionally part of our public API
 */
export const MyComponent = () => { /* ... */ };
```

#### Adding to Allow-List

For files that should have broader exports:

```typescript
// In config.ts
byPath: [
  'components/ui/special/index.ts'  // Allow all exports from this file
],
byExport: {
  'components/ui/atoms/index.ts': [
    'SpecialButton'  // Allow this specific export
  ]
}
```

### 3. Manual Fixes

For complex cases requiring manual intervention:

```bash
# Edit files manually, then re-run validation
pnpm validate:ts-unused
```

## 🚨 CI/CD Integration

### Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit
pnpm validate:ts-unused
```

### GitHub Actions

```yaml
# .github/workflows/unused-exports.yml
- name: Check Unused Exports
  run: pnpm validate:ts-unused
```

### Quality Gates

```bash
# Include in comprehensive validation
pnpm quality:local  # Already includes validate:ts-unused
```

## 📈 Monitoring & Metrics

### Key Metrics

- **Suppressed vs Actionable**: Ratio of intentional vs fixable unused exports
- **Barrel Drift**: Number of unused re-exports in barrel files
- **Script Internalization**: Scripts with unnecessary exports
- **Dead Code**: Truly unused exports requiring deletion

### Trend Analysis

```bash
# Track improvements over time
git log --oneline --grep="unused-exports" --since="1 month ago"
```

## 🐛 Troubleshooting

### Common Issues

#### False Positives in Barrel Files

**Problem**: Legitimate re-exports marked as unused
**Solution**: Add to allow-list or mark with `@public` tag

```typescript
// Add to config.ts ALLOWLIST.byExport
'components/ui/atoms/index.ts': [
  'MyComponent'  // Keep this export
]
```

#### Next.js Exports Flagged

**Problem**: Next.js special exports incorrectly flagged
**Solution**: Ensure file path matches route patterns and export names are in `NEXT_EXPORT_NAMES`

#### Script Exports Not Internalized

**Problem**: Script helper functions still exported
**Solution**: Review if they should be moved to shared utilities or kept internal

### Debug Mode

```bash
# Check specific files
pnpm exec ts-prune -p config/typescript/tsconfig.prod.json --ignore "**/__tests__/**"
```

### Recovery

```bash
# If fixes break something, revert and investigate
git checkout HEAD -- components/ui/atoms/index.ts
pnpm validate:ts-unused  # Re-analyze
```

## 🎯 Best Practices

### When to Mark `@public`

- **Design System Components**: UI components used across the application
- **Core Utilities**: Shared functions used by multiple modules
- **API Types**: Public type definitions for external consumption
- **Configuration Objects**: Public configuration interfaces

### When to Internalize Scripts

- **CLI Helpers**: Functions only used within the script file
- **Test Utilities**: Functions only used in test files
- **Build Tools**: Functions only used during build process
- **Development Tools**: Functions only used in development

### Barrel File Hygiene

- **Single Responsibility**: Each barrel should serve one clear purpose
- **Minimal Surface**: Only export what's actually used
- **Clear Naming**: Use descriptive names for re-exported modules
- **Documentation**: Document the purpose of each barrel file

## 📚 Related Documentation

- [Code Quality Standards](../../.cursor/rules/code-quality-standards.mdc)
- [Development Workflow](../development/setup-guide.md)
- [Maintenance Scripts](../../scripts/maintenance/README.md)
- [CI/CD Pipeline](../../docs/cicd-workflow/)

## 🤖 AI Agent Integration

### Automated Remediation

```typescript
// Trigger on PR with unused exports changes
if (filesChanged.some(f => f.includes('unused-exports'))) {
  runCommand('pnpm validate:ts-unused');
  // Manual review and fixes required
}
```

### Pattern Recognition

```typescript
// Identify common patterns for auto-classification
const patterns = {
  nextRoute: /^app\/.*\/route\.ts$/,
  generatedType: /\.d\.ts$/,
  scriptFile: /^scripts\//,
  barrelFile: /\/index\.ts$/
};
```

---

**Status**: ✅ **Active** | **Classification**: Automated | **Maintenance**: Continuous | **Last Updated**: 2025-10-07
