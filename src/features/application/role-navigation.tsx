"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { NavigationItem } from "./navigation";

export type LocalizedNavigationItem = NavigationItem & Readonly<{ label: string }>;

type RoleNavigationProps = Readonly<{
  ariaLabel: string;
  items: readonly LocalizedNavigationItem[];
  onNavigate?: (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: NavigationItem["href"],
  ) => void;
}>;

export function RoleNavigation({ ariaLabel, items, onNavigate }: RoleNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel} className="app-navigation">
      <ul>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.key}>
              <Link
                aria-current={active ? "page" : undefined}
                className="app-navigation__link"
                href={item.href}
                onClick={(event) => onNavigate?.(event, item.href)}
              >
                <span aria-hidden="true" className="app-navigation__marker">
                  {item.marker}
                </span>
                <span>{item.label}</span>
                {active ? <span className="app-navigation__active">{"•"}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
