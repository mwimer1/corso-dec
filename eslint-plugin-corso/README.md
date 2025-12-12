---
status: "draft"
last_updated: "2025-11-03"
category: "documentation"
---
# Corso ESLint Plugin

> **Comprehensive ESLint plugin enforcing Corso's architectural boundaries, security standards, and code quality rules for Next.js applications.**

## 📋 Overview

The `@corso/eslint-plugin` enforces Corso's strict coding standards and architectural principles across the entire codebase. It provides 57+ specialized rules organized into 8 phases of enforcement, ensuring consistent code quality, runtime safety, and architectural compliance.

## 🔧 Core Features

### Runtime Boundary Enforcement
- **Client/Server Separation**: Prevents server-only imports in client components (`use client` files)
- **Edge Runtime Safety**: Disallows Node.js APIs and server modules in Edge runtime routes
- **Security Barrel Protection**: Blocks `@/lib/security` imports in client/edge contexts
- **Environment Variable Safety**: Enforces proper `process.env` usage patterns

### Domain Import Boundaries
- **Clean Architecture**: Enforces domain-specific import boundaries using configurable domain rules
- **Deep Import Prevention**: Blocks unauthorized deep imports into domain subdirectories
- **Cross-Domain Protection**: Prevents architectural violations through import path validation

### Security & Standards
- **Input Validation**: Requires Zod `.strict()` mode for object schemas
- **API Safety**: Enforces proper API wrapper usage and runtime exports
- **Authentication**: Validates Clerk provider usage and server-only directive requirements
- **Type Safety**: Prevents runtime exports in type-only directories

### Code Quality & Consistency
- **Import Standards**: Enforces alias imports over relative paths
- **CTA Tracking**: Requires analytics tracking for landing page CTAs
- **UI Consistency**: Prevents ad-hoc navbar implementations
- **Link Management**: Enforces centralized link constants

## 📊 Rule Categories

### Phase 1: Import Boundaries
- `no-cross-domain-imports` - Enforces domain import boundaries
- `no-deep-imports` - Prevents unauthorized deep imports
- `force-root-imports` - Promotes alias imports over relative paths
- `forbid-ui-self-barrel` - Prevents self-imports in UI components

### Phase 2: Runtime Boundaries
- `no-server-in-client` - Blocks server modules in client components
- `no-server-in-edge` - Prevents server modules in Edge runtime
- `require-server-only-directive` - Enforces server-only imports in server files
- `no-client-apis-in-server-components` - Prevents client APIs in server contexts

### Phase 3: API & Fetch Rules
- `no-raw-internal-fetch` - Enforces API wrapper usage
- `ensure-api-wrappers` - Prevents direct axios/http usage
- `require-runtime-exports` - Requires runtime configuration in API routes

### Phase 4: Migration Rules
- `dashboard-literal-entity-keys` - Enforces shared query key helpers
- `no-client-in-icons` - Ensures SSR-safe icon modules

### Phase 6: Environment & Import Rules
- `require-env-utilities` - Enforces proper environment variable access
- `no-direct-process-env` - Prevents direct process.env usage
- `no-deprecated-lib-imports` - Blocks deprecated import paths

### Phase 7: Type & API Rules
- `no-runtime-in-types` - Prevents runtime exports in type directories
- `no-await-headers` - Prevents awaiting synchronous Next.js APIs
- `contexts-barrel-usage` - Enforces context barrel imports

### Phase 8: Optimization Rules
- `forbid-header-spacing-in-dashboard` - Prevents shared header imports in dashboard
- `no-clerkprovider-outside-root` - Centralizes ClerkProvider usage
- `require-zod-strict` - Enforces strict Zod schemas

## 🚨 Stub Rules (Future Implementation)

The following rules are currently stubs and marked for future implementation:
- `use-server-directive` - Server directive enforcement
- `enforce-action-validation` - Action validation rules
- `require-action-readme` - Action documentation requirements
- `no-alias-imports-in-tests` - Test file import restrictions
- `no-random-test-directories` - Test directory organization
- `require-supabase-scope` - Supabase scope enforcement
- `storybook-auto-generation` - Storybook automation

## ⚙️ Configuration

### Domain Configuration (`rules/domain-config.json`)

```json
{
  "domains": {
    "components": {
      "allowDeepImports": false,
      "publicSurface": [
        "sections", "layout", "ui", "auth", "billing",
        "dashboard", "chat", "forms", "landing", "marketing", "insights"
      ]
    },
    "lib": {
      "allowDeepImports": true,
      "publicSurface": ["index"]
    },
    "types": {
      "allowDeepImports": false,
      "publicSurface": [
        "index", "shared", "security", "auth", "billing",
        "chat", "config", "dashboard", "forms", "integrations",
        "marketing", "realtime", "validators"
      ]
    }
  }
}
```

### ESLint Configuration

```javascript
// eslint.config.mjs
import corsoPlugin from '@corso/eslint-plugin';

export default [
  {
    plugins: {
      '@corso': corsoPlugin,
    },
    rules: {
      '@corso/no-server-in-client': 'error',
      '@corso/require-env-utilities': 'error',
      '@corso/no-hardcoded-links': 'error',
      // ... other rules
    },
  },
];
```

## 📈 Usage Statistics

- **57 Total Rules** across 8 enforcement phases
- **8 Stub Rules** awaiting implementation
- **49 Active Rules** currently enforcing standards
- **100% TypeScript** implementation with full type safety

## 🔍 Quality Gates

- ✅ **Runtime Safety**: All rules maintain proper client/server/edge separation
- ✅ **Type Safety**: Full TypeScript support with comprehensive error reporting
- ✅ **Performance**: Rules are optimized for ESLint's analysis pipeline
- ✅ **Extensibility**: Configurable domain boundaries and rule options

## 🏗️ Architecture

The plugin is organized into logical phases that build upon each other:

1. **Foundation**: Import boundaries and basic structural rules
2. **Runtime Safety**: Client/server/edge runtime enforcement
3. **API Standards**: Fetch wrappers and API route requirements
4. **Migration Support**: Legacy code migration assistance
5. **Environment Safety**: Process.env and configuration management
6. **Type System**: TypeScript and schema validation rules
7. **Advanced Patterns**: Context usage and optimization rules
8. **Future Extensions**: Placeholder rules for upcoming features

## 📚 Related Documentation

- [Security Standards](../../docs/security/security-standards.md) - Security and authentication patterns
- [Warehouse Query Hooks](../../docs/codebase-apis/warehouse-query-hooks.md) - Data access patterns
- [ESLint Configuration](../../../eslint.config.mjs) - Main ESLint setup

## 🏷️ Tags

`#eslint` `#linting` `#code-quality` `#architecture` `#runtime-safety`

---

*Last updated: 2025-01-16*

