import { describe, expect, it } from "vitest";
import { getRootRedirectPath } from "@/i18n/routing";

describe("root route", () => {
  it("uses the application locale contract for its canonical redirect", () => {
    expect(getRootRedirectPath()).toBe("/fr/connexion");
  });
});
