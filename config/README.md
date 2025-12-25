---
title: "Config"
description: "Documentation and resources for documentation functionality."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
# Global Project Configuration (`config/`)

This directory contains global configuration files for the Corso app. These files manage project-wide tooling, linting, formatting, documentation, security, and other meta-configuration. **This is not for runtime application config**—see `lib/` and `types/` for domain-specific runtime configuration.

## 📋 Quick Reference

| Category | Key Files | Purpose |
|----------|-----------|---------|
| **Build** | `next.config.mjs`, `postcss.config.js` | Next.js and CSS processing |
| **TypeScript** | `typescript/` | Comprehensive type checking system |
| **Quality** | `.prettierrc.js`, `.stylelintrc.cjs` | Code formatting and linting |
| **Security** | `security-policy.json`, `.gitleaks.toml` | Security scanning and policies |
| **Testing** | | E2E testing configuration |
| **Workflow** | `commitlint.config.js` | Development workflow |

## 🎯 Purpose

- **Centralize** all project-level configuration files for tools, CI, linting, docs, etc.
- **Organize** configurations by category and maintain clear separation of concerns
- **Standardize** development environment and tooling across the team
- **Automate** quality gates and consistency checks


## 📁 Directory Structure

```
config/
├── security/
│   └── rbac-roles.json       # Role-based access control definitions
├── typescript/
│   ├── README.md             # Comprehensive TypeScript docs
│   ├── tsconfig.json         # Main project configuration
│   ├── tsconfig.base.json    # Shared compiler options & aliases
│   ├── tsconfig.app.json     # Next.js application
│   ├── tsconfig.components.json # UI components
│   ├── tsconfig.lib.json     # Libraries (lib, hooks, contexts)
│   ├── tsconfig.styles.json  # Styles and design system
│   ├── tsconfig.testing.json # Test files and utilities
│   ├── tsconfig.tooling.json # Build tools and scripts
│   ├── tsconfig.types.json   # Type definitions
│   ├── tsconfig.eslint.json  # ESLint comprehensive coverage
│   ├── tsconfig.stories.json # Storybook stories
│   ├── *.tsbuildinfo         # Incremental compilation caches
│   └── tsconfig.lib.tsbuildinfo
├── .prettierrc.js           # Code formatting rules
├── .stylelintrc.cjs         # CSS linting configuration
├── .cspell.json             # Spell checking dictionary
├── .dependency-cruiser.cjs  # Dependency analysis rules
├── .gitleaks.toml           # Secret scanning configuration
├── .markdown-link-check.json # Link validation rules
├── commitlint.config.cjs    # Commit message validation (in project root)
├── domain-map.ts            # Domain boundaries & facades
├── edge-compat.config.json  # Edge runtime compatibility
├── next.config.mjs          # Next.js application config
├── postcss.config.js        # CSS processing configuration
├── security-policy.json     # Application security policies
├── typedoc.json             # API documentation generation
└── README.md                # This file
```

## 📂 Detailed File Inventory

### 🔧 Build & Development Tools

| File | Purpose | Key Settings |
|------|---------|--------------|
| `next.config.mjs` | Next.js application configuration | React Strict Mode, Turbopack, redirects, webpack optimizations |
| `postcss.config.js` | CSS processing pipeline | Tailwind CSS, autoprefixer, CSSnano (production only) |

### 🔷 TypeScript Configuration System

| File | Purpose | Key Features |
|------|---------|--------------|
| `typescript/tsconfig.json` | Main project aggregator | Project references, solution build coordination |
| `typescript/tsconfig.base.json` | Shared foundation | Path aliases, strict settings, compiler options |
| `typescript/tsconfig.app.json` | Next.js application | App router, API routes, middleware coverage |
| `typescript/tsconfig.components.json` | UI components | Atoms, molecules, organisms with React types |
| `typescript/tsconfig.lib.json` | Core libraries | lib/, hooks/, contexts/, validators/ |
| `typescript/tsconfig.styles.json` | Design system | Style utilities, component variants |
| `typescript/tsconfig.testing.json` | Test infrastructure | Vitest globals, test utilities coverage |
| `typescript/tsconfig.tooling.json` | Build scripts | Scripts, config files, tooling utilities |
| `typescript/tsconfig.types.json` | Type definitions | Isolated type compilation and generation |
| `typescript/tsconfig.eslint.json` | Linting coverage | Comprehensive file inclusion for ESLint |
| `typescript/tsconfig.stories.json` | Storybook integration | Story files with proper type resolution |

