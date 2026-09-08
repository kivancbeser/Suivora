import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignInForm } from "./sign-in-form";

vi.mock("./actions", () => ({ signInAction: vi.fn() }));

const messages = {
  emailLabel: "Adresse e-mail",
  passwordLabel: "Mot de passe",
  submit: "Se connecter",
  submitting: "Connexion en cours…",
  errors: {
    credentialsInvalid: "Connexion impossible.",
    unexpected: "Réessayez plus tard.",
    emailRequired: "Saisissez votre adresse e-mail.",
    emailInvalid: "Saisissez une adresse e-mail valide.",
    passwordRequired: "Saisissez votre mot de passe.",
  },
} as const;

describe("SignInForm", () => {
  it("renders localized, accessible credential fields", () => {
    render(<SignInForm locale="fr" messages={messages} returnTo="/fr/app" />);

    expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeEnabled();
  });
});
