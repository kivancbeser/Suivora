import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccessUnavailable } from "@/features/application/access-unavailable";
import { PasswordCreationForm } from "@/features/teachers/password-form";
import { isLocale } from "@/i18n/routing";
import { resolveApplicationContext } from "@/server/application-context";
import type { Metadata } from "next";

type ActivationPageProps = Readonly<{ params: Promise<{ locale: string }> }>;

export async function generateMetadata({ params }: ActivationPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Activation" });
  return { title: t("title"), description: t("description") };
}

export default async function ActivationPage({ params }: ActivationPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const access = await resolveApplicationContext();
  if (access.status === "unauthenticated") redirect(`/${locale}/connexion`);
  if (access.status !== "ready") {
    const app = await getTranslations({ locale, namespace: "Application" });
    return <AccessUnavailable locale={locale} messages={{ brand: app("brand"), title: app("accessUnavailable.title"), description: app("accessUnavailable.description"), signOut: app("signOut"), signingOut: app("signingOut") }} />;
  }
  if (access.context.role !== "TEACHER") notFound();
  const t = await getTranslations({ locale, namespace: "Activation" });
  return <main className="auth-shell"><section aria-labelledby="activation-title" className="auth-card">
    <p className="auth-card__brand">{t("brand")}</p><h1 id="activation-title">{t("title")}</h1><p className="auth-card__intro">{t("description")}</p>
    <PasswordCreationForm locale={locale} messages={{ password: t("password"), confirmation: t("confirmation"), submit: t("submit"), submitting: t("submitting"), errors: { accessDenied: t("errors.accessDenied"), passwordTooShort: t("errors.passwordTooShort"), passwordTooLong: t("errors.passwordTooLong"), passwordMismatch: t("errors.passwordMismatch"), unexpectedFields: t("errors.unexpectedFields"), unexpected: t("errors.unexpected") } }} />
  </section></main>;
}
