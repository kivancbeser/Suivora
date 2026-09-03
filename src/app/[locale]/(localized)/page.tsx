import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FoundationView } from "@/components/shared/foundation-view";
import frMessages from "@/i18n/messages/fr.json";
import { isLocale } from "@/i18n/routing";

type LocalizedPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({
  params,
}: LocalizedPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {
      title: frMessages.Common.notFound,
    };
  }

  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocalizedHomePage({ params }: LocalizedPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslations("Foundation");

  return (
    <FoundationView
      messages={{
        productName: t("productName"),
        tagline: t("tagline"),
        status: t("status"),
        milestoneLabel: t("milestoneLabel"),
        milestoneName: t("milestoneName"),
      }}
    />
  );
}
