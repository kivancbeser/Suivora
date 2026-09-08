import { describe, expect, it, vi } from "vitest";
import {
  authenticateWithPassword,
  endLocalSession,
  getAuthRedirect,
  getSafeReturnPath,
  signInSchema,
} from "./authentication";

function form(values: Partial<Record<"email" | "password" | "locale" | "returnTo", string>>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("signInSchema", () => {
  it("validates and safely normalizes credentials", () => {
    const result = signInSchema.parse({
      email: "  PROFESSEUR@EXAMPLE.TEST ",
      password: "mot-de-passe",
      locale: "fr",
    });

    expect(result.email).toBe("professeur@example.test");
  });

  it("rejects an invalid email and missing password", () => {
    const result = signInSchema.safeParse({ email: "invalide", password: "", locale: "fr" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining(["emailInvalid", "passwordRequired"]),
      );
    }
  });

  it("rejects unsupported locales", () => {
    expect(
      signInSchema.safeParse({ email: "user@example.test", password: "secret", locale: "en" })
        .success,
    ).toBe(false);
  });
});

describe("authentication route boundary", () => {
  it("redirects a signed-out visitor away from protected content", () => {
    expect(getAuthRedirect("protected", false, "fr")).toBe("/fr/connexion");
  });

  it("allows an authenticated visitor to render protected content", () => {
    expect(getAuthRedirect("protected", true, "fr")).toBeNull();
  });

  it("redirects an authenticated visitor away from sign-in", () => {
    expect(getAuthRedirect("signIn", true, "fr")).toBe("/fr/app");
  });
});

describe("endLocalSession", () => {
  it("signs out only the current session", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    await endLocalSession({ signOut });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("does not expose a provider failure", async () => {
    await expect(
      endLocalSession({ signOut: vi.fn().mockRejectedValue(new Error("private details")) }),
    ).resolves.toBeUndefined();
  });
});

describe("getSafeReturnPath", () => {
  it.each(["/fr/app", "/fr/app/classe", "/fr/app?vue=jour"])(
    "accepts internal application path %s",
    (path) => expect(getSafeReturnPath(path, "fr")).toBe(path),
  );

  it.each([
    "https://example.test/fr/app",
    "//example.test/fr/app",
    "/en/app",
    "/fr",
    "/fr/application",
    "/fr/app\\evil",
  ])("rejects unsafe return path %s", (path) => {
    expect(getSafeReturnPath(path, "fr")).toBe("/fr/app");
  });
});

describe("authenticateWithPassword", () => {
  it("redirects after successful authentication", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const result = await authenticateWithPassword(
      { signInWithPassword },
      form({ email: "USER@EXAMPLE.TEST", password: "secret", locale: "fr" }),
    );

    expect(result).toEqual({ ok: true, redirectTo: "/fr/app" });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.test",
      password: "secret",
    });
  });

  it("returns one generic error for invalid credentials without exposing the provider error", async () => {
    const providerError = new Error("User not found for user@example.test");
    const result = await authenticateWithPassword(
      { signInWithPassword: vi.fn().mockResolvedValue({ error: providerError }) },
      form({ email: "user@example.test", password: "wrong", locale: "fr" }),
    );

    expect(result).toEqual({ ok: false, state: { error: "credentialsInvalid" } });
    expect(JSON.stringify(result)).not.toContain(providerError.message);
  });

  it("returns a generic unexpected error when the provider throws", async () => {
    const result = await authenticateWithPassword(
      { signInWithPassword: vi.fn().mockRejectedValue(new Error("private details")) },
      form({ email: "user@example.test", password: "secret", locale: "fr" }),
    );

    expect(result).toEqual({ ok: false, state: { error: "unexpected" } });
    expect(JSON.stringify(result)).not.toContain("private details");
  });
});
