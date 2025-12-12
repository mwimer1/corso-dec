import { ClerkEventEnvelope, ClerkUserPayload } from "@/lib/validators";
import { describe, expect, it } from "vitest";

describe("Clerk webhook validators", () => {
  it("parses a minimal user.created envelope", () => {
    const payload = {
      type: "user.created",
      data: { id: "user_123" },
      object: "event",
    };
    const parsed = ClerkEventEnvelope.parse(payload);
    expect(parsed.type).toBe("user.created");
  });

  it("rejects unexpected top-level props (strict)", () => {
    const payload = {
      type: "user.updated",
      data: { id: "user_123" },
      object: "event",
      extra: true,
    };
    expect(() => ClerkEventEnvelope.parse(payload)).toThrowError();
  });

  it("parses the nested user payload we rely on", () => {
    const user = {
      id: "user_123",
      first_name: "Ada",
      email_addresses: [{ email_address: "ada@example.com" }],
    };
    const parsed = ClerkUserPayload.parse(user);
    expect(parsed.id).toBe("user_123");
  });
});



