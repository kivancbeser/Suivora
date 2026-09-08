import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/routing";

export default async function LocalizedCatchAllPage({ params }: Readonly<{
  params: Promise<{ locale: string; rest: string[] }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  notFound();
}
