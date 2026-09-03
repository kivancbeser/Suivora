import frMessages from "@/i18n/messages/fr.json";
import "./globals.css";

export default function RootNotFoundPage() {
  return (
    <html lang="fr">
      <body>
        <main className="foundation">
          <section
            className="foundation__panel"
            aria-labelledby="not-found-title"
          >
            <h1 id="not-found-title">{frMessages.Common.notFound}</h1>
          </section>
        </main>
      </body>
    </html>
  );
}
