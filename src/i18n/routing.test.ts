import { describe, expect, expectTypeOf, it } from "vitest";
import {
  defaultLocale,
  getLocaleEntryPath,
  getRootRedirectPath,
  isLocale,
  locales,
  type Locale,
} from "./routing";

describe("locale contract", () => {
  it("accepts French and Turkish and rejects unsupported locale values", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("tr")).toBe(true);
    expect(isLocale("en")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("defines French as the default in the immutable locale contract", () => {
    expect(defaultLocale).toBe("fr");
    expect(locales).toEqual(["fr", "tr"]);
    expectTypeOf(locales).toEqualTypeOf<readonly ["fr", "tr"]>();
    expectTypeOf<Locale>().toEqualTypeOf<"fr" | "tr">();
  });

  it("uses each locale's sign-in screen as its public entry point", () => {
    expect(getRootRedirectPath()).toBe("/fr/connexion");
    expect(getLocaleEntryPath("fr")).toBe("/fr/connexion");
    expect(getLocaleEntryPath("tr")).toBe("/tr/connexion");
  });
});
