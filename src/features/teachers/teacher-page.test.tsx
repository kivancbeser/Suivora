import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./actions", () => ({ createTestTeacherAction: vi.fn(), inviteTeacherAction: vi.fn(), updateTeacherAction: vi.fn() }));
import { TeacherPage, type TeacherPageMessages } from "./teacher-page";

const errors = new Proxy({}, { get: (_target, property) => String(property) }) as Record<import("./teacher-management").TeacherResultCode, string>;
const messages: TeacherPageMessages = {
  eyebrow: "Administration", title: "Enseignants", description: "Gérez l’équipe.", invitationTitle: "Inviter un enseignant",
  listTitle: "Équipe enseignante", emptyTitle: "Aucun enseignant", emptyDescription: "Invitez le premier enseignant.",
  readErrorTitle: "Enseignants indisponibles", readErrorDescription: "Réessayez.", active: "Accès actif", inactive: "Accès inactif",
  form: { displayName: "Nom affiché", email: "Adresse e-mail", invite: "Créer le compte", inviting: "Création…", password: "Mot de passe temporaire", passwordConfirmation: "Confirmer le mot de passe", testWarning: "Test uniquement.", save: "Enregistrer", saving: "Enregistrement…", edit: "Modifier", cancel: "Annuler", deactivate: "Désactiver l’accès", reactivate: "Réactiver l’accès", deactivationWarning: "L’accès deviendra indisponible.", confirmDeactivation: "Je confirme", errors },
};

afterEach(cleanup);
describe("teacher page", () => {
  it("renders a French empty state and accessible invitation controls", () => {
    render(<TeacherPage messages={messages} readError={false} teachers={[]} />);
    expect(screen.getByRole("heading", { level: 1, name: "Enseignants" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aucun enseignant" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nom affiché" })).toHaveAttribute("maxlength", "120");
    expect(screen.getByRole("textbox", { name: "Adresse e-mail" })).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Mot de passe temporaire")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Confirmer le mot de passe")).toHaveAttribute("type", "password");
    expect(screen.getByText("Test uniquement.")).toBeInTheDocument();
  });
  it("shows names and textual states without visible identifiers or email", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const { container } = render(<TeacherPage messages={messages} readError={false} teachers={[{ id, displayName: "Marie Curie", active: true }, { id: "22222222-2222-4222-8222-222222222222", displayName: "Louis Pasteur", active: false }]} />);
    expect(screen.getByText("Marie Curie")).toBeInTheDocument(); expect(screen.getByText("Accès actif")).toBeInTheDocument(); expect(screen.getByText("Accès inactif")).toBeInTheDocument();
    expect(container).not.toHaveTextContent(id); expect(container).not.toHaveTextContent("@"); expect(screen.queryByText(/supprimer/i)).not.toBeInTheDocument();
  });
  it("requires an explicit checkbox in the deactivation disclosure", async () => {
    const user = userEvent.setup();
    render(<TeacherPage messages={messages} readError={false} teachers={[{ id: "11111111-1111-4111-8111-111111111111", displayName: "Marie Curie", active: true }]} />);
    await user.click(screen.getByText("Désactiver l’accès", { selector: "summary" }));
    expect(screen.getByRole("checkbox", { name: "Je confirme" })).toBeRequired();
    expect(screen.getByText("L’accès deviendra indisponible.")).toBeInTheDocument();
  });
  it("announces safe list errors", () => {
    render(<TeacherPage messages={messages} readError teachers={[]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Enseignants indisponibles");
  });
});
