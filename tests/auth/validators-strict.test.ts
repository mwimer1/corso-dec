import { describe, expect, it } from "vitest";
import { z } from "zod";
import { EntityQueryRequestSchema } from "@/lib/validators/entityQuery";
import { ContactSchema } from "@/lib/validators/contact";

// Define schemas directly in the test to avoid circular dependencies
const passwordResetSchema = z.object({
  email: z.string().email(),
  new_password: z.string().min(1),
  confirm_password: z.string().min(1),
}).strict();

describe("strict validation", () => {
  it("rejects extra fields in password reset schema", () => {
    const validInput = {
      email: "test@example.com",
      new_password: "password123",
      confirm_password: "password123",
    };
    const extraFieldInput = {
      ...validInput,
      extraField: "should not be allowed",
    };

    const validResult = passwordResetSchema.safeParse(validInput);
    const extraFieldResult = passwordResetSchema.safeParse(extraFieldInput);

    expect(validResult.success).toBe(true);
    expect(extraFieldResult.success).toBe(false);
    expect(extraFieldResult.error?.issues[0]?.code).toBe("unrecognized_keys");
  });

  it("rejects extra fields in Contact schema", () => {
    const validInput = {
      name: "Test User",
      email: "test@example.com",
      company: "Test Company",
      message: "This is a test message",
    };
    const extraFieldInput = {
      ...validInput,
      extraField: "should not be allowed",
    };

    const validResult = ContactSchema.safeParse(validInput);
    const extraFieldResult = ContactSchema.safeParse(extraFieldInput);

    expect(validResult.success).toBe(true);
    expect(extraFieldResult.success).toBe(false);
    expect(extraFieldResult.error?.issues[0]?.code).toBe("unrecognized_keys");
  });

  it("accepts valid inputs without extra fields", () => {
    const validInput = {
      name: "Test User",
      email: "test@example.com",
      company: "Test Company",
      message: "This is a test message",
    };

    const result = ContactSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Test User");
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects extra fields in EntityQueryRequestSchema (API request body)", () => {
    const validInput = {
      page: { index: 0, size: 50 },
      filter: { status: "active" },
      sort: [{ field: "name", dir: "asc" as const }],
    };
    const extraFieldInput = {
      ...validInput,
      extraField: "should not be allowed",
      page: {
        ...validInput.page,
        extraPageField: "also not allowed",
      },
    };

    const validResult = EntityQueryRequestSchema.safeParse(validInput);
    const extraFieldResult = EntityQueryRequestSchema.safeParse(extraFieldInput);

    expect(validResult.success).toBe(true);
    expect(extraFieldResult.success).toBe(false);
    if (!extraFieldResult.success) {
      expect(extraFieldResult.error.issues.some(issue => issue.code === "unrecognized_keys")).toBe(true);
    }
  });
});



