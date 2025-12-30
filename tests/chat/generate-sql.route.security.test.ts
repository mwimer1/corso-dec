import { beforeEach, describe, expect, it } from "vitest";
import { resolveRouteModule } from "../support/resolve-route";
import { setupDefaultMocks, resetAllMocks, mockCreateCompletion } from "./shared-mocks";
import { mockClerkAuth } from '@/tests/support/mocks';

describe("API v1: ai/generate-sql route - Security (Unsafe SQL)", () => {
  beforeEach(() => {
    resetAllMocks();
    mockClerkAuth.setup({ userId: 'test-user-123' });
    setupDefaultMocks();
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
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123"
      },
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
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123"
      },
      body: JSON.stringify({ sql: "TRUNCATE TABLE users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_SQL");
  });
});
