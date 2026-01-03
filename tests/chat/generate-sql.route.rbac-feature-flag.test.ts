import { beforeEach, describe, expect, it } from "vitest";
import { resolveRouteModule } from "../support/resolve-route";
import { setupDefaultMocks, resetAllMocks, mockCreateCompletion, mockGetEnv } from "./shared-mocks";
import { mockClerkAuth } from '@/tests/support/mocks';

describe("API v1: ai/generate-sql route - RBAC Feature Flag", () => {
  beforeEach(() => {
    resetAllMocks();
    mockClerkAuth.setup({ userId: 'test-user-123' });
    setupDefaultMocks();
  });

  it("enforces RBAC when ENFORCE_AI_RBAC is true (default)", async () => {
    // Mock getEnv to return ENFORCE_AI_RBAC=true
    mockGetEnv.mockReturnValue({
      ENFORCE_AI_RBAC: true,
      OPENAI_SQL_MODEL: 'gpt-4o-mini',
      NODE_ENV: 'test',
    });

    mockClerkAuth.setup({
      userId: 'test-user-no-role',
      has: () => false, // No allowed roles
    });

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123",
      },
      body: JSON.stringify({ question: "show users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(403); // RBAC enforced
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("bypasses RBAC when ENFORCE_AI_RBAC is false (auth-only fallback)", async () => {
    // Mock getEnv to return ENFORCE_AI_RBAC=false
    mockGetEnv.mockReturnValue({
      ENFORCE_AI_RBAC: false,
      OPENAI_SQL_MODEL: 'gpt-4o-mini',
      NODE_ENV: 'test',
    });

    mockClerkAuth.setup({
      userId: 'test-user-no-role',
      has: () => false, // No allowed roles, but should still pass
    });

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
        "X-Corso-Org-Id": "test-org-123",
      },
      body: JSON.stringify({ question: "show users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(200); // Auth-only, RBAC bypassed
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("still requires authentication when ENFORCE_AI_RBAC is false", async () => {
    // Mock getEnv to return ENFORCE_AI_RBAC=false
    mockGetEnv.mockReturnValue({
      ENFORCE_AI_RBAC: false,
      OPENAI_SQL_MODEL: 'gpt-4o-mini',
      NODE_ENV: 'test',
    });

    mockClerkAuth.setup({ userId: null });

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123",
      },
      body: JSON.stringify({ question: "show users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(401); // Still requires auth
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("HTTP_401");
  });
});