### 🎨 Code Quality & Formatting

| File | Purpose | Configuration |
|------|---------|--------------|
| `.prettierrc.js` | Code formatting standards | Semi-colons, single quotes, 100 char width |
| `.stylelintrc.cjs` | CSS/stylesheet linting | Tailwind integration, custom rules, token enforcement |
| `.cspell.json` | Spell checking | Project-specific technical terms |

### 🔒 Security & Compliance

| File | Purpose | Key Rules |
|------|---------|--------------|
| `security-policy.json` | Application security baseline (documentation-only) | SQL injection, prompt injection, DDoS protection |
| `.gitleaks.toml` | Secret scanning patterns | API keys, tokens, credentials detection |
| `edge-compat.config.json` | Edge runtime validation | Node.js API restrictions, package allowlists |

**Note**: `security-policy.json` is documentation-only and not enforced by runtime or CI. It serves as a reference for security policies and best practices.

### 🔄 Development Workflow

| File | Purpose | Configuration |
|------|---------|--------------|
| `commitlint.config.cjs` | Commit message standards | Conventional commits, scoped messages (in project root) |
| `domain-map.ts` | Architecture boundaries | Domain mapping, facade definitions |

### 📊 Documentation & Analysis

| File | Purpose | Output |
|------|---------|--------------|
| `typedoc.json` | API documentation generation | HTML docs in `docs/api/` |
| `.markdown-link-check.json` | Link validation | Broken link detection with retries |
| `.dependency-cruiser.cjs` | Dependency analysis | Circular dependency detection |

### 📦 Package Management

| File | Purpose | Configuration |
|------|---------|--------------|
| *(No npm-specific config in config/ - see root `.npmrc` for cross-tool npm settings)* |

### 🏷️ Subdirectories

#### `security/`
- **`rbac-roles.json`** - Role-based access control role definitions

#### `typescript/`
- **Comprehensive TypeScript configuration system** with project references
- **See**: `config/typescript/README.md` for detailed documentation

## 🔗 Configuration Relationships

### TypeScript Hierarchy
```
tsconfig.json (solution)
├── tsconfig.base.json (shared foundation)
├── tsconfig.app.json (Next.js app)
├── tsconfig.components.json (UI components)
├── tsconfig.lib.json (core libraries)
├── tsconfig.testing.json (tests)
├── tsconfig.tooling.json (build tools)
└── tsconfig.eslint.json (linting)
```

### Tool Integration
- **Path aliases** defined in `tsconfig.base.json` and used by:
  - ESLint (via TypeScript parser)
  - Vitest (via `vite-tsconfig-paths`)
  - IDEs (via TypeScript language server)
- **ESLint configuration** at project root (`eslint.config.mjs`)
  - **Note**: We use ESLint flat config (`eslint.config.mjs`), but `eslint-plugin-import`'s `import/no-unused-modules` rule currently requires a legacy `.eslintrc.json` (containing only `ignorePatterns`) to resolve file ignores. The `.eslintrc.json` file at the project root serves this purpose and should not be removed.
- **Vitest configuration** at project root (moved from `config/` for discoverability)

## ⚙️ Key Configuration Highlights

### TypeScript Performance
- **Project references** for modular compilation
- **Incremental builds** with `.tsbuildinfo` cache files
- **Performance-optimized config** for fast development feedback

### Code Quality Gates
- **Multi-layer linting**: ESLint, Stylelint
- **Automated formatting**: Prettier with consistent rules
- **Spell checking**: Custom dictionary for technical terms

