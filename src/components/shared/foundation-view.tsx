import type frMessages from "@/i18n/messages/fr.json";

type FoundationMessages = typeof frMessages.Foundation;

type FoundationViewProps = Readonly<{
  messages: FoundationMessages;
}>;

export function FoundationView({ messages }: FoundationViewProps) {
  return (
    <main className="foundation">
      <section className="foundation__panel" aria-labelledby="product-name">
        <p className="foundation__eyebrow">{messages.status}</p>
        <h1 id="product-name">{messages.productName}</h1>
        <p className="foundation__tagline">{messages.tagline}</p>
        <p className="foundation__note">
          {messages.milestoneLabel}&nbsp;: {messages.milestoneName}
        </p>
      </section>
    </main>
  );
}
