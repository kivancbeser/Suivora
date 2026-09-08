import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessUnavailable } from "./access-unavailable";
import { ApplicationShell } from "./application-shell";
import { RoleNavigation } from "./role-navigation";

const usePathname = vi.fn(() => "/app");

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => usePathname(),
  Link: ({ children, href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/features/auth/sign-out-button", () => ({
  SignOutButton: ({ label, className }: { label: string; className?: string }) => (
    <button className={className}>{label}</button>
  ),
}));

const navigation = [
  { key: "home", href: "/app", marker: "A", label: "Accueil" },
  { key: "teachers", href: "/app/enseignants", marker: "EN", label: "Enseignants" },
] as const;

const messages = {
  brand: "Suivora",
  navigationLabel: "Navigation principale",
  mobileMenuLabel: "Ouvrir la navigation",
  schoolLabel: "Établissement",
  roleLabel: "Rôle",
  role: "Administrateur",
  signOut: "Se déconnecter",
  signingOut: "Déconnexion en cours…",
} as const;

describe("application interface", () => {
  beforeEach(() => usePathname.mockReturnValue("/app"));
  afterEach(cleanup);

  it("marks the active navigation item semantically", () => {
    render(<RoleNavigation ariaLabel="Navigation principale" items={navigation} />);
    expect(screen.getByRole("link", { name: /Accueil/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Enseignants/ })).not.toHaveAttribute("aria-current");
  });

  it("renders a localized shell without an email address or identifiers", () => {
    const { container } = render(
      <ApplicationShell
        context={{
          userId: "00000000-0000-4000-8000-000000000001",
          role: "ADMIN",
          school: { id: "00000000-0000-4000-8000-000000000002", name: "École Démonstration" },
        }}
        messages={messages}
        navigationItems={navigation}
        locale="fr"
      >
        <p>Contenu</p>
      </ApplicationShell>,
    );

    expect(screen.getAllByText("École Démonstration").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Administrateur/).length).toBeGreaterThan(0);
    expect(screen.getByRole("main")).toHaveTextContent("Contenu");
    expect(screen.getByText("Ouvrir la navigation")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("@");
    expect(container).not.toHaveTextContent("00000000-");
  });

  it("keeps sign-out available in the safe access-unavailable state", () => {
    render(
      <AccessUnavailable
        locale="fr"
        messages={{
          brand: "Suivora",
          title: "Accès indisponible",
          description: "Votre accès ne peut pas être confirmé.",
          signOut: "Se déconnecter",
          signingOut: "Déconnexion en cours…",
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Accès indisponible" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeInTheDocument();
  });
});
