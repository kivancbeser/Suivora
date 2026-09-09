import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MyClassDetailPage, MyClassesPage, type MyClassesMessages } from "./pages";

const m: MyClassesMessages = {
  eyebrow: "Espace enseignant",
  title: "Mes classes",
  description: "Vos affectations actives",
  empty: "Aucune classe affectée",
  open: "Ouvrir",
  classLabel: "Classe",
  course: "Matière",
  year: "Année scolaire",
  allocated: "Périodes attribuées",
  total: "Total",
  back: "Retour",
  roster: "Élèves actuels",
  noStudents: "Aucun élève actuel",
  code: "Code",
  current: "Inscription actuelle",
};

const item = {
  id: "11111111-1111-4111-8111-111111111111",
  className: "Prépa A",
  courseName: "Français",
  courseCode: "FR",
  schoolYear: "2026–2027",
  allocatedPeriods: 4,
  totalPeriods: 6,
} as const;

afterEach(cleanup);

describe("teacher My Classes presentation", () => {
  it("renders active assignments without exposing identifiers or mutation controls", () => {
    const { container } = render(<MyClassesPage classes={[item]} locale="fr" m={m} />);
    expect(screen.getByRole("heading", { name: "Prépa A" })).toBeInTheDocument();
    expect(screen.getByText("Matière: Français (FR)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ouvrir" })).toHaveAttribute("href", `/fr/app/mes-classes/${item.id}`);
    expect(container).not.toHaveTextContent(item.id);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the safe empty state", () => {
    render(<MyClassesPage classes={[]} locale="fr" m={m} />);
    expect(screen.getByText("Aucune classe affectée")).toBeInTheDocument();
  });

  it("renders a read-only current roster without exposing row identifiers", () => {
    const { container } = render(<MyClassDetailPage locale="fr" m={m} value={{ ...item, students: [{ id: "22222222-2222-4222-8222-222222222222", firstName: "Ada", lastName: "Martin", code: "E-01", startsOn: "2026-09-01", endsOn: null }] }} />);
    expect(screen.getByRole("heading", { name: "Prépa A — Français" })).toBeInTheDocument();
    expect(screen.getByText("Ada Martin")).toBeInTheDocument();
    expect(screen.getByText("Code: E-01")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("22222222-");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps the detail route localized", () => {
    render(<MyClassDetailPage locale="tr" m={{ ...m, back: "Geri" }} value={{ ...item, students: [] }} />);
    expect(screen.getByRole("link", { name: /Geri/ })).toHaveAttribute("href", "/tr/app/mes-classes");
    expect(screen.getByText("Aucun élève actuel")).toBeInTheDocument();
  });
});
