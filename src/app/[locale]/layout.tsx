import { NextIntlClientProvider } from "next-intl";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { isLocale, locales } from "@/i18n/routing";
import "../globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return (
      <html lang="fr">
        <body>{children}</body>
      </html>
    );
  }

  const t = await getTranslations({ locale, namespace: "Common" });
  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LanguageSwitcher ariaLabel={t("languageSwitcher")} locale={locale} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
