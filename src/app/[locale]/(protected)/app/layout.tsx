import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccessUnavailable } from "@/features/application/access-unavailable";
import { ApplicationShell } from "@/features/application/application-shell";
import { getUnauthenticatedApplicationRedirect } from "@/features/application/application-context";
import { getNavigationForRole } from "@/features/application/navigation";
import { isLocale } from "@/i18n/routing";
import { resolveApplicationContext } from "@/server/application-context";

type ProtectedLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function ProtectedLayout({ children, params }: ProtectedLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const result = await resolveApplicationContext();
  const authRedirect = getUnauthenticatedApplicationRedirect(result, locale);

  if (result.status === "unauthenticated" && authRedirect) {
    redirect(authRedirect);
  }

  const t = await getTranslations({ locale, namespace: "Application" });

  if (result.status === "access-unavailable") {
    return (
      <AccessUnavailable
        locale={locale}
        messages={{
          brand: t("brand"),
          title: t("accessUnavailable.title"),
          description: t("accessUnavailable.description"),
          signOut: t("signOut"),
          signingOut: t("signingOut"),
        }}
      />
    );
  }

  if (result.status !== "ready") {
    redirect(`/${locale}/connexion`);
  }

  const navigationItems = getNavigationForRole(result.context.role).map((item) => ({
    ...item,
    label: t(`navigation.${item.key}`),
  }));

  return (
    <ApplicationShell
      context={result.context}
      locale={locale}
      messages={{
        brand: t("brand"),
        navigationLabel: t("navigationLabel"),
        mobileMenuLabel: t("mobileMenuLabel"),
        mobileMenuCloseLabel: t("mobileMenuCloseLabel"),
        schoolLabel: t("schoolLabel"),
        roleLabel: t("roleLabel"),
        role: t(`roles.${result.context.role}`),
        signOut: t("signOut"),
        signingOut: t("signingOut"),
      }}
      navigationItems={navigationItems}
    >
      {children}
    </ApplicationShell>
  );
}
