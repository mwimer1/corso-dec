---
title: "Development Best Practices"
description: "Essential coding guardrails and development standards for the Corso platform."
last_updated: "2026-01-02"
category: "documentation"
status: "active"
---
# Development Best Practices

Essential coding guardrails and development standards for the Corso platform.

## 1. Core Coding Guardrails

| Rule | Why | Enforcement |
|------|-----|-------------|
| Rate Limiting Required | Security requirement | Automatic validation |
| AI Prompt Security | Security requirement | Automatic validation |
| Zod Validation | Input validation | Required for all API endpoints |
| Error Handling | Consistent error responses | Required for all routes |
| TypeScript Strict | Type safety | Always enabled |

## 2. Development Standards

### Code Quality
- Use TypeScript strict mode
- Implement comprehensive error handling
- Follow consistent naming conventions
- Maintain high test coverage
- See [Coding Standards](development/coding-standards.md) for detailed guidelines
- See [Testing Guide](testing-quality/testing-guide.md) for testing patterns and examples

### Security
- Validate all inputs with Zod schemas
- Implement rate limiting on all endpoints
- Use secure authentication patterns
- Follow principle of least privilege

### Performance
- Optimize bundle size (< 300KB Brotli target)
- Use efficient queries with pagination
- Implement proper caching strategies
- Monitor performance metrics (Lighthouse CI)
- See [Performance Optimization Guide](performance/performance-optimization-guide.md) for detailed guidelines

## 3. Tooling Requirements

- **ESLint**: Custom rules for code quality
- **TypeScript**: Strict mode with comprehensive checking
- **Testing**: Vitest with high coverage targets (see [Testing Guide](testing-quality/testing-guide.md))
- **Security**: Automated vulnerability scanning

---

*Last updated: 2025-10-23*
