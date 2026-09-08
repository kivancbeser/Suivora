import { SignOutButton } from "@/features/auth/sign-out-button";

type AccessUnavailableProps = Readonly<{
  messages: Readonly<{
    brand: string;
    title: string;
    description: string;
    signOut: string;
    signingOut: string;
  }>;
}>;

export function AccessUnavailable({ messages }: AccessUnavailableProps) {
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
        />
      </section>
    </main>
  );
}
