import { maskSensitiveData } from '@/lib/security';
import { clickhouseQuery } from '@/lib/integrations/clickhouse/client';
import { describe, expect, it } from 'vitest';

describe('ClickHouse Security - Injection Prevention', () => {
  it('rejects dangerous SQL operations', async () => {
    const dangerousQueries = [
      'DROP TABLE users',
      'INSERT INTO users VALUES (1, 2)',
      'UPDATE users SET password = "hacked"',
      'DELETE FROM users',
      'TRUNCATE TABLE users',
      'ALTER TABLE users ADD COLUMN malicious BOOLEAN DEFAULT true',
    ];

    for (const query of dangerousQueries) {
      await expect(clickhouseQuery(query))
        .rejects
        .toThrow(/dangerous|security validation failed/i);
    }
  });

  it('rejects system table access', async () => {
    const systemQueries = [
      'SELECT * FROM system.tables',
      'SELECT * FROM information_schema.tables',
      'SELECT * FROM system.processes',
    ];

    for (const query of systemQueries) {
      await expect(clickhouseQuery(query))
        .rejects
        .toThrow(/system tables not allowed|security validation failed/i);
    }
  });

  it('rejects UNION injection attacks', async () => {
    const unionQueries = [
      'SELECT * FROM events UNION SELECT * FROM users',
      'SELECT 1 UNION SELECT password FROM users',
      'SELECT * FROM events WHERE 1=1 UNION SELECT * FROM system.tables',
    ];

    for (const query of unionQueries) {
      await expect(clickhouseQuery(query))
        .rejects
        .toThrow(/dangerous|security validation failed/i);
    }
  });

  it('rejects SQL comments as potential injection', async () => {
    const commentQueries = [
      'SELECT * FROM users -- DROP TABLE users',
      'SELECT * FROM users /* malicious comment */',
      'SELECT * FROM users; DROP TABLE users',
    ];

    for (const query of commentQueries) {
      await expect(clickhouseQuery(query))
        .rejects
        .toThrow(/dangerous|security validation failed/i);
    }
  });

  it('accepts safe SELECT queries', async () => {
    const safeQueries = [
      'SELECT * FROM events LIMIT 10',
      'SELECT COUNT(*) FROM events',
      'SELECT id, name FROM events WHERE status = "active"',
    ];

    for (const query of safeQueries) {
      // These should not throw errors
      await expect(clickhouseQuery(query)).resolves.toBeDefined();
    }
  });

  it('enforces reasonable query limits', async () => {
    const queries = [
      'SELECT * FROM events LIMIT 10000',
      'SELECT * FROM events LIMIT 50000',
    ];

    for (const query of queries) {
      await expect(clickhouseQuery(query))
        .rejects
        .toThrow(/security validation failed/i);
    }
  });
});

describe('ClickHouse Security - Secret Masking', () => {
  it('masks sensitive data in logs', () => {
    const testData = {
      userId: 'user123',
      userid: 'sensitive-user-456',
      user_id: 'also-sensitive-789',
      apiKey: 'sk-1234567890abcdef',
      token: 'secret-token-value',
      password: 'user-password',
      safeField: 'this is safe',
    };

    const masked = maskSensitiveData(testData);

    expect(masked.userId).toBe('user123'); // userId is NOT considered sensitive
    expect(masked.apiKey).toBe('***MASKED***');
    expect(masked.token).toBe('***MASKED***');
    expect(masked.password).toBe('***MASKED***');
    expect(masked.user_id).toBe('***MASKED***');
    expect(masked.userid).toBe('***MASKED***');
    expect(masked.safeField).toBe('this is safe');
  });

  it('masks nested sensitive data', () => {
    const testData = {
      user: {
        apiKey: 'sk-123456',
        profile: {
          secret: 'nested-secret',
        },
      },
      safeData: 'not sensitive',
    };

    const masked = maskSensitiveData(testData);

    expect(masked.user.apiKey).toBe('***MASKED***');
    expect(masked.user.profile.secret).toBe('***MASKED***');
    expect(masked.safeData).toBe('not sensitive');
  });
});

