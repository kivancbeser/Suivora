"use client";

import { useTranslations } from "next-intl";

export function LocalizedNotFoundView() {
  const t = useTranslations("Common");
  return (
    <main className="foundation">
      <section aria-labelledby="not-found-title" className="foundation__panel">
        <h1 id="not-found-title">{t("notFound")}</h1>
      </section>
    </main>
  );
}
