import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  createSchoolYearAction: vi.fn(), createSemesterAction: vi.fn(), updateSchoolYearAction: vi.fn(), updateSemesterAction: vi.fn(),
}));

import { CalendarPage, formatCalendarDate, type CalendarPageMessages } from "./calendar-page";

const messages: CalendarPageMessages = {
  eyebrow: "Administration", title: "Années scolaires", description: "Définissez le calendrier.", addYear: "Ajouter une année scolaire",
  emptyTitle: "Aucune année scolaire", emptyDescription: "Créez la première année scolaire.", editYear: "Modifier l’année scolaire",
  completion: "Semestres configurés", addSemester: "Ajouter", editSemester: "Modifier les dates",
  readErrorTitle: "Calendrier indisponible", readErrorDescription: "Réessayez plus tard.",
  semesters: { "1": "Semestre 1", "2": "Semestre 2" },
  form: {
    label: "Nom de l’année scolaire", startDate: "Date de début", endDate: "Date de fin", save: "Enregistrer", saving: "Enregistrement en cours…", cancel: "Annuler",
    errors: {
      accessDenied: "Non autorisé", dateInvalid: "Date invalide", dateOrder: "Ordre invalide", duplicateSemester: "Semestre existant",
      duplicateYear: "Année existante", labelRequired: "Nom requis", labelTooLong: "Nom trop long", notFound: "Introuvable",
      outsideYear: "Hors année", semesterChronology: "Chevauchement", semesterInvalid: "Semestre invalide", unexpected: "Erreur générique",
      unexpectedFields: "Données inattendues", yearContainsTerms: "Semestre exclu",
    },
    success: { yearCreated: "Année créée", yearUpdated: "Année modifiée", semesterCreated: "Semestre créé", semesterUpdated: "Semestre modifié" },
  },
};

afterEach(cleanup);

describe("calendar admin page", () => {
  it("formats stored ISO dates for the active locale without changing the value", () => {
    expect(formatCalendarDate("2026-09-01", "fr")).toBe("1 septembre 2026");
    expect(formatCalendarDate("2026-09-01", "tr")).toBe("1 Eylül 2026");
  });
  it("renders the localized empty state without creating data", () => {
    render(<CalendarPage locale="fr" messages={messages} years={[]} />);
    expect(screen.getByRole("heading", { level: 1, name: "Années scolaires" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aucune année scolaire" })).toBeInTheDocument();
    expect(screen.getByText("Ajouter une année scolaire")).toBeInTheDocument();
  });

  it("renders newest-first input, fixed semester labels and completion without identifiers", () => {
    const { container } = render(<CalendarPage locale="fr" messages={messages} years={[
      { id: "00000000-0000-4000-8000-000000000002", label: "2027–2028", startDate: "2027-09-01", endDate: "2028-06-30", semesters: [
        { id: "00000000-0000-4000-8000-000000000012", semesterNumber: 1, startDate: "2027-09-01", endDate: "2028-01-31" },
        { id: "00000000-0000-4000-8000-000000000013", semesterNumber: 2, startDate: "2028-01-31", endDate: "2028-06-30" },
      ] },
      { id: "00000000-0000-4000-8000-000000000001", label: "2026–2027", startDate: "2026-09-01", endDate: "2027-06-30", semesters: [] },
    ]} />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["2027–2028", "2026–2027"]);
    expect(screen.getByText("Semestres configurés: 2/2")).toBeInTheDocument();
    expect(screen.getByText("Semestres configurés: 0/2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Semestre 1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Semestre 2" })).toBeInTheDocument();
    expect(container).not.toHaveTextContent("00000000-");
    expect(container).not.toHaveTextContent("@");
    expect(screen.queryByText(/supprimer/i)).not.toBeInTheDocument();
  });

  it("provides associated form labels and a safe announced read failure", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CalendarPage locale="fr" messages={messages} years={[]} />);
    await user.click(screen.getByText("Ajouter une année scolaire"));
    expect(screen.getByRole("textbox", { name: "Nom de l’année scolaire" })).toBeInTheDocument();
    expect(screen.getByLabelText("Date de début")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Date de fin")).toHaveAttribute("type", "date");
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeInTheDocument();
    rerender(<CalendarPage locale="fr" messages={messages} readError years={[]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Calendrier indisponible");
  });
});
