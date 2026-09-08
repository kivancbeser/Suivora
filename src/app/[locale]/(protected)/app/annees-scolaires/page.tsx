import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarPage, type CalendarPageMessages } from "@/features/calendar/calendar-page";
import { listSchoolYearsWithSemesters } from "@/features/calendar/data";
import { isLocale } from "@/i18n/routing";

type SchoolYearsPageProps = Readonly<{ params: Promise<{ locale: string }> }>;

export default async function SchoolYearsPage({ params }: SchoolYearsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const result = await listSchoolYearsWithSemesters();
  if (result.status === "unauthenticated") redirect(`/${locale}/connexion`);
  if (result.status === "forbidden") notFound();
  if (result.status === "access-unavailable") return null;

  const t = await getTranslations({ locale, namespace: "Calendar" });
  const messages: CalendarPageMessages = {
    eyebrow: t("eyebrow"), title: t("title"), description: t("description"), addYear: t("addYear"),
    emptyTitle: t("empty.title"), emptyDescription: t("empty.description"), editYear: t("editYear"),
    completion: t("completion"), addSemester: t("addSemester"), editSemester: t("editSemester"),
    readErrorTitle: t("readError.title"), readErrorDescription: t("readError.description"),
    semesters: { "1": t("semesters.1"), "2": t("semesters.2") },
    form: {
      label: t("form.label"), startDate: t("form.startDate"), endDate: t("form.endDate"),
      save: t("form.save"), saving: t("form.saving"), cancel: t("form.cancel"),
      errors: {
        accessDenied: t("errors.accessDenied"), dateInvalid: t("errors.dateInvalid"), dateOrder: t("errors.dateOrder"),
        duplicateSemester: t("errors.duplicateSemester"), duplicateYear: t("errors.duplicateYear"),
        labelRequired: t("errors.labelRequired"), labelTooLong: t("errors.labelTooLong"), notFound: t("errors.notFound"),
        outsideYear: t("errors.outsideYear"), semesterChronology: t("errors.semesterChronology"),
        semesterInvalid: t("errors.semesterInvalid"), unexpected: t("errors.unexpected"),
        unexpectedFields: t("errors.unexpectedFields"), yearContainsTerms: t("errors.yearContainsTerms"),
      },
      success: {
        yearCreated: t("success.yearCreated"), yearUpdated: t("success.yearUpdated"),
        semesterCreated: t("success.semesterCreated"), semesterUpdated: t("success.semesterUpdated"),
      },
    },
  };

  return <CalendarPage locale={locale} messages={messages} readError={result.status === "error"} years={result.status === "ready" ? result.years : []} />;
}
