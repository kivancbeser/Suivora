"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLocale, locales, type Locale } from "@/i18n/routing";

export function getLocalePath(pathname: string, targetLocale: Locale): `/${Locale}${string}` {
  const safePathname = pathname.split(/[?#]/u, 1)[0];
  const segments = safePathname.split("/");
  if (!isLocale(segments[1])) return `/${targetLocale}`;
  segments[1] = targetLocale;
  return segments.join("/") as `/${Locale}${string}`;
}

export function LanguageSwitcher({ ariaLabel, locale }: Readonly<{ ariaLabel: string; locale: Locale }>) {
  const pathname = usePathname();
  return (
    <nav aria-label={ariaLabel} className="language-switcher">
      {locales.map((candidate, index) => (
        <span className="language-switcher__option" key={candidate}>
          {index > 0 ? <span aria-hidden="true" className="language-switcher__separator">|</span> : null}
          <Link aria-current={candidate === locale ? "true" : undefined} href={getLocalePath(pathname, candidate)} hrefLang={candidate} lang={candidate}>
            {candidate.toUpperCase()}
          </Link>
        </span>
      ))}
    </nav>
  );
}
