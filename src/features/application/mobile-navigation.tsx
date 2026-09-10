"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/features/auth/sign-out-button";
import type { Locale } from "@/i18n/routing";
import {
  RoleNavigation,
  type LocalizedNavigationItem,
} from "./role-navigation";

type MobileNavigationProps = Readonly<{
  items: readonly LocalizedNavigationItem[];
  locale: Locale;
  messages: Readonly<{
    navigationLabel: string;
    openLabel: string;
    closeLabel: string;
    signOut: string;
    signingOut: string;
  }>;
}>;

export function MobileNavigation({
  items,
  locale,
  messages,
}: MobileNavigationProps) {
  const pathname = usePathname();
  return (
    <MobileNavigationDrawer
      items={items}
      key={pathname}
      locale={locale}
      messages={messages}
    />
  );
}

function MobileNavigationDrawer({
  items,
  locale,
  messages,
}: MobileNavigationProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const shell = panelRef.current?.closest(".app-shell");
    const obscured = [
      shell?.querySelector<HTMLElement>(".app-sidebar"),
      shell?.querySelector<HTMLElement>(".app-main"),
      shell?.querySelector<HTMLElement>(".app-mobile-header > div:first-child"),
    ].filter((element): element is HTMLElement => element !== null && element !== undefined);
    const previousInert = obscured.map((element) => element.inert);
    document.body.style.overflow = "hidden";
    obscured.forEach((element) => {
      element.inert = true;
    });
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      obscured.forEach((element, index) => {
        element.inert = previousInert[index] ?? false;
      });
    };
  }, [open]);

  const dismiss = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="app-mobile-menu">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={open ? messages.closeLabel : messages.openLabel}
        className="app-mobile-menu__trigger"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        {open ? messages.closeLabel : messages.openLabel}
      </button>
      {open ? (
        <div className="app-mobile-menu__layer">
          <button
            aria-label={messages.closeLabel}
            className="app-mobile-menu__backdrop"
            onClick={dismiss}
            type="button"
          />
          <div
            aria-label={messages.navigationLabel}
            aria-modal="true"
            className="app-mobile-menu__panel"
            id={panelId}
            ref={panelRef}
            role="dialog"
          >
            <div onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setOpen(false);
            }}>
              <RoleNavigation
                ariaLabel={messages.navigationLabel}
                items={items}
              />
            </div>
            <SignOutButton
              className="app-sign-out"
              label={messages.signOut}
              pendingLabel={messages.signingOut}
              locale={locale}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