### Security Automation
- **Secret scanning**: GitLeaks with project-specific patterns
- **Dependency analysis**: Circular dependency detection
- **Bundle monitoring**: Size limits and performance tracking

### Development Workflow
- **Conventional commits**: Standardized commit messages
- **Automated refactoring**: Codemod rules for import updates
- **Domain boundaries**: Clear separation of concerns

## 🚫 Not Runtime Configuration

**Important**: This directory contains **build-time and development tooling configuration only**.

- **Runtime configuration** (feature flags, environment variables, domain settings) lives in:
  - `lib/` - Implementation-specific configuration
  - `types/` - Type definitions for configuration
  - `app/` - Next.js-specific runtime config

## 📚 Related Documentation

- **[TypeScript Configuration](./typescript/README.md)** - Comprehensive TypeScript setup guide
- **[ESLint Configuration](../../eslint.config.mjs)** - Linting rules and plugin integration
- **[Vitest Configuration](../../vitest.config.ts)** - Testing framework configuration
- **[Next.js Configuration](./next.config.mjs)** - Application build configuration
- **[Security Standards](../../.cursor/rules/)** - Security configuration and patterns (see rules directory)

## 🏗️ Domain Architecture & Facades

The `domain-map.ts` file defines the project's domain-driven architecture boundaries and public facades for cross-domain imports.

### Domain Structure

```typescript
// Defined domains and their purposes
export const DOMAIN_MAP = {
  dashboard: 'Business intelligence and analytics domain',
  billing: 'Billing and subscription management domain',
  chat: 'AI chat and conversation management domain',
  auth: 'Authentication and access control domain',
  ui: 'Design system and UI primitives domain',
  // ... other domains
};

// Public facades - only these can be imported from other domains
export const FACADE_MAP = {
  dashboard: ['DashboardLayout', 'KpiCard', 'DataTable'],
  ui: ['Button', 'Input', 'Card', 'Dialog', 'Badge'],
  // ... facade definitions
};
```

### Import Rules

#### ✅ CORRECT: Domain Facade Imports
```typescript
// ✅ Import from domain facades (enforced)
import { Button, Card } from '@/components/ui/atoms';
import { KpiCard } from '@/components/dashboard';
```

#### ❌ INCORRECT: Deep or Cross-Domain Imports
```typescript
// ❌ Deep imports (enforced by dependency-cruiser)
import { Button } from '@/components/ui/atoms/button';

// ❌ Cross-domain imports (enforced by ESLint)
import { Button } from '@/atoms'; // Should be @/components/ui/atoms
```

### Validation Commands

```bash
# Domain boundary compliance is enforced internally

# Run dependency-cruiser analysis
npx depcruise --config .dependency-cruiser.cjs src

# Full architecture validation
pnpm quality:local
```

### Adding New Domains

1. **Add to DOMAIN_MAP**: Define the domain and its purpose
2. **Define FACADE_MAP**: List public exports for cross-domain imports
3. **Update DOMAIN_DEPENDENCIES**: Define allowed import relationships
4. **Create index.ts**: Export public facade from domain root
5. **Run validation**: Ensure no breaking changes

### Domain Dependency Rules

- **Shared utilities** (`@/lib/shared`, `@/types/shared`) can be imported by all domains
- **UI components** can only import from `@/shared` domain
- **Business domains** (dashboard, billing, chat) can import from UI and shared
- **Server code** can import from all domains (but client code cannot import server code)

### Enforcement Tools

- **ESLint**: `@corso/no-cross-domain-imports`, `@corso/no-deep-imports`
- **Dependency-Cruiser**: `.dependency-cruiser.cjs` (circular dependency detection)
- **AST-Grep**: Pattern matching for complex boundary rules
- **CI Pipeline**: Automated validation on all PRs

## 🏷️ Metadata

- **Last Updated**: 2025-10-03
- **Category**: Development tooling
- **Priority**: High
- **Scope**: Project-wide configuration
