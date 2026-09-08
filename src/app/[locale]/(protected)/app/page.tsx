import { getTranslations } from "next-intl/server";

export default async function AuthenticatedAppPage() {
  const t = await getTranslations("Application.home");

  return (
    <section aria-labelledby="application-home-title" className="app-content-card">
      <p className="app-content-card__eyebrow">{t("eyebrow")}</p>
      <h1 id="application-home-title">{t("title")}</h1>
      <p>{t("description")}</p>
    </section>
  );
}
