---
title: "Rules"
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# OpenAPI Vendor Extensions - Extended Documentation

This document contains workflow integration details, common issues and fixes, and extended validation patterns. For the concise rule, see [`.cursor/rules/openapi-vendor-extensions.mdc`](../../../.cursor/rules/openapi-vendor-extensions.mdc).

## Workflow Integration Details

### Local Development

```bash
# Edit OpenAPI spec
vim api/openapi.yml

# Add RBAC annotations to new operations
x-corso-rbac: [admin]
parameters:
  - $ref: '#/components/parameters/OrgIdHeader'

# Validate changes
pnpm openapi:gen && pnpm openapi:rbac:check
```

### Adding New Operations

1. Add operation to `api/openapi.yml`
2. Include `OrgIdHeader` parameter reference
3. Set appropriate `x-corso-rbac` role
4. Run validation: `pnpm openapi:rbac:check`

### Role Assignment Guidelines

```typescript
// READ operations (GET)
x-corso-rbac: [member]

// WRITE operations (POST/PUT/PATCH)
x-corso-rbac: [admin]

// DESTRUCTIVE operations (DELETE)
x-corso-rbac: [admin]

// ORGANIZATION operations
x-corso-rbac: [member]  # Usually read access

// SERVICE operations (webhooks)
x-corso-rbac: [service]
```

## Common Issues & Fixes

### Missing OrgIdHeader

```yaml
# ❌ INCORRECT
post:
  security:
    - bearerAuth: []
  x-corso-rbac: [member]
  # Missing OrgIdHeader!

# ✅ CORRECT
post:
  parameters:
    - $ref: '#/components/parameters/OrgIdHeader'
  security:
    - bearerAuth: []
  x-corso-rbac: [member]
```

### Invalid Role

```yaml
# ❌ INCORRECT
x-corso-rbac: [superuser]  # Not in config/security/rbac-roles.json

# ✅ CORRECT
x-corso-rbac: [admin]  # From allowed roles
```

### Public Endpoint Without Opt-out

```yaml
# ❌ INCORRECT
get:
  security:
    - bearerAuth: []  # Should be public but not marked

# ✅ CORRECT
get:
  x-public: true  # Explicitly public
```

## Validation Patterns

### ESLint Integration

```javascript
// .eslintrc.mjs
{
  plugins: ['@corso/eslint-plugin'],
  rules: {
    '@corso/require-auth': 'error',
    '@corso/require-validation': 'error',
    '@corso/require-rate-limit': 'error'
  }
}
```

### AST-Grep Patterns

```bash
# Check for missing error handling wrappers
sg -p 'export const $METHOD = withErrorHandlingEdge' --lang typescript app/api/

# Find operations without RBAC annotations
sg -p 'security:\n  - bearerAuth: \[\]' --lang yaml api/openapi.yml
```

## CI/CD Integration

### CI Integration (`.github/workflows/openapi.yml`)

Automated validation on pull requests affecting API or OpenAPI files.

```yaml
- run: pnpm openapi:bundle
- run: pnpm openapi:lint
- run: pnpm openapi:types
- run: pnpm openapi:rbac:check  # ← RBAC guard
- run: git diff --exit-code -- api/openapi.json types/api/generated/openapi.d.ts
```

## Quality Gates

### OpenAPI Validation
- ✅ All bearer operations have `x-corso-rbac` or `x-public`
- ✅ All bearer operations include `OrgIdHeader`
- ✅ Role values match `config/security/rbac-roles.json`
- ✅ Generated types are up-to-date

### Automated Enforcement
- **RBAC validation**: `pnpm openapi:rbac:check` (runs `tools/scripts/openapi-guard-rbac.ts`)
- **OpenAPI generation**: `pnpm openapi:gen` (regenerates specs and types)
- **Full pipeline**: `pnpm openapi:gen && pnpm openapi:rbac:check`

### CI/CD Validation
- ✅ PR validation runs `pnpm openapi:rbac:check`
- ✅ Breaking changes detected via `pnpm openapi:diff`
- ✅ Generated artifacts committed and validated
