---
title: "API — OpenAPI Specs & Tooling"
description: "Comprehensive OpenAPI specification management, RBAC validation, and automated TypeScript type generation for Corso API v1."
status: active
category: "development"
last_updated: 2025-12-15
---

## Overview

This directory contains the complete OpenAPI specification ecosystem for Corso's versioned public API under `/api/v1/*`. The API follows zero-trust security principles with RBAC, comprehensive validation, and automated tooling.

### Key Components
- **Source**: `api/openapi.yml` (authoritative OpenAPI 3.1.0 specification - 581 lines)
- **Generated**: `api/openapi.json` (bundled JSON matching YAML exactly - 1,088 lines)
- **Types**: `types/api/openapi.d.ts` (auto-generated TypeScript interfaces)
- **Validation**: RBAC guard with `tools/scripts/openapi-guard-rbac.ts`

## Core Capabilities

### 🔐 Security & RBAC
- **Zero-trust authentication**: All protected routes require bearer tokens
- **Role-based access control**: `x-corso-rbac` vendor extension for granular permissions
- **Organization scoping**: Tenant isolation for multi-user environments
- **Input validation**: Comprehensive Zod schemas for all endpoints

### 📊 API Features
- **ClickHouse integration**: Secure warehouse queries with auto-org-scoping
- **AI-powered insights**: SQL generation and chart configuration
- **Real-time analytics**: Performance-optimized data visualization
- **Streaming responses**: NDJSON format for large datasets

## Commands

### Primary Workflow
```bash
pnpm openapi:gen           # Complete pipeline: bundle → lint → generate types
pnpm openapi:lint          # Validate YAML with Spectral
pnpm openapi:rbac:check    # Validate RBAC annotations and security
pnpm openapi:diff          # Compare spec changes
```

### Advanced Tooling
```bash
pnpm openapi:bundle        # YAML → JSON bundling only
pnpm openapi:types         # Regenerate TypeScript types only
pnpm openapi:mock          # Start mock server with Prism
pnpm openapi:docs          # Preview documentation with Redocly
```

## File Structure

```
api/
├── openapi.yml           # Source-of-truth OpenAPI 3.1.0 specification (581 lines)
├── openapi.json          # Generated bundled JSON matching YAML (1,088 lines)
└── README.md            # This documentation
```

### Generated Artifacts
- `types/api/openapi.d.ts` — Auto-generated TypeScript interfaces (from openapi.json)
- `types/api/request/` — Request-specific type definitions
- `types/api/response/` — Response-specific type definitions

### File Relationships
- **openapi.yml** → **openapi.json** (via `pnpm openapi:bundle`)
- **openapi.json** → **types/api/openapi.d.ts** (via `openapi-typescript`)

## API Endpoints

### Core Infrastructure
- `GET /api/status/health` — Public health check endpoint (monitoring)
- `GET /health` — Simple heartbeat endpoint (uptime monitors)
- `HEAD /health` — Lightweight health check (HEAD request)
- `POST /api/public/csp-report` — CSP violation reporting (Edge-safe)

### AI Services (`/api/v1/ai/*`)
- `POST /api/v1/ai/chat` — AI chat processing with NDJSON streaming
- `POST /api/v1/ai/generate-sql` — AI-powered SQL generation

### Query Operations (`/api/v1/query`)
- `POST /api/v1/query` — Generic SQL query endpoint for client-side ClickHouse queries with tenant isolation

### Entity Operations (`/api/v1/entity/*`)
- `POST /api/v1/entity/{entity}/query` — Entity queries with filtering, sorting, pagination (projects, companies, addresses)
- `GET /api/v1/entity/{entity}` — Entity base operations
- `GET /api/v1/entity/{entity}/export` — Entity data export (CSV/XLSX)

### User Management
- `POST /api/v1/user` — User profile validation and updates

### Security Features
- **RBAC**: All protected endpoints use `x-corso-rbac` with role-based permissions
- **Rate Limiting**: All endpoints include 429 responses for abuse prevention
- **Input Validation**: Comprehensive Zod schemas for all request/response data

## Security Implementation

### RBAC Roles
```yaml
x-corso-rbac: [member]  # Read/write access to assigned resources
x-corso-rbac: [admin]   # Administrative operations (create, update, delete)
x-corso-rbac: [viewer]  # Read-only access
x-corso-rbac: [service] # Machine-to-machine access for webhooks
```

### Authentication Patterns
```yaml
# Bearer authentication required
security:
  - bearerAuth: []
x-corso-rbac: [member]  # Required for protected routes

# Public endpoints (opt-out)
x-public: true  # No authentication required
```

## Development Workflow

