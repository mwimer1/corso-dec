---
title: "Security"
description: ">-"
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
---
## Public Exports
| Test File | Type | Description |
|-----------|------|-------------|
| `ai-security` | Security test | AI integration security and secret masking |
| `clickhouse-injection` | Security test | SQL injection prevention in ClickHouse queries |
| `core-sql-guards` | Security test | Core SQL security validation |
| `csp-schema` | Security test | Content Security Policy validation |
| `masking-userid-variants` | Security test | User ID masking patterns |
| `rate-limit.edge` | Security test | Edge runtime rate limiting |
| `rate-limit.server` | Security test | Server runtime rate limiting |
| `sql-guards` | Security test | SQL query security guards |
| `tenant-isolation` | Security test | Multi-tenant data isolation |


# Security Tests

> **Comprehensive security tests for the Corso application, organized by security domain and threat category.**

## Test Categories

### 🛡️ ClickHouse Injection Prevention
- **File**: `clickhouse-injection.test.ts`
- **Purpose**: Tests for SQL injection vulnerabilities in ClickHouse queries
- **Coverage**:
  - Dangerous SQL operations (DROP, INSERT, UPDATE, DELETE)
  - System table access prevention
  - UNION injection attacks
  - SQL comment injection patterns
  - Query limit enforcement
  - Secret data masking in logs

### 🤖 AI Security
- **File**: `ai-security.test.ts`
- **Purpose**: Tests for AI integration security, particularly secret handling
- **Coverage**:
  - OpenAI API key masking in logs
  - Nested object secret masking
  - Input sanitization for AI prompts
  - Integration logging patterns
  - Token usage monitoring security

## Running Security Tests

### Run All Security Tests
```bash
pnpm vitest run tests/security/
```

### Run Specific Security Test Files
```bash
pnpm vitest run tests/security/clickhouse-injection.test.ts
pnpm vitest run tests/security/ai-security.test.ts
```

### Run Security Tests with Coverage
```bash
pnpm vitest run tests/security/ --coverage
```

## Security Test Guidelines

### Test Structure
1. **Arrange**: Set up test data and security scenarios
2. **Act**: Execute the security-sensitive operation
3. **Assert**: Verify security controls are working correctly

### Test Patterns

#### Testing Security Rejections
```typescript
it('rejects dangerous SQL operations', async () => {
  const dangerousQueries = [
    'DROP TABLE users',
    'INSERT INTO users VALUES (1, 2)',
    // ... more dangerous queries
  ];

  for (const query of dangerousQueries) {
    await expect(clickhouseQuery(query))
      .rejects
      .toThrow(/dangerous|security validation failed/i);
  }
});
```

#### Testing Security Acceptance
```typescript
it('accepts safe SELECT queries', async () => {
  const safeQueries = [
    'SELECT * FROM events LIMIT 10',
    'SELECT COUNT(*) FROM events',
  ];

  for (const query of safeQueries) {
    await expect(clickhouseQuery(query)).resolves.toBeDefined();
  }
});
```

#### Testing Secret Masking
```typescript
it('masks sensitive data in logs', () => {
  const testData = {
    apiKey: 'sk-1234567890abcdef',
    userId: 'user123',
    safeField: 'this is safe',
  };

  const masked = maskSensitiveData(testData);

  expect(masked.apiKey).toBe('***MASKED***');
  expect(masked.userId).toBe('***MASKED***');
  expect(masked.safeField).toBe('this is safe');
});
```

## Security Test Coverage Goals

### ClickHouse Security
- ✅ 100% coverage of dangerous SQL operations
- ✅ 100% coverage of system table access patterns
- ✅ 100% coverage of injection attack vectors
- ✅ Secret masking in all logging contexts

### AI Security
- ✅ Input sanitization for all AI endpoints
- ✅ Secret masking in AI request/response logs
- ✅ Rate limiting validation for AI endpoints
- ✅ Model version security controls

## Security Test Maintenance

### Adding New Tests
1. Identify the security threat or vulnerability
2. Create a test file in the appropriate category
3. Follow the established test patterns
4. Add comprehensive coverage for the security control
5. Update this README with the new test details

### Test Data Guidelines
- Use realistic but non-sensitive test data
- Avoid actual production secrets or credentials
- Use consistent test patterns across similar tests
- Document any test-specific setup requirements

### Security Test Priorities
1. **Critical**: SQL injection, authentication bypass, data exposure
2. **High**: Authorization failures, rate limiting, input validation
3. **Medium**: Logging security, configuration validation
4. **Low**: Performance impact, minor edge cases

## Integration with CI/CD

Security tests are automatically included in the quality gates:
- `pnpm quality:local` - Full local quality check
- `pnpm test:security` - Dedicated security test run
- CI/CD pipeline includes security test validation

## Related Documentation

- [Security Standards](../../docs/security/)
- [API Security Patterns](../../docs/security/api-security.md)
- [Database Security](../../docs/security/database-security.md)
