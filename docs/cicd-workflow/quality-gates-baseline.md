---
category: "documentation"
last_updated: "2026-01-03"
status: "draft"
title: "Cicd Workflow"
description: "Documentation and resources for documentation functionality. Located in cicd-workflow/."
---
# Quality Gates Baseline Snapshot

**Date**: 2026-01-03  
**Branch**: `chore/baseline-quality-gates`  
**Purpose**: Document authoritative quality gate commands and establish baseline for CI/CD validation

## Core Scripts & Tools

### Package Configuration
- **File**: `package.json`
- **Node.js**: `>=20.19.4 <25` (line 8)
- **pnpm**: `>=10` (line 9)
- **Package Manager**: `pnpm@10.17.1` (line 5)
- **Volta Configuration**: Node `20.19.4`, pnpm `10.17.1` (lines 497-499)

### Core Quality Gate Scripts

#### 1. Type Checking
- **Script**: `typecheck` (line 187)
- **Command**: `pnpm typecheck`
- **Implementation**: `tsc --noEmit --project tsconfig.json`
- **Pre-hook**: `pretypecheck` runs `pnpm openapi:gen` (line 186)
- **Location**: `package.json:187`

#### 2. Linting
- **Script**: `lint` (line 135)
- **Command**: `pnpm lint`
- **Implementation**: 
  - `pnpm exec eslint . --cache --cache-location node_modules/.cache/eslint/.eslintcache --cache-strategy content --no-error-on-unmatched-pattern`
  - `pnpm ast-grep:scan` (runs AST-Grep validation)
- **Location**: `package.json:135`

#### 3. Testing
- **Script**: `test` (line 122)
- **Command**: `pnpm test`
- **Implementation**: `node scripts/assert-no-colocated-tests.cjs && vitest --run`
- **Pre-hook**: `pretest` builds `@corso/eslint-plugin` (line 116)
- **Location**: `package.json:122`

#### 4. OpenAPI Generation
- **Script**: `openapi:gen` (line 78)
- **Command**: `pnpm openapi:gen`
- **Implementation**: `pnpm openapi:bundle && pnpm openapi:lint && pnpm openapi:types`
- **Sub-commands**:
  - `openapi:bundle`: `node scripts/openapi/openapi-bundle.mjs` (line 75)
  - `openapi:lint`: `spectral lint api/openapi.yml` (line 76)
  - `openapi:types`: `openapi-typescript api/openapi.json -o types/api/generated/openapi.d.ts` (line 77)
- **Location**: `package.json:78`

#### 5. OpenAPI RBAC Validation
- **Script**: `openapi:rbac:check` (line 79)
- **Command**: `pnpm openapi:rbac:check`
- **Implementation**: `tsx scripts/openapi/openapi-guard-rbac.ts`
- **Location**: `package.json:79`

#### 6. OpenAPI Linting
- **Script**: `openapi:lint` (line 76)
- **Command**: `pnpm openapi:lint`
- **Implementation**: `spectral lint api/openapi.yml`
- **Location**: `package.json:76`
- **Note**: Also runs as part of `openapi:gen` pipeline

## Baseline Test Results

### Execution Date
2026-01-03

### 1. Linting (`pnpm lint`)
**Status**: ✅ PASSED  
**Output**:
```
> corso-app@0.1.0 lint C:\Users\wimer\OneDrive\Desktop\corso-code
> pnpm exec eslint . --cache --cache-location node_modules/.cache/eslint/.eslintcache --cache-strategy content --no-error-on-unmatched-pattern && pnpm ast-grep:scan

> corso-app@0.1.0 ast-grep:scan C:\Users\wimer\OneDrive\Desktop\corso-code
> pnpm --package=@ast-grep/cli dlx sg scan --config sgconfig.yml .
```

### 2. Type Checking (`pnpm typecheck`)
**Status**: ✅ PASSED  
**Output**:
```
> corso-app@0.1.0 pretypecheck C:\Users\wimer\OneDrive\Desktop\corso-code
> pnpm openapi:gen

> corso-app@0.1.0 openapi:gen C:\Users\wimer\OneDrive\Desktop\corso-code
> pnpm openapi:bundle && pnpm openapi:lint && pnpm openapi:types

> corso-app@0.1.0 openapi:bundle C:\Users\wimer\OneDrive\Desktop\corso-code
> node scripts/openapi/openapi-bundle.mjs

bundling api\openapi.yml...
📦 Created a bundle for api\openapi.yml at api\openapi.json 36ms.

> corso-app@0.1.0 openapi:lint C:\Users\wimer\OneDrive\Desktop\corso-code
> spectral lint api/openapi.yml

No results with a severity of 'error' found!

> corso-app@0.1.0 openapi:types C:\Users\wimer\OneDrive\Desktop\corso-code
> openapi-typescript api/openapi.json -o types/api/generated/openapi.d.ts

✨ openapi-typescript 7.10.1
🚀 api/openapi.json → types/api/generated/openapi.d.ts [109.7ms]

> corso-app@0.1.0 typecheck C:\Users\wimer\OneDrive\Desktop\corso-code
> tsc --noEmit --project tsconfig.json
```

