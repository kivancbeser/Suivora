import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignUpForm } from "./sign-up-form";

vi.mock("./sign-up-actions", () => ({ signUpAction: vi.fn() }));

const messages = {
  displayNameLabel: "Nom affiché", emailLabel: "Adresse e-mail",
  passwordLabel: "Mot de passe", passwordConfirmationLabel: "Confirmer le mot de passe",
  submit: "Créer mon compte", submitting: "Création en cours…",
  errors: {
    displayNameRequired: "required", displayNameTooLong: "long", emailRequired: "required",
    emailInvalid: "invalid", passwordTooShort: "short", passwordConfirmationRequired: "required",
    passwordMismatch: "mismatch", accountAlreadyExists: "exists", signupUnavailable: "unavailable",
    unexpected: "unexpected",
  },
} as const;

describe("SignUpForm", () => {
  it("renders accessible test-account fields", () => {
    render(<SignUpForm locale="fr" messages={messages} />);
    expect(screen.getByLabelText("Nom affiché")).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Confirmer le mot de passe")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Créer mon compte" })).toBeEnabled();
  });
});
