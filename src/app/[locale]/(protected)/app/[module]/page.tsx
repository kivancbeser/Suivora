import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  canRoleAccessModule,
  getNavigationKeyForSlug,
} from "@/features/application/navigation";
import { isLocale } from "@/i18n/routing";
import { resolveApplicationContext } from "@/server/application-context";

type ModulePageProps = Readonly<{
  params: Promise<{ locale: string; module: string }>;
}>;

export default async function ModulePage({ params }: ModulePageProps) {
  const { locale, module: moduleSlug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const navigationKey = getNavigationKeyForSlug(moduleSlug);
  if (!navigationKey) {
    notFound();
  }

  const access = await resolveApplicationContext();
  if (access.status === "unauthenticated") {
    redirect(`/${locale}/connexion`);
  }

  if (
    access.status !== "ready" ||
    !canRoleAccessModule(access.context.role, moduleSlug)
  ) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Application" });

  return (
    <section aria-labelledby="module-title" className="app-content-card">
      <p className="app-content-card__eyebrow">{t("moduleUnavailable.eyebrow")}</p>
      <h1 id="module-title">{t(`navigation.${navigationKey}`)}</h1>
      <p>{t("moduleUnavailable.description")}</p>
    </section>
  );
}
