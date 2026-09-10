import { describe, expect, it } from "vitest";
import { getLocaleEntryPath } from "@/i18n/routing";

describe("localized public entry", () => {
  it("routes French and Turkish home URLs to their login screens", () => {
    expect(getLocaleEntryPath("fr")).toBe("/fr/connexion");
    expect(getLocaleEntryPath("tr")).toBe("/tr/connexion");
  });
});
