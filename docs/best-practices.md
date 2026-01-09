---
status: "draft"
last_updated: "2026-01-09"
category: "documentation"
---
# Development Best Practices

Quick reference guide to essential coding guardrails and development standards for the Corso platform. For detailed guidelines, see the comprehensive documentation linked below.

## Core Coding Guardrails

| Rule | Enforcement | Details |
|------|-------------|---------|
| Rate Limiting Required | Automatic validation | Required for all endpoints |
| AI Prompt Security | Automatic validation | Required for AI endpoints |
| Zod Validation | Required for API endpoints | All inputs must be validated |
| Error Handling | Required for all routes | Consistent error responses |
| TypeScript Strict | Always enabled | Type safety enforced |

## Development Standards Quick Reference

### Code Quality
- ✅ Use TypeScript strict mode
- ✅ Implement comprehensive error handling
- ✅ Follow consistent naming conventions
- ✅ Maintain high test coverage (≥80% lines, ≥75% functions, ≥70% branches)

**See**: [Coding Standards](development/coding-standards.md) for detailed guidelines

### Security
- ✅ Validate all inputs with Zod schemas
- ✅ Implement rate limiting on all endpoints
- ✅ Use secure authentication patterns
- ✅ Follow principle of least privilege

**See**: [Security Standards](../.cursor/rules/security-standards.mdc) for detailed security patterns

### Performance
- ✅ Optimize bundle size (< 300KB Brotli target)
- ✅ Use efficient queries with pagination
- ✅ Implement proper caching strategies
- ✅ Monitor performance metrics (Lighthouse CI)

**See**: [Performance Optimization Guide](performance/performance-optimization-guide.md) for detailed guidelines

### Testing
- ✅ Write unit tests for utilities and components
- ✅ Write integration tests for API routes
- ✅ Write E2E tests for critical user flows
- ✅ Maintain coverage thresholds (≥80% lines)

**See**: [Testing Guide](quality/testing-guide.md) for testing patterns and examples

## Tooling Requirements

- **ESLint**: Custom rules for code quality
- **TypeScript**: Strict mode with comprehensive checking
- **Vitest**: Testing framework with high coverage targets
- **Security**: Automated vulnerability scanning

## Comprehensive Documentation

For complete guidelines, see:

- [Coding Standards](development/coding-standards.md) - Code style and conventions
- [Testing Guide](quality/testing-guide.md) - Testing patterns and coverage requirements
- [Security Standards](../.cursor/rules/security-standards.mdc) - Security implementation patterns
- [Performance Optimization Guide](performance/performance-optimization-guide.md) - Performance best practices
- [Development Environment Setup](development/setup-guide.md) - Environment setup and workflows
- [Quality Gates](quality/quality-gates.md) - PR quality gate requirements

---

**Last Updated**: 2026-01-04  
**Maintained By**: Platform Team  
**Status**: Active
