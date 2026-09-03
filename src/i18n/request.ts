import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { isLocale } from "./routing";

export default getRequestConfig(async ({ locale: localeOverride }) => {
  const localeCandidate = localeOverride ?? (await rootParams.locale());

  if (!isLocale(localeCandidate)) {
    notFound();
  }

  return {
    locale: localeCandidate,
    messages: (await import(`./messages/${localeCandidate}.json`)).default,
  };
});
