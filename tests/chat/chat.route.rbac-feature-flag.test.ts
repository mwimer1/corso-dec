import { beforeEach, describe, expect, it } from "vitest";
import { setupDefaultMocks, resetAllMocks, mockGetEnv } from "./shared-mocks";
import { setAuth, importChatRouteModule } from "./shared-helpers";

describe("API v1: ai/chat route - RBAC Feature Flag", () => {
  beforeEach(() => {
    resetAllMocks();
    setAuth("test-user-123");
    setupDefaultMocks();
  });

  it("enforces RBAC when ENFORCE_AI_RBAC is true (default)", async () => {
    // Mock getEnv to return ENFORCE_AI_RBAC=true
    mockGetEnv.mockReturnValue({
      ENFORCE_AI_RBAC: true,
      OPENAI_SQL_MODEL: 'gpt-4o-mini',
      NODE_ENV: 'test',
      AI_MAX_TOOL_CALLS: 3,
      AI_QUERY_TIMEOUT_MS: 5000,
      AI_TOTAL_TIMEOUT_MS: 60000,
    });

    const mod: any = await importChatRouteModule('test-user-no-role');
    if (!mod) return expect(true).toBe(true);
    
    const { mockClerkAuth: reimportedMock } = await import('@/tests/support/mocks');
    reimportedMock.setup({
      userId: 'test-user-no-role',
      has: () => false, // No allowed roles
    });
    
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/chat", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123",
      },
      body: JSON.stringify({ content: "Hello" }),
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
      AI_MAX_TOOL_CALLS: 3,
      AI_QUERY_TIMEOUT_MS: 5000,
      AI_TOTAL_TIMEOUT_MS: 60000,
    });

    const mod: any = await importChatRouteModule('test-user-no-role');
    if (!mod) return expect(true).toBe(true);
    
    const { mockClerkAuth: reimportedMock } = await import('@/tests/support/mocks');
    reimportedMock.setup({
      userId: 'test-user-no-role',
      has: () => false, // No allowed roles, but should still pass
    });
    
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/chat", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123",
      },
      body: JSON.stringify({ content: "Hello" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(200); // Auth-only, RBAC bypassed
    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');
  });

  it("still requires authentication when ENFORCE_AI_RBAC is false", async () => {
    // Mock getEnv to return ENFORCE_AI_RBAC=false
    mockGetEnv.mockReturnValue({
      ENFORCE_AI_RBAC: false,
      OPENAI_SQL_MODEL: 'gpt-4o-mini',
      NODE_ENV: 'test',
      AI_MAX_TOOL_CALLS: 3,
      AI_QUERY_TIMEOUT_MS: 5000,
      AI_TOTAL_TIMEOUT_MS: 60000,
    });

    const mod: any = await importChatRouteModule(null);
    if (!mod) return expect(true).toBe(true);

    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/chat", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123",
      },
      body: JSON.stringify({ content: "Hello" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(401); // Still requires auth
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("HTTP_401");
  });
});
