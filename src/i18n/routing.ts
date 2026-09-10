import { defineRouting } from "next-intl/routing";

export const locales = ["fr", "tr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.some((locale) => locale === value);
}

export function getLocaleEntryPath(locale: Locale): `/${Locale}/connexion` {
  return `/${locale}/connexion`;
}

export function getRootRedirectPath(): `/${Locale}/connexion` {
  return getLocaleEntryPath(defaultLocale);
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: false,
  localeCookie: false,
});
