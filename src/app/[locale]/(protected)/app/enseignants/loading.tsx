import { getTranslations } from "next-intl/server";

export default async function TeachersLoading() {
  const t = await getTranslations("Teachers");
  return <p aria-live="polite" className="teacher-loading" role="status">{t("loading")}</p>;
}
