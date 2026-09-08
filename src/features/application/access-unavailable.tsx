import { SignOutButton } from "@/features/auth/sign-out-button";
import type { Locale } from "@/i18n/routing";

type AccessUnavailableProps = Readonly<{
  messages: Readonly<{
    brand: string;
    title: string;
    description: string;
    signOut: string;
    signingOut: string;
  }>;
  locale: Locale;
}>;

export function AccessUnavailable({ locale, messages }: AccessUnavailableProps) {
  return (
    <main className="access-unavailable">
      <section aria-labelledby="access-unavailable-title" className="access-unavailable__card">
        <p className="app-brand">{messages.brand}</p>
        <h1 id="access-unavailable-title">{messages.title}</h1>
        <p>{messages.description}</p>
        <SignOutButton
          className="app-sign-out"
          label={messages.signOut}
          pendingLabel={messages.signingOut}
          locale={locale}
        />
      </section>
    </main>
  );
}
