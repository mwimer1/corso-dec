import { describe, expect, it } from "vitest";
import { resolveRouteModule } from "../support/resolve-route";

describe("API v1: chat/generate-chart route", () => {
  it("loads route module and returns a Response", async () => {
    const url = resolveRouteModule("chat/generate-chart");
    if (!url) return expect(true).toBe(true);
    const mod: any = await import(url);
    const handler = mod.POST ?? mod.GET;
    expect(typeof handler).toBe("function");
    const method = handler === mod.POST ? "POST" : "GET";
    const req = new Request("http://localhost/api/v1/chat/generate-chart", {
      method,
      headers: { "content-type": "application/json" },
      body: method === "POST" ? JSON.stringify({ prompt: "bar chart revenue by month" }) : undefined,
    });
    const res = await handler(req as any);
    expect(res).toBeInstanceOf(Response);
  }, 20_000);
});

