import { describe, expect, it } from "vitest";
import { parseDetailedScores, parseElement, parseLink } from "./contracts";

const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";

describe("detailed-assessment form contracts", () => {
  it("accepts a valid ordered element and rejects hidden-field injection", () => {
    const form = new FormData();
    form.set("elementId", ""); form.set("position", "2"); form.set("title", "Compréhension"); form.set("maxPoints", "25.5");
    expect(parseElement(form)).toMatchObject({ ok: true, data: { position: 2, maxPoints: 25.5 } });
    form.set("schoolId", firstId);
    expect(parseElement(form)).toEqual({ ok: false });
  });

  it("validates outcome-link identifiers, range and precision", () => {
    const form = new FormData();
    form.set("elementId", firstId); form.set("classCourseOutcomeId", secondId); form.set("weight", "37.5"); form.set("active", "true");
    expect(parseLink(form)).toMatchObject({ ok: true, data: { weight: 37.5, active: true } });
    form.set("weight", "100.001");
    expect(parseLink(form)).toEqual({ ok: false });
  });

  it("preserves zero, omits a missing element score and accepts an explicitly missing total", () => {
    const form = new FormData();
    form.set("element-0", "0"); form.set("element-1", ""); form.set("finalScore", "");
    expect(parseDetailedScores(form, [{ id: firstId, maxPoints: 40 }, { id: secondId, maxPoints: 60 }])).toEqual({
      ok: true,
      values: [{ id: firstId, score: 0 }],
      finalScore: null,
    });
  });

  it("rejects excessive element scores, excess precision and extra fields", () => {
    const elements = [{ id: firstId, maxPoints: 40 }];
    for (const value of ["40.001", "41", "-1"]) {
      const form = new FormData(); form.set("element-0", value); form.set("finalScore", "");
      expect(parseDetailedScores(form, elements)).toEqual({ ok: false });
    }
    const injected = new FormData(); injected.set("element-0", "20"); injected.set("finalScore", "20"); injected.set("role", "ADMIN");
    expect(parseDetailedScores(injected, elements)).toEqual({ ok: false });
  });
});
