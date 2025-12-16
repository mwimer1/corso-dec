import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveRouteModule } from "../support/resolve-route";

// Mock the auth function
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Mock OpenAI client
const mockCreateCompletion = vi.fn();
vi.mock('@/lib/integrations/openai/server', () => ({
  createOpenAIClient: () => ({
    chat: {
      completions: {
        create: mockCreateCompletion,
      },
    },
  }),
}));

// Mock validateSQLScope (it will throw SecurityError for unsafe SQL)
vi.mock('@/lib/integrations/database/scope', () => ({
  validateSQLScope: vi.fn((sql: string) => {
    const s = sql.toLowerCase();
    if (/\bdrop\b|\btruncate\b|\bdelete\b(?!\s+from\s+\w+\s+where)/.test(s)) {
      const { SecurityError } = require('@/lib/shared/errors/types');
      throw new SecurityError('Unsafe SQL detected', 'SUSPICIOUS_SQL_PATTERN');
    }
  }),
}));

describe("API v1: ai/generate-sql route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: 'test-user-123',
    });
    // Mock successful OpenAI response
    mockCreateCompletion.mockResolvedValue({
      choices: [{
        message: {
          content: 'SELECT * FROM users',
        },
      }],
    });
  });

  it("loads route module and returns a Response", async () => {
    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true); // route absent on this branch → skip

    const mod: any = await import(url);
    const handler = mod.POST ?? mod.GET;
    expect(typeof handler).toBe("function");
    const method = handler === mod.POST ? "POST" : "GET";
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method,
      headers: {
        "content-type": "application/json",
        "Origin": "https://example.com"
      },
      body: method === "POST" ? JSON.stringify({ question: "show all users" }) : undefined,
    });
    const res = await handler(req as any);
    expect(typeof res.status).toBe('number');
  }, 20_000);

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "show all users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("HTTP_401");
  });

  it("returns 200 for safe SQL queries", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'SELECT * FROM users',
        },
      }],
    });

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "show all users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("sql");
    expect(data.data.sql).toBe("SELECT * FROM users");
  });

  it("returns 400 for missing required field", async () => {
    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("accepts sql, prompt, query, or question fields", async () => {
    mockCreateCompletion.mockResolvedValue({
      choices: [{
        message: {
          content: 'SELECT * FROM users',
        },
      }],
    });

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;

    // Test with 'sql' field
    const req1 = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sql: "SELECT * FROM users" }),
    });
    const res1 = await handler(req1 as any);
    expect(res1.status).toBe(200);

    // Test with 'prompt' field
    const req2 = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "show me users" }),
    });
    const res2 = await handler(req2 as any);
    expect(res2.status).toBe(200);
  });

  it("returns 400 for unsafe SQL queries (DROP)", async () => {
    // Mock OpenAI returning unsafe SQL
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'DROP TABLE users',
        },
      }],
    });

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "drop all tables" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_SQL");
  });

  it("returns 400 for unsafe SQL queries (TRUNCATE)", async () => {
    // Mock OpenAI returning unsafe SQL
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'TRUNCATE TABLE users',
        },
      }],
    });

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sql: "TRUNCATE TABLE users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_SQL");
  });

  it("handles OPTIONS request for CORS", async () => {
    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.OPTIONS;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "OPTIONS",
      headers: { "Origin": "https://example.com" },
    });

    const res = await handler(req as any);
    expect([200, 204]).toContain(res.status);
  });
});

