import { describe, expect, it } from "vitest";

import { buildOutcomeCatalog } from "./data";

const courseId = "11111111-1111-4111-8111-111111111111";
const outcomeId = "22222222-2222-4222-8222-222222222222";
const revisionId = "33333333-3333-4333-8333-333333333333";
const classCourseId = "44444444-4444-4444-8444-444444444444";
const linkId = "55555555-5555-4555-8555-555555555555";

const outcome = { id: outcomeId, course_id: courseId, code: "SYN-FRA-COMP-01", is_active: true };
const revision = { id: revisionId, learning_outcome_id: outcomeId, revision_number: 1, title: "Compréhension synthétique" };
const courses = new Map([[courseId, "Français"]]);
const classes = new Map([[classCourseId, "Classe A — Français"]]);

describe("buildOutcomeCatalog", () => {
  it("supports an empty catalog", () => {
    expect(buildOutcomeCatalog([], [], [], [], courses, classes)).toEqual([]);
  });

  it("keeps a newly created first revision visible before it is linked or used", () => {
    expect(buildOutcomeCatalog([outcome], [revision], [], [], courses, classes)).toEqual([
      expect.objectContaining({
        code: outcome.code,
        revision: 1,
        title: revision.title,
        revisions: [{ id: revisionId, number: 1, title: revision.title, linkedClasses: [], usedAsEvidence: false }],
      }),
    ]);
  });

  it("reports links and detailed-assessment evidence independently", () => {
    const link = { id: linkId, outcome_revision_id: revisionId, class_course_id: classCourseId, is_active: true };
    const [catalog] = buildOutcomeCatalog([outcome], [revision], [link], [{ class_course_outcome_id: linkId }], courses, classes);
    expect(catalog.revisions[0]).toMatchObject({ linkedClasses: ["Classe A — Français"], usedAsEvidence: true });
  });

  it("orders immutable revision history newest first", () => {
    const older = { ...revision, id: "66666666-6666-4666-8666-666666666666" };
    const newer = { ...revision, id: "77777777-7777-4777-8777-777777777777", revision_number: 2, title: "Version 2" };
    const [catalog] = buildOutcomeCatalog([outcome], [older, newer], [], [], courses, classes);
    expect(catalog.revisions.map((item) => item.number)).toEqual([2, 1]);
    expect(catalog).toMatchObject({ revision: 2, title: "Version 2" });
  });

  it("treats a missing required course relation as a genuine contract error", () => {
    expect(() => buildOutcomeCatalog([outcome], [revision], [], [], new Map(), classes)).toThrow("Outcome course relationship unavailable");
  });
});
