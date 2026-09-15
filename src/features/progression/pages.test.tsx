import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  assignOutcomeAction: vi.fn(),
  createOutcomeAction: vi.fn(),
  publishOutcomeRevisionAction: vi.fn(),
  setOutcomeActiveAction: vi.fn(),
}));

import { ProgressionIndex } from "./pages";

afterEach(cleanup);

const messages = new Proxy<Record<string, string>>({}, { get: (_target, property) => String(property) });
const classes = [{ id: "class-course", courseId: "course", className: "Classe A", courseName: "Français", courseCode: "FRA", schoolYear: "2026–2027" }];
const courses = [{ id: "course", name: "Français" }];
const baseOutcome = {
  id: "outcome",
  courseId: "course",
  courseName: "Français",
  code: "SYN-FRA-COMP-01",
  title: "Compréhension synthétique",
  revision: 1,
  revisionId: "revision",
  active: true,
  revisions: [{ id: "revision", number: 1, title: "Compréhension synthétique", linkedClasses: [] as readonly string[], usedAsEvidence: false }],
};

describe("ProgressionIndex", () => {
  it("renders the valid post-creation state without a link or evidence", () => {
    render(<ProgressionIndex locale="fr" role="ADMIN" classes={classes} courses={courses} outcomes={[baseOutcome]} m={messages} created />);
    expect(screen.getByRole("status")).toHaveTextContent("creationConfirmed");
    expect(screen.getByRole("heading", { name: /SYN-FRA-COMP-01/ })).toBeVisible();
    expect(screen.getByText(/notLinked/)).toBeVisible();
    expect(screen.getByText(/noEvidenceYet/)).toBeVisible();
  });

  it("renders linked and evidence-backed revision state", () => {
    const linked = { ...baseOutcome, revisions: [{ ...baseOutcome.revisions[0], linkedClasses: ["Classe A — Français"], usedAsEvidence: true }] };
    render(<ProgressionIndex locale="tr" role="ADMIN" classes={classes} courses={courses} outcomes={[linked]} m={messages} />);
    expect(screen.getByText(/linkedClasses: Classe A — Français/)).toBeVisible();
    expect(screen.getByText(/evidenceUsed/)).toBeVisible();
  });

  it("keeps teacher rendering free of ADMIN mutation controls", () => {
    render(<ProgressionIndex locale="fr" role="TEACHER" classes={classes} courses={courses} outcomes={[]} m={messages} />);
    expect(screen.queryByText("addOutcome")).not.toBeInTheDocument();
    expect(screen.queryByText("catalog")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "open" })).toHaveAttribute("href", "/fr/app/progression/class-course");
  });
});
