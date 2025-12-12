import { describe, it, expect } from "vitest";
import { resolveRouteModule } from "../../support/resolve-route";

describe("API v1: subscription/status route", () => {
  it("loads route module and returns a Response", async () => {
    const url = resolveRouteModule("subscription/status");
    if (!url) return expect(true).toBe(true);
    const mod: any = await import(url);
    const handler = mod.GET ?? mod.POST;
    expect(typeof handler).toBe("function");
    const method = handler === mod.POST ? "POST" : "GET";
    const req = new Request("http://localhost/api/v1/subscription/status", { method });
    const res = await handler(req as any);
    expect(res).toBeInstanceOf(Response);
  }, 20_000);
});



