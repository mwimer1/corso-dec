---
category: "documentation"
last_updated: "2025-12-13"
status: "draft"
title: "Docs"
description: "Documentation and resources for documentation functionality."
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

### Security
- Validate all inputs with Zod schemas
- Implement rate limiting on all endpoints
- Use secure authentication patterns
- Follow principle of least privilege

### Performance
- Optimize bundle size
- Use efficient queries
- Implement proper caching strategies
- Monitor performance metrics

## 3. Tooling Requirements

- **ESLint**: Custom rules for code quality
- **TypeScript**: Strict mode with comprehensive checking
- **Testing**: Vitest with high coverage targets
- **Security**: Automated vulnerability scanning

---

*Last updated: 2025-10-23*