### Making API Changes
1. **Edit spec**: Modify `api/openapi.yml` with new endpoints or changes
2. **Add RBAC**: Include `x-corso-rbac` for protected routes
3. **Validate**: Run `pnpm openapi:gen` to bundle, lint, and type-generate
4. **Security check**: Run `pnpm openapi:rbac:check` to validate RBAC
5. **Implement**: Update API route handlers in `app/api/`
6. **Test**: Validate with integration tests

### Best Practices
- **Use descriptive operationIds**: `dashboard_chat_process`, `dashboard_query_execute`
- **Include comprehensive schemas**: Define request/response objects in components
- **Document security requirements**: Always specify `x-corso-rbac` for protected routes
- **Keep specs readable**: Use references (`$ref`) for reusable components
- **Validate regularly**: Run full pipeline before commits

## Integration Points

### TypeScript Integration
```typescript
import type { operations } from '@/types/api/openapi';

// Type-safe API operations
type ChatProcessOp = operations['dashboard_chat_process'];

// Full type coverage for requests and responses
interface ChatProcessRequest = ChatProcessOp['requestBody']['content']['application/json'];
interface ChatProcessResponse = ChatProcessOp['responses']['200']['content']['application/x-ndjson'];
```

### Client Integration
```typescript
import { http } from '@/lib/api';

// Type-safe API calls
const response = await http.post('/api/v1/dashboard/chat/process', {
  body: chatRequest,
  headers: { 'Content-Type': 'application/json' }
});
```

## Quality Assurance

### Validation Pipeline
- **Syntax validation**: Spectral OpenAPI linting
- **Security validation**: RBAC guard with role verification
- **Type safety**: Auto-generated TypeScript interfaces
- **Integration testing**: End-to-end API validation

### CI/CD Integration
```bash
# Pre-commit validation
pnpm openapi:gen && pnpm openapi:rbac:check

# CI pipeline
pnpm openapi:lint
pnpm openapi:rbac:check
pnpm typecheck  # Validates generated types
```

## Troubleshooting

### Common Issues
- **RBAC validation failures**: Ensure `x-corso-rbac` is specified for all bearer routes
- **Type generation errors**: Check YAML syntax and `$ref` references in openapi.yml
- **Bundle failures**: Verify all schema references are valid in components section
- **Missing endpoints**: Current spec is complete; check `openapi.yml` for latest endpoints

### Debug Commands
```bash
# Validate YAML syntax
pnpm exec redocly lint api/openapi.yml

# Check RBAC coverage (all protected routes should have x-corso-rbac)
pnpm openapi:rbac:check

# Preview generated types (first 20 lines)
pnpm openapi:types && head -20 types/api/openapi.d.ts

# Compare specs for differences
pnpm openapi:diff

# Full pipeline test
pnpm openapi:gen && pnpm openapi:rbac:check
```

## Related Documentation

- [Security Standards](../docs/security/security-standards.md) — API security patterns
- [API Development](../docs/api/api-development.md) — Implementation guidelines
- [TypeScript Performance](../docs/typescript-performance.md) — Type generation optimization
- [RBAC Configuration](../config/security/rbac-roles.json) — Available roles reference

---

## 🤖 AI Agent Context

### Quick Navigation
- **Source of Truth**: `api/openapi.yml` (authoritative specification - 581 lines)
- **Generated Files**: `api/openapi.json` (bundled - 1,088 lines) + `types/api/openapi.d.ts`
- **Security Validation**: `tools/scripts/openapi-guard-rbac.ts` (RBAC compliance)

### Current State (2025-01-03)
- **Complete Spec**: `openapi.yml` contains all current API endpoints
- **Generated JSON**: `openapi.json` matches YAML exactly
- **TypeScript Types**: Auto-generated and current (from `openapi.json`)
- **RBAC Coverage**: All protected routes use `x-corso-rbac` extension

### Key Patterns
- **Bearer Auth**: All `/api/v1/*` routes use `bearerAuth` + `x-corso-rbac: [member]`
- **Public Endpoints**: Marked with `x-public: true` (health, CSP reports)
- **Streaming**: NDJSON format for AI chat and generation endpoints
- **Versioned API**: All endpoints under `/api/v1/` (production ready)

### Development Flow
1. **Edit Source**: Modify `api/openapi.yml` (add endpoints, update schemas)
2. **Add Security**: Include `x-corso-rbac` for all protected routes
3. **Generate**: `pnpm openapi:gen` (bundle → lint → types)
4. **Validate RBAC**: `pnpm openapi:rbac:check` (security compliance)
5. **Implement**: Create/update route handlers in `app/api/`
6. **Test**: Integration tests with generated TypeScript types

---

**Status**: ✅ **Active** | **Spec Version**: 3.1.0 | **API Version**: v1 | **Last Updated**: 2025-01-03

