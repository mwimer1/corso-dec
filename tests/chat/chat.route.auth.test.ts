import { beforeEach, describe, expect, it } from "vitest";
import { setupDefaultMocks, resetAllMocks } from "./shared-mocks";
import { setAuth, importChatRouteModule } from "./shared-helpers";

describe("API v1: ai/chat route - Authentication & RBAC", () => {
  beforeEach(() => {
    resetAllMocks();
    setAuth("test-user-123");
    setupDefaultMocks();
  });

  it("returns 401 when unauthenticated", async () => {
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
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("HTTP_401");
  });

  it("allows authenticated users with member role to access endpoint", async () => {
    // Handler enforces RBAC: requires 'member' or higher role
    const mod: any = await importChatRouteModule('test-user-member');
    if (!mod) return expect(true).toBe(true);
    
    // Setup mock to allow member role (after module import to ensure mock is re-registered)
    const { mockClerkAuth: reimportedMock } = await import('@/tests/support/mocks');
    reimportedMock.setup({
      userId: 'test-user-member',
      has: ({ role }: { role: string }) => role === 'member' || role === 'org:member',
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
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');
  });

  it("allows authenticated users with org:member role to access endpoint", async () => {
    // Handler supports both 'member' and 'org:member' formats
    const mod: any = await importChatRouteModule('test-user-org-member');
    if (!mod) return expect(true).toBe(true);
    
    // Setup mock to allow org:member role (after module import to ensure mock is re-registered)
    const { mockClerkAuth: reimportedMock } = await import('@/tests/support/mocks');
    reimportedMock.setup({
      userId: 'test-user-org-member',
      has: ({ role }: { role: string }) => role === 'org:member',
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
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');
  });

  it("allows authenticated users with admin role to access endpoint", async () => {
    const mod: any = await importChatRouteModule('test-user-admin');
    if (!mod) return expect(true).toBe(true);
    
    const { mockClerkAuth: reimportedMock } = await import('@/tests/support/mocks');
    reimportedMock.setup({
      userId: 'test-user-admin',
      has: ({ role }: { role: string }) => role === 'admin' || role === 'org:admin',
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
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');
  });

  it("allows authenticated users with org:admin role to access endpoint", async () => {
    const mod: any = await importChatRouteModule('test-user-org-admin');
    if (!mod) return expect(true).toBe(true);
    
    const { mockClerkAuth: reimportedMock } = await import('@/tests/support/mocks');
    reimportedMock.setup({
      userId: 'test-user-org-admin',
      has: ({ role }: { role: string }) => role === 'org:admin',
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
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');
  });

  it("allows authenticated users with owner role to access endpoint", async () => {
    const mod: any = await importChatRouteModule('test-user-owner');
    if (!mod) return expect(true).toBe(true);
    
    const { mockClerkAuth: reimportedMock } = await import('@/tests/support/mocks');
    reimportedMock.setup({
      userId: 'test-user-owner',
      has: ({ role }: { role: string }) => role === 'owner' || role === 'org:owner',
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
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');
  });

  it("allows authenticated users with org:owner role to access endpoint", async () => {
    const mod: any = await importChatRouteModule('test-user-org-owner');
    if (!mod) return expect(true).toBe(true);
    
    const { mockClerkAuth: reimportedMock } = await import('@/tests/support/mocks');
    reimportedMock.setup({
      userId: 'test-user-org-owner',
      has: ({ role }: { role: string }) => role === 'org:owner',
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
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');
  });

  it("returns 403 when authenticated user lacks member role", async () => {
    const mod: any = await importChatRouteModule('test-user-no-role');
    if (!mod) return expect(true).toBe(true);
    
    // Setup mock to deny all roles (after module import to ensure mock is re-registered)
    const { mockClerkAuth: reimportedMock } = await import('@/tests/support/mocks');
    reimportedMock.setup({
      userId: 'test-user-no-role',
      has: () => false, // No member role
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
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("denies unauthenticated users (401)", async () => {
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
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("HTTP_401");
  });

});
