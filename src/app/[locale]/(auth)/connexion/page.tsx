import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SignInForm } from "@/features/auth/sign-in-form";
import {
  getAuthRedirect,
  getSafeReturnPath,
  type SignInErrorCode,
} from "@/features/auth/authentication";
import { isLocale } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SignInPageProps = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ retour?: string | string[] }>;
}>;

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  const authRedirect = getAuthRedirect("signIn", Boolean(data.user), locale);

  if (authRedirect) {
    redirect(authRedirect);
  }

  const query = await searchParams;
  const returnCandidate = Array.isArray(query.retour) ? undefined : query.retour;
  const returnTo = getSafeReturnPath(returnCandidate, locale);
  const t = await getTranslations({ locale, namespace: "Auth" });
  const errorKeys: SignInErrorCode[] = [
    "credentialsInvalid",
    "unexpected",
    "emailRequired",
    "emailInvalid",
    "passwordRequired",
  ];

  return (
    <main className="auth-shell">
      <section aria-labelledby="sign-in-title" className="auth-card">
        <p className="auth-card__brand">{t("productName")}</p>
        <h1 id="sign-in-title">{t("title")}</h1>
        <p className="auth-card__intro">{t("intro")}</p>
        <SignInForm
          locale={locale}
          messages={{
            emailLabel: t("emailLabel"),
            passwordLabel: t("passwordLabel"),
            submit: t("submit"),
            submitting: t("submitting"),
            errors: Object.fromEntries(
              errorKeys.map((key) => [key, t(`errors.${key}`)]),
            ) as Record<SignInErrorCode, string>,
          }}
          returnTo={returnTo}
        />
      </section>
    </main>
  );
}
