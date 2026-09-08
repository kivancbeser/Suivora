import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isLocale } from "@/i18n/routing";
import type { Metadata } from "next";

type InvalidInvitationPageProps = Readonly<{ params: Promise<{ locale: string }> }>;

export async function generateMetadata({ params }: InvalidInvitationPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Activation" });
  return { title: t("invalid.title"), description: t("invalid.description") };
}

export default async function InvalidInvitationPage({ params }: InvalidInvitationPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Activation" });
  return <main className="auth-shell"><section aria-labelledby="invitation-error-title" className="auth-card"><p className="auth-card__brand">{t("brand")}</p><h1 id="invitation-error-title">{t("invalid.title")}</h1><p className="auth-card__intro">{t("invalid.description")}</p></section></main>;
}
