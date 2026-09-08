import { describe, expect, it } from "vitest";
import fr from "./messages/fr.json";
import tr from "./messages/tr.json";

function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) =>
      Object.entries(flatten(child, prefix ? `${prefix}.${key}` : key)),
    ),
  );
}

function placeholders(value: string): readonly string[] {
  return [...value.matchAll(/\{([\w]+)(?:[,}])/gu)].map((match) => match[1]).sort();
}

describe("localized message catalogs", () => {
  const french = flatten(fr);
  const turkish = flatten(tr);

  it("has identical, non-empty French and Turkish key structures", () => {
    expect(Object.keys(turkish).sort()).toEqual(Object.keys(french).sort());
    expect(Object.values(turkish).every((value) => value.trim().length > 0)).toBe(true);
  });

  it("keeps ICU placeholder names identical", () => {
    for (const key of Object.keys(french)) {
      expect(placeholders(turkish[key])).toEqual(placeholders(french[key]));
    }
  });

  it("contains the required Turkish navigation and semester terminology", () => {
    expect(Object.values(tr.Application.navigation)).toEqual([
      "Ana Sayfa", "Eğitim Yılları", "Öğretmenler", "Sınıflar", "Öğrenciler", "Dersler", "Ayarlar",
      "Bugün", "Sınıflarım", "Quizler ve Notlar", "Ödevler", "İlerleme", "Öğrenci Takibi", "Raporlar",
    ]);
    expect(tr.Calendar.semesters).toEqual({ "1": "1. Dönem", "2": "2. Dönem" });
  });
});
