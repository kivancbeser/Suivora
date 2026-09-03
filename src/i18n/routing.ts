import { defineRouting } from "next-intl/routing";

export const locales = ["fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.some((locale) => locale === value);
}

export function getRootRedirectPath(): `/${Locale}` {
  return `/${defaultLocale}`;
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: false,
  localeCookie: false,
});
