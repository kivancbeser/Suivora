import { describe, expect, expectTypeOf, it } from "vitest";
import {
  parseSupabasePublicEnvironment,
  PublicEnvironmentError,
  type SupabasePublicConfig,
} from "./public";

const validEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.invalid",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
} as const;

describe("public Supabase environment", () => {
  it("returns a typed immutable configuration for valid input", () => {
    const configuration = parseSupabasePublicEnvironment(validEnvironment);

    expect(configuration).toEqual({
      url: validEnvironment.NEXT_PUBLIC_SUPABASE_URL,
      publishableKey: validEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    expect(Object.isFrozen(configuration)).toBe(true);
    expectTypeOf(configuration).toEqualTypeOf<SupabasePublicConfig>();
  });

  it.each([
    [{ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key" }, "NEXT_PUBLIC_SUPABASE_URL"],
    [
      {
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key",
      },
      "must be a valid URL",
    ],
    [{ NEXT_PUBLIC_SUPABASE_URL: "https://project.invalid" }, "PUBLISHABLE_KEY"],
  ])("rejects invalid input without exposing values", (environment, message) => {
    expect(() => parseSupabasePublicEnvironment(environment)).toThrowError(
      PublicEnvironmentError,
    );
    expect(() => parseSupabasePublicEnvironment(environment)).toThrow(message);
  });

  it("does not include a supplied credential in validation errors", () => {
    const credential = "private-test-value-that-must-not-leak";

    expect(() =>
      parseSupabasePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: credential,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: credential,
      }),
    ).toThrowError(
      expect.objectContaining({ message: expect.not.stringContaining(credential) }),
    );
  });

  it("does not mutate its input", () => {
    const environment = { ...validEnvironment };
    const snapshot = { ...environment };

    parseSupabasePublicEnvironment(environment);

    expect(environment).toEqual(snapshot);
  });

  it("keeps runtime validation lazy until a client is requested", async () => {
    await expect(import("@/lib/supabase/browser")).resolves.toHaveProperty(
      "createBrowserSupabaseClient",
    );
  });
});
