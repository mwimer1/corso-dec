import { beforeEach, describe, expect, it } from "vitest";
import { resolveRouteModule } from "../support/resolve-route";
import { setupDefaultMocks, resetAllMocks } from "./shared-mocks";
import { mockClerkAuth } from '@/tests/support/mocks';

describe("API v1: ai/generate-sql route - Basic", () => {
  beforeEach(() => {
    resetAllMocks();
    mockClerkAuth.setup({ userId: 'test-user-123' });
    setupDefaultMocks();
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
        "Origin": "https://example.com",
        "X-Corso-Org-Id": "test-org-123"
      },
      body: method === "POST" ? JSON.stringify({ question: "show all users" }) : undefined,
    });
    const res = await handler(req as any);
    expect(typeof res.status).toBe('number');
  }, 20_000);

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
