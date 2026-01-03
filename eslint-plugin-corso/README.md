---
title: "Eslint Plugin Corso"
description: "Documentation and resources for documentation functionality."
last_updated: "2026-01-03"
category: "documentation"
status: "draft"
---
# Corso ESLint Plugin

> **Comprehensive ESLint plugin enforcing Corso's architectural boundaries, security standards, and code quality rules for Next.js applications.**

## 📋 Overview

The `@corso/eslint-plugin` enforces Corso's strict coding standards and architectural principles across the entire codebase. It provides 59 specialized rules organized into multiple categories, ensuring consistent code quality, runtime safety, and architectural compliance.

## 📊 Rule Statistics

- **59 Total Rules** across all categories
- **7 Stub Rules** awaiting implementation
- **52 Active Rules** currently enforcing standards
- **100% TypeScript** implementation with full type safety

## 📚 Rule Categories

### API & Fetch

- `ensure-api-wrappers` - No description available
- `no-raw-internal-fetch` - No description available

### Authentication

- `no-clerkprovider-outside-root` - No description available

### Dashboard

- `dashboard-literal-entity-keys` - No description available
- `forbid-header-spacing-in-dashboard` - No description available

### Environment

- `no-direct-process-env` - No description available
- `require-env-utilities` - No description available

### Import Boundaries

- `cta-add-link-import` - No description available
- `dashboard-import-guard` - No description available
- `force-root-imports` - No description available
- `legacy-shared-import` - No description available
- `no-client-logger-import` - No description available
- `no-cross-domain-imports` - No description available
- `no-deep-imports` - No description available
- `no-deprecated-lib-imports` - No description available
- `no-lib-imports-in-types` - No description available
- `no-root-lib-imports` - No description available
- `require-server-env-imports` - No description available

### Next.js

- `next-script-no-empty-nonce` - No description available
- `nextjs15-route-params-async` - No description available
- `nextjs15-route-params-optimization` - No description available

### Other

- `contexts-barrel-usage` - No description available
- `forbid-ui-self-barrel` - No description available
- `no-await-headers` - No description available
- `no-direct-supabase-admin` - No description available
- `no-inline-color-literals` - No description available
- `no-underscore-dirs` - No description available
- `no-widgets-from-outside` - No description available
- `rate-limits-bracket-access` - No description available

### Runtime Boundaries

- `api-edge-barrel-no-server-exports` - No description available
- `forbid-security-barrel-in-client-or-edge` - No description available
- `no-clerkclient-invoke` - No description available
- `no-client-apis-in-server-components` - No description available
- `no-client-in-icons` - No description available
- `no-edge-runtime-on-pages` - No description available
- `no-mixed-runtime-exports` - No description available
- `no-runtime-in-types` - No description available
- `no-security-barrel-in-client` - No description available
- `no-server-in-client` - No description available
- `no-server-in-edge` - No description available
- `no-server-only-directive-in-shared` - No description available
- `no-server-only-in-client` - No description available
- `no-server-reexports` - No description available
- `require-client-directive-for-client-code` - No description available
- `require-runtime-exports` - No description available
- `require-server-only-directive` - No description available

### UI Standards

- `cta-external-anchor-hardening` - No description available
- `cta-internal-link-to-link` - No description available
- `cta-require-linktrack-or-tracking` - No description available
- `no-ad-hoc-navbars` - No description available
- `no-hardcoded-links` - No description available

### Validation

- `require-zod-strict` - No description available

## 🚨 Stub Rules (Future Implementation)

The following rules are currently stubs and marked for future implementation:

- `enforce-action-validation` - No description available
- `no-alias-imports-in-tests` - No description available
- `no-random-test-directories` - No description available
- `require-action-readme` - No description available
- `require-supabase-scope` - No description available
- `storybook-auto-generation` - No description available
- `use-server-directive` - No description available

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

### Deprecated Imports Configuration (`rules/deprecated-imports.json`)

The `no-deprecated-lib-imports` rule reads from a config file to enforce deprecated import paths:

```json
{
  "deprecatedImports": [
    {
      "path": "@/lib/actions/rate-limiting",
      "replacement": "@/lib/security/rate-limiting",
      "message": "Import path '@/lib/actions/rate-limiting' is deprecated. Use '@/lib/security/rate-limiting' instead."
    },
    {
      "pattern": "/security/rate-limiting/guards",
      "replacement": "@/lib/security/rate-limiting",
      "message": "Import path containing '/security/rate-limiting/guards' is deprecated. Use '@/lib/security/rate-limiting' instead.",
      "allowlist": [
        "lib/security/rate-limiting/guards.ts"
      ]
    }
  ]
}
```

**Config Options:**
- `path` - Exact import path to ban (e.g., `'@/lib/actions/rate-limiting'`)
- `pattern` - Regex pattern to match (e.g., `'/security/rate-limiting/guards'`)
- `replacement` - Suggested replacement path
- `message` - Custom error message (optional)
- `allowlist` - Array of file paths (relative to repo root) that are allowed to use this import

**Note:** Use either `path` OR `pattern`, not both. The rule checks `ImportDeclaration`, dynamic `import()`, and `require()` calls.

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

## 🔍 Quality Gates

- ✅ **Runtime Safety**: All rules maintain proper client/server/edge separation
- ✅ **Type Safety**: Full TypeScript support with strict type checking
- ✅ **Architectural Compliance**: Enforces domain boundaries and import rules
- ✅ **Security Standards**: Validates authentication, validation, and security patterns

---

_This documentation is auto-generated from `eslint-plugin-corso/src/index.js`. Last updated: 2026-01-03_
