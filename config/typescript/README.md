---
description: "Documentation and resources for documentation functionality. Located in typescript/."
last_updated: "2026-01-01"
category: "documentation"
status: "draft"
---
# TypeScript Configuration

> **Comprehensive TypeScript configuration system with project references, path aliases, and domain-specific settings.**

## Typescript

## Typescript

## 📋 Quick Reference

**Key Points:**
- **Single Source of Truth**: `tsconfig.base.json` contains all shared compiler options and path aliases
- **Project References**: Modular configuration using TypeScript project references for better build performance
- **Domain Separation**: Isolated configurations for app, components, development, testing, and tooling
- **Path Aliases**: Consistent import resolution across all configurations and tools

## 📑 Table of Contents

- [Overview](#overview)
- [Configuration Hierarchy](#configuration-hierarchy)
- [Individual Configurations](#individual-configurations)
- [Path Alias System](#path-alias-system)
- [Build Artifacts](#build-artifacts)
- [Tool Integration](#tool-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The TypeScript configuration system is organized into a hierarchical structure that provides:

- **Modular compilation** with TypeScript project references
- **Consistent path aliases** across all configurations
- **Domain-specific settings** for different parts of the codebase
- **Tool integration** with ESLint, Vitest, and other development tools
- **Build optimization** through incremental compilation

### Architecture

```
tsconfig.json (root)
├── tsconfig.base.json (shared options & aliases)
├── tsconfig.app.json (Next.js application)
├── tsconfig.styles.json (styles/design system)
├── tsconfig.lib.json (libraries: lib/hooks/validators)
├── tsconfig.components.json (UI components)
├── tsconfig.testing.json (test files)
├── tsconfig.tooling.json (build tools)
└── tsconfig.eslint.json (ESLint coverage)
```

> Notes (2025-08): Project references are enabled across domains. Strict mode is on globally via `tsconfig.base.json` (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, etc.). Treat TypeScript as a non-negotiable gate: keep TS clean (no `@ts-ignore` unless documented with justification) and resolve errors at source.

## Configuration Hierarchy

### Root Configuration (`tsconfig.json`)
- **Purpose**: Editor/tooling coverage at repo root (IDEs, ESLint, Vitest)
- **Extends**: `./config/typescript/tsconfig.json`
- **Includes**: Explicit globs for `app/`, `lib/`, `types/`, etc. (for IntelliSense only)
- **Note**: Not used directly by `tsc -b` solution builds

### Solution Configuration (`config/typescript/tsconfig.json`)
- **Purpose**: TypeScript solution aggregator used by `tsc -b`
- **Behavior**: Reference-only (keeps `include: []` and `files: []`)
- **Why**: Avoids pulling generated `.d.ts` and conflicting no-emit projects into the solution
- **Used by**: `pnpm typecheck`, `pnpm typecheck:all`

### Base Configuration (`tsconfig.base.json`)
- **Purpose**: Single source of truth for compiler options and path aliases
- **Extends**: None (base configuration)
- **Key Features**:
  - Strict TypeScript settings
  - Comprehensive path alias mapping
  - Modern ES2022 target
  - Next.js plugin integration

### Domain-Specific Configurations

| Configuration | Purpose | Includes | Key Settings |
|---------------|---------|----------|--------------|
| `tsconfig.app.json` | Next.js application code | `app/**/*`, `proxy.ts` | Next.js plugin, composite |
| `tsconfig.styles.json` | Styles and design system | `styles/**/*` | Emits .d.ts to `.typegen/styles` |
|| `tsconfig.lib.json` | Libraries (lib/hooks/contexts/validators) | `lib/**/*`, `hooks/**/*`, `contexts/**/*`, `types/**/*` | Emits .d.ts to `.typegen/lib` |
| `tsconfig.components.json` | UI components (atoms, molecules, organisms) | `components/**/*` | Emits .d.ts to `.typegen/components` |
| `tsconfig.testing.json` | Test files and utilities | `tests/**/*`, `**/*.stories.tsx`, `vitest*.ts` | Composite, comprehensive coverage |
| `tsconfig.tooling.json` | Build tools and scripts | `scripts/**/*`, `config/**/*`, `eslint-plugin-corso/**/*` | Composite, tool-specific settings |
| `tsconfig.eslint.json` | ESLint comprehensive coverage | All TypeScript files | Full project coverage for linting |
| `tsconfig.prod.json` | Production strictness checks | All source files (excludes tests/stories) | Enhanced unused variable/parameter checks |

## Individual Configurations

### `tsconfig.base.json` - Shared Foundation

**Purpose**: Single source of truth for all TypeScript compiler options and path aliases.

**Key Features**:
- **Strict TypeScript**: Full type checking with modern settings
- **Path Aliases**: Comprehensive import resolution mapping
- **Modern Target**: ES2022 with DOM and ESNext libraries
- **Module Resolution**: Bundler-based resolution for modern tooling

**Compiler Options**:
```json
{
  "target": "ES2022",
  "lib": ["DOM", "DOM.Iterable", "ESNext"],
  "module": "ESNext",
  "moduleResolution": "bundler",
  "jsx": "react-jsx",
  "strict": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "noUncheckedIndexedAccess": true
}
```

### `tsconfig.app.json` - Next.js Application

**Purpose**: TypeScript configuration for Next.js application code.

**Includes**:
- `app/**/*.ts` - Next.js app directory
- `proxy.ts` - Next.js proxy (formerly middleware in Next.js 16+)
- `.next/types/**/*.ts` - Next.js generated types

**Key Settings**:
- Composite project for incremental compilation
- Next.js plugin integration
- App-specific path resolution

### `tsconfig.components.json` - UI Components

**Purpose**: Isolated compilation for UI components with specific dependencies.

**Includes**:
- `components/**/*.ts(x)` - All UI components

**Excludes**:
- `components/dashboard/**/*` - Domain-specific components
- `components/landing/**/*` - Domain-specific components
- `components/marketing/**/*` - Domain-specific components
- `components/onboarding/**/*` - Domain-specific components

**Key Settings**:
- React and React-DOM types
- Isolated module compilation
- Component-specific path aliases

### `tsconfig.styles.json` - Styles/Design System

**Purpose**: Isolated types for styles tokens/variants; safe for app consumption via references.

**Includes**:
- `styles/**/*.ts(x)`

**Key Settings**:
- Composite project emitting declarations only (`.typegen/styles`)

### `tsconfig.lib.json` - Libraries

**Purpose**: Isolated types for `lib/**`, `hooks/**`, `contexts/**`, and validators.

**Includes**:
- `lib/**/*.ts(x)`
- `hooks/**/*.ts(x)`
- `contexts/**/*.ts(x)`
- `package.json` (explicitly included via `files` array)

**Key Settings**:
- Composite project emitting declarations only (`.typegen/lib`)
- **JSON Module Support**: `resolveJsonModule: true` and `allowJs: true` for package.json imports
- **Explicit File Inclusion**: Uses `files` array for package.json to ensure proper project reference handling

### `tsconfig.testing.json` - Test Files

**Purpose**: Comprehensive TypeScript coverage for all testing code.

**Includes**:
- `tests/**/*.ts` - Test files
- `vitest*.ts` - Vitest configuration
- `vitest.base.ts` - Base Vitest config (moved to root)
- All source files for testing

**Key Settings**:
- Composite project for incremental compilation
- Comprehensive file coverage
- Test-specific optimizations

### `tsconfig.tooling.json` - Build Tools

**Purpose**: TypeScript configuration for build tools and scripts.

**Includes**:
- `scripts/**/*.ts` - Build and utility scripts
- `config/**/*.ts` - Configuration files
- `eslint-plugin-corso/**/*.ts` - Custom ESLint plugin
- `styles/**/*.ts` - Style utilities

**Key Settings**:
- Composite project for incremental compilation
- Tool-specific optimizations
- Configuration file support

### `tsconfig.eslint.json` - ESLint Coverage

**Purpose**: Comprehensive TypeScript coverage for ESLint analysis.

**Includes**:
- All TypeScript files in the project
- Configuration files
- Build artifacts
- Generated files

**Key Settings**:
- Full project coverage
- ESLint-specific optimizations
- Comprehensive file inclusion

### `tsconfig.prod.json` - Production Strictness

**Purpose**: Enhanced type checking for production code with stricter unused variable/parameter detection.

**Includes**:
- All source files (`app/`, `components/`, `lib/`, `hooks/`, `actions/`, `contexts/`, `styles/`, `types/`)
- Excludes test files, stories, scripts, and documentation

**Key Settings**:
- Extends `tsconfig.json` (solution config)
- `noUnusedLocals: true` - Flags unused local variables
- `noUnusedParameters: true` - Flags unused function parameters
- Used by `pnpm typecheck:prod` for production code validation

**Usage**:
```bash
# Run production strictness checks
pnpm typecheck:prod
```

## Path Alias System

### Core Aliases

The path alias system provides consistent import resolution across all configurations:

```json
{
  "@/*": ["./*"],
  "@/types/*": ["./types/*"],
  "@/lib/*": ["./lib/*"],
  "@/app/*": ["./app/*"],
  "@/components/*": ["./components/*"],
  "@/hooks/*": ["./hooks/*"],
  "@/tests/*": ["./tests/*"]
}
```

### Domain-Specific Aliases

**Shared Utilities**:
```json
{
  "@shared/*": ["./types/shared/*"],
  "@shared": ["./types/shared/index.ts"]
}
```

**Library Aliases**:
```json
{
  "@/lib/shared": ["./lib/shared/index.ts"],
  "@/lib/security": ["./lib/security/index.ts"],
  "@/lib/monitoring": ["./lib/monitoring/index.ts"],
  "@/lib/auth/server": ["./lib/auth/server.ts"],
  "@/lib/auth/client": ["./lib/auth/client.ts"],
  "@/lib/chat": ["./lib/chat/index.ts"],
  "@/lib/dashboard": ["./lib/dashboard/index.ts"]
}
```

**Type Aliases**:
```json
{
  "@/types/chat": ["./types/chat/index.ts"],
  "@/types/dashboard": ["./types/dashboard/index.ts"],
}
```

### Tool Integration

**Vitest Integration**:
- Path aliases automatically resolved via `vite-tsconfig-paths` plugin
- Consistent with TypeScript configuration
- Test-specific aliases for test utilities

**ESLint Integration**:
- TypeScript parser uses `tsconfig.eslint.json` for project reference
- Path aliases resolved through TypeScript configuration
- Consistent import resolution across linting and compilation

## Build Artifacts

### `.tsbuildinfo` Files

TypeScript generates build information files for incremental compilation:

| File | Purpose | Size | Status |
|------|---------|------|--------|
| `tsconfig.app.tsbuildinfo` | App compilation cache | ~3.1MB | ✅ Generated |
| `tsconfig.dev.tsbuildinfo` | Dev libraries cache | ~3.5MB | ✅ Generated |
| `tsconfig.testing.tsbuildinfo` | Testing cache | ~3.3MB | ✅ Generated |
| `tsconfig.components.tsbuildinfo` | Components cache | ~175KB | ✅ Generated |
| `tsconfig.tsbuildinfo` | Root cache | ~503B | ✅ Generated |

**Note**: These files should be excluded from version control and added to `.gitignore`.

### Incremental Compilation

**Benefits**:
- Faster subsequent builds
- Only recompiles changed files
- Maintains compilation state between builds

**Configuration**:
```json
{
  "incremental": true,
  "composite": true
}
```

## Tool Integration

### ESLint Integration

**Configuration**:
- ESLint uses `tsconfig.eslint.json` for TypeScript project reference
- Path aliases automatically resolved
- Type-aware linting with full project coverage

**Parser Options**:
```javascript
{
  project: ['./config/typescript/tsconfig.eslint.json'],
  tsconfigRootDir: import.meta.dirname
}
```

### Vitest Integration

**Configuration**:
- Base configuration in `vitest.base.ts` (moved to root)
- Path aliases via `vite-tsconfig-paths` plugin
- Consistent with TypeScript path mapping

**Alias Resolution**:
```typescript
resolve: {
  alias: {
    '@': resolve(__dirname, '..'),
    '@/lib': resolve(__dirname, '../lib'),
    '@/types': resolve(__dirname, '../types')
  }
}
```

### Next.js Integration

**Configuration**:
- Next.js plugin in TypeScript configurations
- App-specific settings in `tsconfig.app.json`
- Automatic type generation in `.next/types/`

## Best Practices

### Configuration Management

✅ **Good Practices**:
- Use `tsconfig.base.json` as single source of truth
- Extend base configuration in domain-specific configs
- Use project references for modular compilation
- Keep path aliases consistent across all configs

❌ **Avoid**:
- Duplicating compiler options across configs
- Inconsistent path alias definitions
- Manual editing of `.tsbuildinfo` files
- Overriding base settings unnecessarily

### Path Alias Usage

✅ **Good Practices**:
- Use consistent alias patterns
- Prefer barrel imports over deep imports
- Use domain-specific aliases for clarity
- Maintain alias consistency with directory structure

❌ **Avoid**:
- Inconsistent alias naming
- Deep imports when barrel imports are available
- Aliases that don't match directory structure
- Overly complex alias hierarchies

### Build Optimization

✅ **Good Practices**:
- Enable incremental compilation
- Use composite projects for modular builds
- Exclude build artifacts from version control
- Optimize include/exclude patterns

❌ **Avoid**:
- Including unnecessary files in compilation
- Disabling incremental compilation
- Committing build artifacts to version control
- Overly broad include patterns

## Troubleshooting

### Common Issues

**Path Alias Resolution**:
- Ensure aliases are defined in `tsconfig.base.json`
- Check that tools (ESLint, Vitest) use correct TypeScript config
- Verify alias patterns match actual directory structure

**Build Performance**:
- Check `.tsbuildinfo` files are not corrupted
- Verify incremental compilation is enabled
- Review include/exclude patterns for efficiency

**Type Errors**:
- Ensure TypeScript version compatibility
- Check for conflicting type definitions
- Verify project references are correctly configured

### Debugging Commands

**TypeScript Compilation**:
```bash
# Check TypeScript configuration
npx tsc --showConfig

# Build specific project
npx tsc --build config/typescript/tsconfig.app.json

# Check for errors
npx tsc --noEmit
```

**Path Alias Verification**:
```bash
# Check alias resolution
npx tsc --traceResolution

# Verify specific alias
npx tsc --traceResolution | grep "@/lib"
```

---

## 🎯 Key Takeaways

- **Modular Architecture**: Project references enable efficient, modular compilation
- **Single Source of Truth**: `tsconfig.base.json` centralizes shared configuration
- **Tool Integration**: Consistent path aliases across all development tools
- **Build Optimization**: Incremental compilation improves development experience

## 📚 Related Documentation

- [Global Configuration README](../README.md) - Overview of all configuration files
- [ESLint Configuration](../../eslint.config.mjs) - TypeScript-aware linting setup
- [Vitest Configuration](../vitest.base.ts) - Testing with TypeScript support
- [Next.js Configuration](../next.config.mjs) - App-specific TypeScript settings

## 🏷️ Tags

`#typescript` `#configuration` `#build-system` `#path-aliases` `#project-references`

---

_Last updated: 2025-01-16_
