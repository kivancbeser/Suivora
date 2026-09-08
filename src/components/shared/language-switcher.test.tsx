import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLocalePath, LanguageSwitcher } from "./language-switcher";

const usePathname = vi.fn(() => "/fr");
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

afterEach(cleanup);

describe("global language switcher", () => {
  it("marks the current locale and exposes an accessible keyboard link", () => {
    usePathname.mockReturnValue("/fr/connexion");
    render(<LanguageSwitcher ariaLabel="Choisir la langue" locale="fr" />);
    expect(screen.getByRole("navigation", { name: "Choisir la langue" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "FR" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "TR" })).toHaveAttribute("href", "/tr/connexion");
  });

  it("preserves nested paths while discarding every query parameter", () => {
    expect(getLocalePath("/fr/app/enseignants", "tr")).toBe("/tr/app/enseignants");
    expect(getLocalePath("/tr/app/enseignants", "fr")).toBe("/fr/app/enseignants");
    expect(getLocalePath("/fr/activation?token_hash=secret&next=//evil.test", "tr")).toBe("/tr/activation");
    expect(getLocalePath("https://evil.test/fr/app", "tr")).toBe("/tr");
  });
});
