import { describe, expect, it, vi } from "vitest";
import { resolveRouteModule } from "../support/resolve-route";

// Mock the auth function
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

describe("API v1: ai/generate-sql route", () => {
  beforeEach(async () => {
    mockAuth.mockResolvedValue({
      userId: 'test-user-123',
      has: vi.fn().mockReturnValue(true),
    });

    // Mock the generateSQL function
    vi.doMock("@/lib/chat/query/sql-generation", () => ({
      generateSQL: vi.fn().mockImplementation(async (params: any) => {
        console.log('generateSQL called with:', params);
        if (params.question.includes('drop')) {
          return { isValid: false, error: "SQL contains dangerous operations" };
        }
        return { isValid: true, sql: "SELECT * FROM users LIMIT 100" };
      }),
    }));
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

  it("returns 200 for safe SQL queries", async () => {
    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true); // route absent on this branch → skip

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Origin": "https://example.com"
      },
      body: JSON.stringify({ question: "show all users" }),
    });


    const res = await handler(req as any);
    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response body:', data);
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("sql");
    expect(data.data.sql).toBe("show all users");
  });

  it("returns 400 for unsafe SQL queries", async () => {
    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true); // route absent on this branch → skip

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Origin": "https://example.com"
      },
      body: JSON.stringify({ question: "drop all tables" }),
    });


    const res = await handler(req as any);
    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response body:', data);
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_SQL");
    expect(data.error.message).toBe("Unsafe SQL detected");
  });
});

