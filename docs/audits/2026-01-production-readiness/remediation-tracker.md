---
category: "documentation"
last_updated: "2026-01-04"
status: "draft"
title: "2026 01 Production Readiness"
description: "Documentation and resources for documentation functionality. Located in audits/2026-01-production-readiness/."
---
# Production Readiness Remediation Tracker

**Purpose**: Single source of truth for tracking production readiness remediation work. Each item represents a discrete action that can be completed in a focused PR.

**Audit Date**: 2026-01-03  
**Baseline**: See [baseline/README.md](./baseline/README.md) for capture instructions

## Definition of Done (DoD)

Every remediation PR must meet these criteria:

- ✅ **New/updated tests in `tests/`** (no co-located tests)
- ✅ **Relevant validation scripts pass** (at minimum: area-specific ones + `pnpm quality:local`)
- ✅ **No domain boundary violations** (don't "fix" by disabling lint rules)
- ✅ **No runtime boundary violations** (Edge-safe stays Edge-safe)
- ✅ **Docs updated if behavior changed** (OpenAPI/RBAC, security docs, etc.)

## Remediation Backlog

| ID | Priority | Area | Description | Files/Modules | Acceptance Criteria | Tests Required | Status | Notes |
|----|----------|------|-------------|---------------|---------------------|-----------------|--------|-------|
| PR-001 | Critical | Security | Implement strict filter validation | `lib/validators/entity.ts`, `app/api/v1/entity/**` | Eliminate `z.any()` in request surface; whitelist fields/operators | Unit tests for filter validation, integration tests for API routes | 🔴 Not Started | See baseline: `validate:zod:strict` |
| PR-002 | Critical | Security | Harden "relaxed auth mode" | `lib/auth/**`, `middleware.ts` | Cannot be enabled in production; fail build/deploy if attempted | Tests for build-time check, runtime guard tests | 🔴 Not Started | Must prevent accidental production enablement |
| PR-003 | High | Security | Verify AI SQL guard is enforced + tested | `lib/security/assessment/ai-validator.ts`, `app/api/v1/ai/**` | Bad SQL is blocked; explicit tests ensure guard works | Security tests for SQL injection prevention | 🔴 Not Started | See baseline: `audit:ai` |
| PR-004 | High | Security | Rate limiting scaling plan | `lib/middleware/edge/rate-limit.ts`, `lib/ratelimiting/**` | Phase 1: Document & ensure coverage on write routes; Phase 2: Optional distributed store | Tests for rate limit coverage, load tests | 🔴 Not Started | Document current state, add missing coverage |
| PR-005 | High | Production | Add/verify health endpoints | `app/api/status/**`, `app/api/health/**` | Liveness + readiness endpoints; ensure no secrets leak | Integration tests for health endpoints | 🔴 Not Started | Verify existing endpoints meet requirements |
| PR-006 | Medium | Tech Debt | Remove duplicate helpers + confusing aliases | `lib/api/**`, `lib/middleware/**` | Remove `withErrorHandling` alias confusion; consolidate duplicate helpers | Refactor tests to use consolidated helpers | 🔴 Not Started | Audit for duplicates first |
| PR-007 | Medium/Low | Integration | Directus adapter decision | `lib/integrations/directus/**` | Either implement, remove, or hard-block from being enabled | Decision documented; tests for chosen path | 🔴 Not Started | Requires product decision |
| PR-008 | Low | Testing | Add automated a11y checks | `tests/e2e/**`, Playwright config | Playwright + axe against key pages | E2E tests with a11y assertions | 🔴 Not Started | Optional enhancement |

## Workstreams

### Security Hardening (First Priority)

**Goal**: Address critical security vulnerabilities before any other work.

**Items**: PR-001, PR-002, PR-003, PR-004

**Definition of Done**:
- All critical security items completed
- Security tests passing
- No `z.any()` in request validation
- Auth mode cannot be relaxed in production
- AI SQL guard verified and tested
- Rate limiting coverage documented and complete

### Production Blockers

**Goal**: Fix issues that prevent safe production deployment.

**Items**: PR-005

**Definition of Done**:
- Health endpoints responding correctly
- No secrets in health check responses
- Health checks tested and documented

### Maintainability & Tech Debt Cleanup

**Goal**: Reduce technical debt and improve maintainability.

**Items**: PR-006, PR-007

**Definition of Done**:
- Duplicate helpers removed
- Confusing aliases resolved
- Directus adapter decision made and implemented

### Hardening Tests

**Goal**: Add missing security and runtime boundary tests.

**Items**: PR-008

**Definition of Done**:
- Automated a11y checks running in CI
- Key pages tested for accessibility

## Execution Guidelines

### One PR Per Action Item

Each PR should be:
- **Narrowly scoped**: One item from the backlog
- **Includes tests**: Per DoD requirements
- **Updates tracker**: Check off item when merged
- **Runs targeted commands**: Area-specific validation + `pnpm quality:local`

### PR Template

When creating a PR for a remediation item:

```markdown
## Remediation Item: [ID] - [Description]

**Priority**: [Critical/High/Medium/Low]
**Area**: [Security/Production/Tech Debt/Testing]

### Changes
- [List of changes]

### Tests
- [List of tests added/updated]

### Validation
- [ ] `pnpm quality:local` passes
- [ ] Area-specific validation passes: [list commands]
- [ ] No boundary violations introduced
- [ ] Docs updated (if applicable)

### Related
- Closes #[issue-number]
- Related to: [other PRs/issues]
```

### Before Merge Checklist

- [ ] All DoD criteria met
- [ ] `pnpm quality:local` passes
- [ ] Area-specific validation passes
- [ ] No new boundary violations
- [ ] Tracker updated (mark item as complete)
- [ ] PR description includes remediation item ID

## Progress Tracking

### Completed Items

_Items will be moved here as they are completed and merged._

### In Progress

_Items currently being worked on._

### Blocked

_Items waiting on external dependencies or decisions._

## Staging Deploy & Regression Pass

After security + production blocker PRs land:

1. **Deploy to Vercel staging**
2. **Run Playwright smoke tests** (and optionally `test:security`)
3. **Validate Sentry** is receiving errors (and not leaking PII)
4. **Confirm Edge routes** actually run on Edge where intended

## Production Release Verification Checklist

Keep it simple:

- [ ] Health endpoints responding
- [ ] Auth enforced on protected routes
- [ ] Rate limiting working
- [ ] No runtime boundary violations in logs
- [ ] Error rates normal

## Baseline References

All baseline outputs are stored in `baseline/` directory:

- `quality-local.txt` - Full quality gates baseline
- `openapi-rbac.txt` - OpenAPI RBAC validation baseline
- `cursor-rules.txt` - Cursor rules validation baseline
- `madge.txt` - Circular dependency baseline
- `jscpd.txt` - Code duplication baseline
- `verify-edge.txt` - Edge runtime verification baseline
- `lint-edge-runtime.txt` - Edge runtime linting baseline
- `boundaries-deep.txt` - Deep boundary validation baseline
- `zod-strict.txt` - Strict Zod validation baseline
- `test-coverage.txt` - Test coverage baseline

## Related Documentation

- [Baseline Capture Instructions](./baseline/README.md) - How to capture baseline
- [Quality Gates](../../quality/quality-gates.md) - Quality gates documentation
- [Production Readiness Checklist](../../production/production-readiness-checklist.md) - Production readiness checklist
- [Security Standards](../../../.cursor/rules/security-standards.mdc) - Security implementation guide

---

**Last Updated**: 2026-01-03  
**Status**: 🔴 In Progress  
**Next Review**: After each PR merge
