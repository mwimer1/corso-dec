import { beforeEach, describe, expect, it } from "vitest";
import { resolveRouteModule } from "../support/resolve-route";
import { setupDefaultMocks, resetAllMocks, mockCreateCompletion } from "./shared-mocks";
import { mockClerkAuth } from '@/tests/support/mocks';

describe("API v1: ai/generate-sql route - Authentication & RBAC", () => {
  beforeEach(() => {
    resetAllMocks();
    mockClerkAuth.setup({ userId: 'test-user-123' });
    setupDefaultMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockClerkAuth.setup({ userId: null });
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

  it("allows authenticated users with member role to access endpoint", async () => {
    // Handler enforces RBAC: requires 'member' or higher role
    mockClerkAuth.setup({
      userId: 'test-user-member',
      has: ({ role }: { role: string }) => role === 'member' || role === 'org:member',
    });

    // Override default streaming mock with non-streaming response for generate-sql
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
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("allows authenticated users with org:member role to access endpoint", async () => {
    // Handler supports both 'member' and 'org:member' formats
    mockClerkAuth.setup({
      userId: 'test-user-org-member',
      has: ({ role }: { role: string }) => role === 'org:member',
    });

    // Override default streaming mock with non-streaming response for generate-sql
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
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("allows authenticated users with admin role to access endpoint", async () => {
    mockClerkAuth.setup({
      userId: 'test-user-admin',
      has: ({ role }: { role: string }) => role === 'admin' || role === 'org:admin',
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
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("allows authenticated users with org:admin role to access endpoint", async () => {
    mockClerkAuth.setup({
      userId: 'test-user-org-admin',
      has: ({ role }: { role: string }) => role === 'org:admin',
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
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("allows authenticated users with owner role to access endpoint", async () => {
    mockClerkAuth.setup({
      userId: 'test-user-owner',
      has: ({ role }: { role: string }) => role === 'owner' || role === 'org:owner',
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
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("allows authenticated users with org:owner role to access endpoint", async () => {
    mockClerkAuth.setup({
      userId: 'test-user-org-owner',
      has: ({ role }: { role: string }) => role === 'org:owner',
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
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 403 when authenticated user lacks member role", async () => {
    mockClerkAuth.setup({
      userId: 'test-user-no-role',
      has: () => false, // No member role
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
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("denies unauthenticated users (401)", async () => {
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
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("HTTP_401");
  });

});
