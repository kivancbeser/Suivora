# Localization

## Implemented strategy

French is the only active and populated user-facing locale. The architecture supports adding Turkish and English later without restructuring, but neither is activated or populated. User-facing strings use next-intl messages rather than component literals. Domain logic, database enums, calculations, and identifiers remain language-independent.

## Locale source of truth

`src/i18n/routing.ts` exports:

- `locales = ["fr"]` as the immutable tuple;
- the derived `Locale` type;
- `defaultLocale = "fr"`;
- `isLocale`, which safely narrows untrusted values without casting;
- typed next-intl routing/navigation configuration.

An unsupported route locale is not treated as French; it produces a 404. `/fr` is canonical and `/` redirects explicitly to `/fr`.

## Message catalogs

`src/i18n/messages/fr.json` is the centralized catalog. Semantic namespaces describe meaning rather than component ownership: `Metadata`, `Foundation`, `Auth`, `Application`, `Calendar`, and `Common` are active namespaces. `Calendar` contains the ADMIN calendar headings, form labels, pending/success/error feedback, and fixed localized labels for Semester 1 and Semester 2. Module augmentation uses the French catalog as the message-key type contract.

Future strings require a catalog key before component use. During review, inspect changed files under `src/app`, `src/components`, and `src/features` for visible literals. Do not build a brittle string-lint rule until the project has a demonstrated need.

## Server and client usage

`src/i18n/request.ts` uses `next/root-params`, validates the locale, and loads the corresponding catalog on the server. Server Components and `generateMetadata` should use `getTranslations`; this is the default. `NextIntlClientProvider` lives at the locale layout boundary for future localized client components without converting the root application to a client component. Keep client translation boundaries as small as the feature permits.

Localized metadata uses the `Metadata` namespace. No production canonical URL, social image, analytics, locale cookie, browser-language detection, or preference persistence is configured.

## Navigation and routing

Task 07 adds the `Application` namespace for the shell, role labels, ADMIN/TEACHER navigation, landing placeholder, unavailable-module copy and safe access-unavailable state. The school name is authoritative tenant data rather than translated copy. Navigation slugs and `ADMIN`/`TEACHER` remain stable internal identifiers.

`src/i18n/navigation.ts` centralizes locale-aware `Link`, `redirect`, pathname, and router helpers. There is no language switcher. New application pages belong below `src/app/[locale]` and must respect the locale contract.

The authentication-only `proxy.ts` matcher covers the supported French sign-in and application routes solely to refresh session cookies. It does not negotiate or rewrite locales: `/` still redirects to `/fr`, and unknown locale segments still 404. Adding a locale requires extending both the catalog/locale tuple and the explicit authentication matcher.

Calendar dates are formatted for `fr-FR` with an explicit UTC time zone because schema values are date-only. Stored semester numbers and route identifiers remain language-independent.

## Adding a locale later

1. Create a complete catalog matching the typed French catalog.
2. Add catalog and routing tests, localized metadata checks, and representative render tests.
3. Add the locale code to the single tuple only after coverage is complete.
4. Review date, number, percentage, plural, and accessibility formatting.
5. Decide whether explicit switching or preference persistence is authorized before introducing either.

Do not activate a partial locale or silently fall back to French.

## Never translate

Do not translate domain identifiers/enums, database field names, route identifiers, analytics event names, or internal error codes. Content entered by schools or teachers is user data and is not automatically translated.

## Coverage

Localization applies to components, page metadata, navigation, actions, empty/error/loading states, validation messages, accessibility labels, emails/notifications if introduced, and generated PDF/Excel labels. Tests should detect missing keys and representative untranslated hardcoded UI copy.

## Teacher-management localization

Task 09C adds `Teachers` and `Activation` namespaces for list, form, active/inactive, invitation, compensation, invalid-link, and password-creation states. Server Actions return stable language-independent result codes; only the UI maps them to French. Email, UUID, token, provider text, and passwords are never interpolation values.

## Testing expectations

Tests cover the accepted/rejected locale contract, French default, immutable tuple type, root redirect target, catalog-sourced placeholder content, and visible French rendering. Direct unit testing of Next.js redirect/not-found primitives is intentionally avoided; application-owned locale and redirect decisions are tested, while build/render validation covers framework integration.
