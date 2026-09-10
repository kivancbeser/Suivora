import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HomeworkClassesPage,
  HomeworkDetailPage,
  type HomeworkMessages,
} from "./pages";

vi.mock("./actions", () => ({
  createHomeworkAction: vi.fn(),
  updateHomeworkAction: vi.fn(),
  saveHomeworkStatusesAction: vi.fn(),
}));

const results = {
  accessDenied: "Denied",
  invalidFields: "Invalid",
  invalidTitle: "Title",
  invalidDate: "Date",
  invalidState: "State",
  unavailable: "Unavailable",
  unexpected: "Unexpected",
  created: "Created",
  updated: "Updated",
  statusesSaved: "Saved",
} as const;
const messages: HomeworkMessages = {
  eyebrow: "Homework",
  title: "Tracking",
  description: "Shared",
  emptyClasses: "No authorized classes",
  open: "Open",
  back: "Back",
  add: "Add",
  edit: "Edit",
  empty: "No homework",
  roster: "Roster",
  noStudents: "No eligible students",
  progress: "Progress",
  alertTitle: "Attention",
  alertText: (name, streak) => `${name}: ${streak}`,
  unavailable: "Unavailable",
  term: "Term",
  semester1: "Semester 1",
  semester2: "Semester 2",
  titleLabel: "Title",
  descriptionLabel: "Description",
  assignedDate: "Assigned",
  dueDate: "Due",
  active: "Status",
  save: "Save",
  saving: "Saving",
  cancel: "Cancel",
  notRecorded: "Not recorded",
  submittedDate: "Submitted",
  states: {
    SUBMITTED_ON_TIME: "On time",
    SUBMITTED_LATE: "Late",
    NOT_SUBMITTED: "Not submitted",
  },
  results,
};
const classroom = {
  id: "11111111-1111-4111-8111-111111111111",
  className: "Class A",
  courseName: "French",
  courseCode: "FRA",
  schoolYear: "2040–2041",
} as const;
const term = {
  id: "22222222-2222-4222-8222-222222222222",
  semesterNumber: 1 as const,
  startDate: "2040-09-01",
  endDate: "2041-01-31",
};

afterEach(cleanup);

describe("homework presentation", () => {
  it("keeps class links localized without printing identifiers", () => {
    const { container } = render(
      <HomeworkClassesPage classes={[classroom]} locale="tr" m={messages} />,
    );
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      `/tr/app/devoirs/${classroom.id}`,
    );
    expect(container).not.toHaveTextContent(classroom.id);
  });

  it("shows honest empty states without rendering a roster form", () => {
    render(
      <HomeworkDetailPage
        locale="fr"
        m={messages}
        value={{
          ...classroom,
          terms: [term],
          items: [],
          selected: null,
          students: [],
          alerts: [],
        }}
      />,
    );
    expect(screen.getByText("No homework")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders localized status controls and an accessible attention alert", () => {
    const item = {
      id: "33333333-3333-4333-8333-333333333333",
      termId: term.id,
      title: "Reading",
      description: null,
      assignedOn: "2040-09-01",
      dueOn: "2040-09-02",
      isActive: true,
      recorded: 1,
      eligible: 2,
    };
    render(
      <HomeworkDetailPage
        locale="tr"
        m={messages}
        value={{
          ...classroom,
          terms: [term],
          items: [item],
          selected: item,
          students: [
            { id: "s1", name: "Learner One", state: null, submittedOn: null },
            {
              id: "s2",
              name: "Learner Two",
              state: "NOT_SUBMITTED",
              submittedOn: null,
            },
          ],
          alerts: [{ studentName: "Learner Two", streak: 3 }],
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Learner Two: 3");
    expect(
      screen.getByRole("combobox", { name: "Learner One — Status" }),
    ).toHaveValue("");
    expect(
      screen.getByRole("combobox", { name: "Learner Two — Status" }),
    ).toHaveValue("NOT_SUBMITTED");
    expect(
      screen.getAllByRole("button", { name: "Save" }).at(-1),
    ).toBeEnabled();
  });
});
