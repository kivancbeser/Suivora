import frMessages from "@/i18n/messages/fr.json";

export default function NotFoundPage() {
  return (
    <main className="foundation">
      <section className="foundation__panel" aria-labelledby="not-found-title">
        <h1 id="not-found-title">{frMessages.Common.notFound}</h1>
      </section>
    </main>
  );
}
