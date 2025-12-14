import * as clickhouseHealth from '@/app/api/public/health/clickhouse/route';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the ClickHouse client
const mockQuery = vi.fn();
const mockGetClickHouseClient = vi.fn();

vi.mock('@/lib/integrations/clickhouse/client', () => ({
  getClickHouseClient: () => mockGetClickHouseClient(),
}));

describe('ClickHouse health route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClickHouseClient.mockReturnValue({
      query: mockQuery,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('declares Node.js runtime', () => {
    expect(clickhouseHealth.runtime).toBe('nodejs');
  });

  it('GET returns healthy status when ClickHouse responds', async () => {
    mockQuery.mockResolvedValue([]);

    const res = await clickhouseHealth.GET(new Request('http://localhost/api/health/clickhouse'));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          service: 'clickhouse',
          responseTime: expect.stringMatching(/^\d+ms$/),
        }),
      }),
    );

    expect(mockQuery).toHaveBeenCalledWith({ query: 'SELECT 1' });
  });

  it('HEAD returns 204 when ClickHouse is healthy', async () => {
    mockQuery.mockResolvedValue([]);

    const res = await clickhouseHealth.HEAD();
    expect(res.status).toBe(204);
    expect(mockQuery).toHaveBeenCalledWith({ query: 'SELECT 1' });
  });

  it('GET returns 500 when ClickHouse query fails', async () => {
    const error = new Error('Connection timeout');
    mockQuery.mockRejectedValue(error);

    const res = await clickhouseHealth.GET(new Request('http://localhost/api/health/clickhouse'));
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'CLICKHOUSE_UNHEALTHY',
          message: 'ClickHouse health check failed',
          details: expect.objectContaining({
            message: 'Connection timeout',
            responseTime: expect.stringMatching(/^\d+ms$/),
            timestamp: expect.any(String),
          }),
        }),
      }),
    );
  });

  it('HEAD returns 500 when ClickHouse query fails', async () => {
    const error = new Error('Authentication failed');
    mockQuery.mockRejectedValue(error);

    const res = await clickhouseHealth.HEAD();
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'CLICKHOUSE_UNHEALTHY',
          message: 'ClickHouse health check failed',
          details: expect.objectContaining({
            message: 'Authentication failed',
            responseTime: expect.stringMatching(/^\d+ms$/),
            timestamp: expect.any(String),
          }),
        }),
      }),
    );
  });

  it('GET handles non-Error exceptions', async () => {
    mockQuery.mockRejectedValue('String error');

    const res = await clickhouseHealth.GET(new Request('http://localhost/api/health/clickhouse'));
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error.details).toEqual(
      expect.objectContaining({
        message: 'Unknown error',
        responseTime: expect.stringMatching(/^\d+ms$/),
        timestamp: expect.any(String),
      }),
    );
  });

  it('HEAD handles non-Error exceptions', async () => {
    mockQuery.mockRejectedValue(null);

    const res = await clickhouseHealth.HEAD();
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error.details).toEqual(
      expect.objectContaining({
        message: 'Unknown error',
        responseTime: expect.stringMatching(/^\d+ms$/),
        timestamp: expect.any(String),
      }),
    );
  });

  it('OPTIONS returns 204', async () => {
    const res = await clickhouseHealth.OPTIONS();
    expect(res.status).toBe(204);
  });

  it('GET includes proper timestamp format', async () => {
    mockQuery.mockResolvedValue([]);

    const res = await clickhouseHealth.GET(new Request('http://localhost/api/health/clickhouse'));
    const json = await res.json();

    expect(json.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('uses ClickHouse client singleton correctly', async () => {
    mockQuery.mockResolvedValue([]);

    await clickhouseHealth.GET(new Request('http://localhost/api/health/clickhouse'));

    expect(mockGetClickHouseClient).toHaveBeenCalled();
  });
});