### 3. Testing (`pnpm test`)
**Status**: ✅ PASSED  
**Output Summary**:
```
 Test Files  123 passed (123)
      Tests  725 passed (725)
   Start at  23:43:17
   Duration  28.41s (transform 7.43s, setup 36.46s, collect 58.77s, tests 16.36s, environment 15.53s, prepare 25.16s)
```

**Details**:
- All 123 test files passed
- All 725 tests passed
- Test execution time: 28.41 seconds
- Includes both Node.js and DOM test environments

### 4. OpenAPI RBAC Check (`pnpm openapi:rbac:check`)
**Status**: ✅ PASSED  
**Output**:
```
> corso-app@0.1.0 openapi:rbac:check C:\Users\wimer\OneDrive\Desktop\corso-code
> tsx scripts/openapi/openapi-guard-rbac.ts

OpenAPI RBAC guard: OK
```

### 5. OpenAPI Linting (`pnpm openapi:lint`)
**Status**: ✅ PASSED  
**Output**:
```
> corso-app@0.1.0 openapi:lint C:\Users\wimer\OneDrive\Desktop\corso-code
> spectral lint api/openapi.yml

No results with a severity of 'error' found!
```

## Quality Gate Command Reference

### Recommended Pre-Commit Sequence

**Automatic (Recommended)**: Pre-commit hooks automatically run optimized validation:
- Hooks run on `git commit` - no manual steps needed
- **Performance**: 1-3 seconds (optimized with caching and conditional execution)
- See `.husky/README.md` for details on hook optimizations

**Manual validation** (optional, before pushing):
Run these commands sequentially (one-by-one) before pushing:

```bash
# 1. Type checking (includes OpenAPI generation)
pnpm typecheck

# 2. Linting (ESLint + AST-Grep)
pnpm lint

# 3. Testing
pnpm test

# 4. OpenAPI RBAC validation
pnpm openapi:rbac:check

# 5. OpenAPI linting (optional, already runs in openapi:gen)
pnpm openapi:lint
```

### Comprehensive Quality Gates
For full validation (mirrors CI pipeline):

```bash
# Full quality gates (includes additional checks)
pnpm quality:local
```

## Documentation Status

### Existing Documentation
- ✅ **README.md** (lines 148-164): Documents quality gates sequence
- ✅ **README.md** (lines 186-188): Documents OpenAPI commands
- ✅ **docs/cicd-workflow/ci-pipeline.md**: Comprehensive CI/CD documentation
- ✅ **docs/cicd-workflow/quality-gates.md**: Detailed quality gates documentation
- ✅ **docs/development/setup-guide.md**: Development setup with quality gates

### Documentation Accuracy
All documented commands match the actual `package.json` script definitions. No discrepancies found.

## Node.js & pnpm Requirements

### Version Requirements
- **Node.js**: `>=20.19.4 <25` (from `package.json` engines, line 8)
- **pnpm**: `>=10` (from `package.json` engines, line 9)

### Recommended Versions (Volta)
- **Node.js**: `20.19.4` (from `package.json` volta, line 498)
- **pnpm**: `10.17.1` (from `package.json` volta, line 499)

### Package Manager
- **Primary**: `pnpm@10.17.1` (from `package.json` packageManager, line 5)

## Notes

1. **Type Checking Pre-hook**: `typecheck` automatically runs `openapi:gen` before type checking, ensuring OpenAPI types are up-to-date.

2. **Linting Includes AST-Grep**: The `lint` script runs both ESLint and AST-Grep validation for comprehensive code quality checks.

3. **Test Pre-hook**: The `test` script builds the `@corso/eslint-plugin` workspace package before running tests.

4. **OpenAPI Pipeline**: `openapi:gen` runs three sub-commands in sequence: bundle → lint → types generation.

5. **No Version Files**: The repository does not include `.nvmrc` or `volta.json` files, relying on `package.json` engines and volta configuration.

## Related Documentation

- [CI/CD Pipeline](ci-pipeline.md) - Full CI/CD workflow documentation
- [Quality Gates](quality-gates.md) - Detailed quality gates guide
- [Development Setup](../development/setup-guide.md) - Development environment setup
- [README.md](../../README.md) - Project overview and quick start

---

**Baseline Established**: 2026-01-03  
**All Quality Gates**: ✅ PASSING  
**Documentation**: ✅ ACCURATE
