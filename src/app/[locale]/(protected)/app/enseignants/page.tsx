import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isLocale } from "@/i18n/routing";
import { listTeachers } from "@/features/teachers/data";
import { TeacherPage, type TeacherPageMessages } from "@/features/teachers/teacher-page";
import type { TeacherResultCode } from "@/features/teachers/teacher-management";

export default async function TeachersRoute({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const result = await listTeachers();
  if (result.status === "unauthenticated") redirect(`/${locale}/connexion`);
  if (result.status === "forbidden") notFound();
  if (result.status === "access-unavailable") return null;
  const t = await getTranslations({ locale, namespace: "Teachers" });
  const errorKeys: TeacherResultCode[] = ["accessDenied", "configurationUnavailable", "displayNameInvalid", "displayNameRequired", "displayNameTooLong", "emailInvalid", "emailRequired", "emailTooLong", "invitationFailed", "invitationSent", "manualIntervention", "notFound", "profileUpdated", "retryableFailure", "unexpectedFields", "unexpected", "confirmationRequired", "passwordMismatch", "passwordTooLong", "passwordTooShort", "testUserCreated", "userAlreadyExists"];
  const messages: TeacherPageMessages = {
    eyebrow: t("eyebrow"), title: t("title"), description: t("description"), invitationTitle: t("invitation.title"),
    listTitle: t("listTitle"), emptyTitle: t("empty.title"), emptyDescription: t("empty.description"),
    readErrorTitle: t("readError.title"), readErrorDescription: t("readError.description"), active: t("status.active"), inactive: t("status.inactive"),
    form: {
      displayName: t("form.displayName"), email: t("form.email"), invite: t("form.invite"), inviting: t("form.inviting"),
      password: t("form.password"), passwordConfirmation: t("form.passwordConfirmation"), testWarning: t("form.testWarning"),
      save: t("form.save"), saving: t("form.saving"), edit: t("form.edit"), cancel: t("form.cancel"),
      deactivate: t("form.deactivate"), reactivate: t("form.reactivate"), deactivationWarning: t("form.deactivationWarning"), confirmDeactivation: t("form.confirmDeactivation"),
      errors: Object.fromEntries(errorKeys.map((key) => [key, t(`results.${key}`)])) as Record<TeacherResultCode, string>,
    },
  };
  return <TeacherPage messages={messages} readError={result.status === "error"} teachers={result.status === "ready" ? result.teachers : []} />;
}
