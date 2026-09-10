import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/sign-up-form";
import type { SignUpErrorCode } from "@/features/auth/sign-up";
import { isLocale } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SignUpPageProps = Readonly<{ params: Promise<{ locale: string }> }>;

export async function generateMetadata({ params }: SignUpPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Signup" });
  return { title: t("title"), description: t("intro") };
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(`/${locale}/app`);

  const t = await getTranslations({ locale, namespace: "Signup" });
  const errorKeys: SignUpErrorCode[] = [
    "displayNameRequired", "displayNameTooLong", "emailRequired", "emailInvalid",
    "passwordTooShort", "passwordConfirmationRequired", "passwordMismatch",
    "accountAlreadyExists", "signupUnavailable", "unexpected",
  ];

  return (
    <main className="auth-shell">
      <section aria-labelledby="sign-up-title" className="auth-card">
        <p className="auth-card__brand">{t("productName")}</p>
        <h1 id="sign-up-title">{t("title")}</h1>
        <p className="auth-card__intro">{t("intro")}</p>
        <SignUpForm
          locale={locale}
          messages={{
            displayNameLabel: t("displayNameLabel"), emailLabel: t("emailLabel"),
            passwordLabel: t("passwordLabel"), passwordConfirmationLabel: t("passwordConfirmationLabel"),
            submit: t("submit"), submitting: t("submitting"),
            errors: Object.fromEntries(errorKeys.map((key) => [key, t(`errors.${key}`)])) as Record<SignUpErrorCode, string>,
          }}
        />
        <p className="auth-card__alternate">{t("haveAccount")} <Link href={`/${locale}/connexion`}>{t("signInLink")}</Link></p>
      </section>
    </main>
  );
}
