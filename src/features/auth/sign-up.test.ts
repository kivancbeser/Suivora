import { describe, expect, it, vi } from "vitest";
import { registerTestTeacher, signUpSchema } from "./sign-up";

const userId = "11111111-1111-4111-8111-111111111111";

function form(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    displayName: "  Victoria Erol  ",
    email: "  VICTORIA@EXAMPLE.TEST ",
    password: "secret1",
    passwordConfirmation: "secret1",
    locale: "fr",
    ...overrides,
  };
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

function gateways(options: Readonly<{
  createError?: unknown;
  signInError?: unknown;
  claimError?: unknown;
}> = {}) {
  const admin = {
    createUser: vi.fn().mockResolvedValue({
      data: { user: options.createError ? null : { id: userId } },
      error: options.createError ?? null,
    }),
    deleteUser: vi.fn().mockResolvedValue({ error: null }),
  };
  const user = {
    signInWithPassword: vi.fn().mockResolvedValue({ error: options.signInError ?? null }),
    claimTeacherProfile: vi.fn().mockResolvedValue({ error: options.claimError ?? null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  return { admin, user };
}

describe("signUpSchema", () => {
  it("normalizes the display name and email", () => {
    const result = signUpSchema.parse({
      displayName: "  Victoria Erol  ", email: " VICTORIA@EXAMPLE.TEST ",
      password: "secret1", passwordConfirmation: "secret1", locale: "tr",
    });
    expect(result.displayName).toBe("Victoria Erol");
    expect(result.email).toBe("victoria@example.test");
  });

  it("rejects short and mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      displayName: "Victoria", email: "v@example.test",
      password: "123", passwordConfirmation: "456", locale: "fr",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining(["passwordTooShort", "passwordMismatch"]),
      );
    }
  });
});

describe("registerTestTeacher", () => {
  it("creates a marked confirmed Auth user, signs in, and claims its profile", async () => {
    const gateway = gateways();
    await expect(registerTestTeacher(gateway, form())).resolves.toEqual({ ok: true, redirectTo: "/fr/app" });
    expect(gateway.admin.createUser).toHaveBeenCalledWith({
      email: "victoria@example.test", password: "secret1", email_confirm: true,
      user_metadata: { suivora_test_signup: true },
    });
    expect(gateway.user.claimTeacherProfile).toHaveBeenCalledWith("Victoria Erol");
    expect(gateway.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("reports an existing account without deleting it", async () => {
    const gateway = gateways({ createError: { code: "email_exists" } });
    await expect(registerTestTeacher(gateway, form())).resolves.toEqual({
      ok: false, state: { error: "accountAlreadyExists" },
    });
    expect(gateway.user.signInWithPassword).not.toHaveBeenCalled();
    expect(gateway.admin.deleteUser).not.toHaveBeenCalled();
  });

  it.each(["signInError", "claimError"] as const)(
    "compensates the exact new Auth user after %s",
    async (failure) => {
      const gateway = gateways({ [failure]: new Error("private provider detail") });
      await expect(registerTestTeacher(gateway, form())).resolves.toEqual({
        ok: false, state: { error: "signupUnavailable" },
      });
      expect(gateway.user.signOut).toHaveBeenCalled();
      expect(gateway.admin.deleteUser).toHaveBeenCalledWith(userId);
    },
  );

  it("does not contact Auth when validation fails", async () => {
    const gateway = gateways();
    const result = await registerTestTeacher(gateway, form({ email: "invalid", passwordConfirmation: "different" }));
    expect(result).toMatchObject({ ok: false, state: { fieldErrors: { email: "emailInvalid", passwordConfirmation: "passwordMismatch" } } });
    expect(gateway.admin.createUser).not.toHaveBeenCalled();
  });
});
