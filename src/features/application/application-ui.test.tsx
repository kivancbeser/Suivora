import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessUnavailable } from "./access-unavailable";
import { ApplicationShell } from "./application-shell";
import { RoleNavigation } from "./role-navigation";

const usePathname = vi.fn(() => "/app");
const useBrowserPathname = vi.fn(() => "/fr/app");
const push = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => usePathname(),
  Link: ({ children, href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => useBrowserPathname(),
  useRouter: () => ({ push }),
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
  mobileMenuCloseLabel: "Fermer la navigation",
  schoolLabel: "Établissement",
  roleLabel: "Rôle",
  role: "Administrateur",
  signOut: "Se déconnecter",
  signingOut: "Déconnexion en cours…",
} as const;

describe("application interface", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/app");
    useBrowserPathname.mockReturnValue("/fr/app");
    push.mockReset();
    document.body.style.overflow = "";
  });
  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

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

  it("opens one accessible mobile navigation and closes it on link selection", async () => {
    render(
      <ApplicationShell
        context={{ userId: "u", role: "ADMIN", school: { id: "s", name: "School" } }}
        messages={messages}
        navigationItems={navigation}
        locale="fr"
      >
        <p>Content</p>
      </ApplicationShell>,
    );
    const trigger = screen.getByRole("button", { name: "Ouvrir la navigation" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getAllByRole("navigation", { name: "Navigation principale" })).toHaveLength(1);

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Navigation principale" })).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Navigation principale" })).toHaveLength(2);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.querySelector(".app-main")).toHaveProperty("inert", true);

    fireEvent.click(screen.getAllByRole("link", { name: /Enseignants/ }).at(-1)!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).toBe("");
    expect(push).toHaveBeenCalledWith("/fr/app/enseignants");
    expect(document.querySelector(".app-main")).toHaveProperty("inert", false);
  });

  it("closes on pathname and locale changes without stale state", async () => {
    const view = render(
      <ApplicationShell
        context={{ userId: "u", role: "TEACHER", school: { id: "s", name: "School" } }}
        messages={messages}
        navigationItems={navigation}
        locale="fr"
      >
        <p>Content</p>
      </ApplicationShell>,
    );
    const open = () => fireEvent.click(screen.getByRole("button", { name: "Ouvrir la navigation" }));
    open();
    useBrowserPathname.mockReturnValue("/fr/app/enseignants");
    view.rerender(
      <ApplicationShell context={{ userId: "u", role: "TEACHER", school: { id: "s", name: "School" } }} messages={messages} navigationItems={navigation} locale="fr"><p>Content</p></ApplicationShell>,
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    open();
    useBrowserPathname.mockReturnValue("/tr/app/enseignants");
    view.rerender(
      <ApplicationShell context={{ userId: "u", role: "TEACHER", school: { id: "s", name: "School" } }} messages={messages} navigationItems={navigation} locale="tr"><p>Content</p></ApplicationShell>,
    );
    useBrowserPathname.mockReturnValue("/tr/app");
    view.rerender(
      <ApplicationShell context={{ userId: "u", role: "TEACHER", school: { id: "s", name: "School" } }} messages={messages} navigationItems={navigation} locale="tr"><p>Content</p></ApplicationShell>,
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe("");
  });

  it("dismisses with Escape or backdrop and returns focus to the trigger", async () => {
    render(
      <ApplicationShell context={{ userId: "u", role: "ADMIN", school: { id: "s", name: "School" } }} messages={messages} navigationItems={navigation} locale="fr"><p>Content</p></ApplicationShell>,
    );
    const trigger = screen.getByRole("button", { name: "Ouvrir la navigation" });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.click(
      screen
        .getAllByRole("button", { name: "Fermer la navigation" })
        .at(-1)!,
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.body.style.overflow).toBe("");
  });

  it("restores an existing body overflow value on unmount", () => {
    document.body.style.overflow = "clip";
    const view = render(
      <ApplicationShell context={{ userId: "u", role: "ADMIN", school: { id: "s", name: "School" } }} messages={messages} navigationItems={navigation} locale="fr"><p>Content</p></ApplicationShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la navigation" }));
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(document.body.style.overflow).toBe("clip");
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
