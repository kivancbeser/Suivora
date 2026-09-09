import { getTranslations } from "next-intl/server";
export default async function Loading(){const t=await getTranslations("Common");return <p aria-live="polite" className="structure-loading" role="status">{t("loading")}</p>}
