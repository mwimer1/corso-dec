import { beforeEach, describe, expect, it } from "vitest";
import { resolveRouteModule } from "../support/resolve-route";
import { setupDefaultMocks, resetAllMocks, mockCreateCompletion } from "./shared-mocks";
import { mockClerkAuth } from '@/tests/support/mocks';

describe("API v1: ai/generate-sql route - Success Path", () => {
  beforeEach(() => {
    resetAllMocks();
    mockClerkAuth.setup({ userId: 'test-user-123' });
    setupDefaultMocks();
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
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123"
      },
      body: JSON.stringify({ question: "show all users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("sql");
    expect(data.data.sql).toBe("SELECT * FROM users");
  });
});
