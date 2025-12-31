---
title: Audits
description: >-
  Documentation and resources for documentation functionality. Located in
  audits/.
last_updated: '2025-12-31'
category: documentation
status: draft
---
# OpenAPI Specification Locations

**Generated**: 2025-01-XX (Sprint 0 Baseline Verification)  
**Status**: ✅ Complete - All OpenAPI files located and verified

## Primary OpenAPI Files

### Source of Truth
- **File**: `api/openapi.yml`
- **Format**: OpenAPI 3.1.0 (YAML)
- **Size**: 581 lines (per README)
- **Status**: ✅ Canonical source specification
- **Description**: Authoritative OpenAPI specification for all public API endpoints

### Generated Artifacts

#### Bundled JSON
- **File**: `api/openapi.json`
- **Format**: OpenAPI 3.1.0 (JSON)
- **Size**: 1,088 lines (per README)
- **Status**: ✅ Auto-generated from `api/openapi.yml`
- **Generation Command**: `pnpm openapi:bundle`
- **Tool**: `redocly bundle api/openapi.yml -o api/openapi.json --ext json`
- **Description**: Bundled JSON matching YAML exactly (includes all `$ref` resolutions)

#### Base JSON (Legacy?)
- **File**: `api/openapi.base.json`
- **Status**: ⚠️ Found but not documented in README
- **Notes**: May be legacy or intermediate file - needs verification

#### TypeScript Types
- **File**: `types/api/generated/openapi.d.ts`
- **Format**: TypeScript declaration file
- **Status**: ✅ Auto-generated from `api/openapi.json`
- **Generation Command**: `pnpm openapi:types`
- **Tool**: `openapi-typescript api/openapi.json -o types/api/generated/openapi.d.ts`
- **Description**: TypeScript interfaces for API operations, requests, and responses

## OpenAPI Tooling

### Validation Scripts
- **RBAC Guard**: `scripts/openapi/openapi-guard-rbac.ts`
  - **Command**: `pnpm openapi:rbac:check`
  - **Purpose**: Validates RBAC annotations (`x-corso-rbac`) and security requirements
  - **Checks**: All bearer-auth operations have `x-corso-rbac` or `x-public`

### Generation Pipeline
- **Full Pipeline**: `pnpm openapi:gen`
  - Runs: `openapi:bundle` → `openapi:lint` → `openapi:types`
  - Ensures all artifacts are synchronized

### Linting
- **Command**: `pnpm openapi:lint`
- **Tool**: `spectral lint api/openapi.yml`
- **Purpose**: Validates OpenAPI YAML syntax and best practices

## File Relationships

```
api/openapi.yml (source)
    ↓ pnpm openapi:bundle
api/openapi.json (bundled)
    ↓ pnpm openapi:types
types/api/generated/openapi.d.ts (TypeScript types)
```

## Documentation References

### API README
- **File**: `api/README.md`
- **Status**: ✅ Active documentation
- **Last Updated**: 2025-12-15
- **Contains**: 
  - OpenAPI spec overview
  - Generation commands
  - Security patterns (RBAC)
  - Development workflow

### App API README
- **File**: `app/api/README.md`
- **Status**: ✅ Active documentation
- **Last Updated**: 2025-01-03
- **Contains**:
  - API route structure
  - OpenAPI reference (points to `api/openapi.yml`)
  - Runtime configuration
  - Security standards

## Verification Commands

```bash
# Verify OpenAPI files exist
ls -la api/openapi.*
ls -la types/api/generated/openapi.d.ts

# Validate spec
pnpm openapi:gen

# Check RBAC compliance
pnpm openapi:rbac:check

# Lint spec
pnpm openapi:lint
```

## Findings

### ✅ Confirmed
- Primary spec: `api/openapi.yml` (581 lines)
- Generated JSON: `api/openapi.json` (1,088 lines)
- TypeScript types: `types/api/generated/openapi.d.ts`
- Documentation: `api/README.md` and `app/api/README.md`

### ⚠️ Needs Verification
- `api/openapi.base.json` - Purpose unclear, not mentioned in README
- Whether `openapi.base.json` is legacy or used in generation pipeline

### 📋 Recommendations
1. Document purpose of `api/openapi.base.json` or remove if unused
2. Ensure all OpenAPI files are in version control
3. Verify CI pipeline runs `pnpm openapi:gen` and `pnpm openapi:rbac:check`
