# Localization

## Implemented strategy

French is the source and default locale; Turkish is the second complete active locale. English remains unsupported. User-facing strings use next-intl messages rather than component literals. Domain logic, database enums, calculations, identifiers, and school-entered values remain language-independent.

## Locale source of truth

`src/i18n/routing.ts` exports:

- `locales = ["fr", "tr"]` as the immutable tuple;
- the derived `Locale` type;
- `defaultLocale = "fr"`;
- `isLocale`, which safely narrows untrusted values without casting;
- typed next-intl routing/navigation configuration.

An unsupported route locale is not treated as French; it produces a 404. `/fr` is canonical and `/` redirects explicitly to `/fr` without browser-language detection.

## Message catalogs

`src/i18n/messages/fr.json` is the source catalog and `src/i18n/messages/tr.json` is its complete Turkish peer. Their nested keys and ICU parameters must match exactly. Semantic namespaces describe meaning rather than component ownership: `Metadata`, `Foundation`, `Auth`, `Application`, `Calendar`, `Teachers`, `Activation`, `Classes`, `Courses`, `Students`, and `Common` are active namespaces. Module augmentation uses the French catalog as the message-key type contract.

Future strings require a catalog key before component use. During review, inspect changed files under `src/app`, `src/components`, and `src/features` for visible literals. Do not build a brittle string-lint rule until the project has a demonstrated need.

## Server and client usage

`src/i18n/request.ts` uses `next/root-params`, validates the locale, and loads the corresponding catalog on the server. Server Components and `generateMetadata` should use `getTranslations`; this is the default. `NextIntlClientProvider` lives at the locale layout boundary for future localized client components without converting the root application to a client component. Keep client translation boundaries as small as the feature permits.

Localized metadata uses the `Metadata` namespace. No production canonical URL, social image, analytics, locale cookie, browser-language detection, or preference persistence is configured.

## Navigation and routing

Task 07 adds the `Application` namespace for the shell, role labels, ADMIN/TEACHER navigation, landing placeholder, unavailable-module copy and safe access-unavailable state. The school name is authoritative tenant data rather than translated copy. Navigation slugs and `ADMIN`/`TEACHER` remain stable internal identifiers.

`src/i18n/navigation.ts` centralizes locale-aware application navigation. One global accessible `FR | TR` switcher lives at the localized root layout, marks the current language semantically, and remains keyboard/touch accessible on every localized surface. New application pages belong below `src/app/[locale]` and inherit it automatically.

The authentication-only `proxy.ts` matcher covers French and Turkish sign-in, activation, and application routes solely to refresh session cookies. It does not negotiate or rewrite locales: `/` still redirects to `/fr`, and unknown locale segments still 404. Sign-in, post-login, sign-out, and protected-route redirects retain the validated active locale.

The switcher replaces only the leading locale segment and preserves the remaining pathname. It drops all query parameters rather than forwarding an allow-list, so token hashes, access/refresh/recovery/invitation tokens, email addresses, passwords, and arbitrary `next` values cannot cross locale URLs. `/auth/confirm` remains non-localized and retains `/fr/activation` as its secure invitation default; the authenticated activation page can then switch safely to Turkish.

Calendar dates use `fr-FR` or `tr-TR` with an explicit UTC time zone because schema values are date-only. Semester labels are presentation data (`Semestre 1/2` and `1. Dönem/2. Dönem`); stored semester numbers, names, dates, roles, and route identifiers remain unchanged.

## Adding another locale later

1. Create a complete catalog matching the typed French catalog.
2. Add catalog and routing tests, localized metadata checks, and representative render tests.
3. Add the locale code to the single tuple only after coverage is complete.
4. Review date, number, percentage, plural, and accessibility formatting.
5. Extend the existing explicit switcher only after the locale is complete; do not introduce automatic detection implicitly.

Do not activate a partial locale or silently fall back to French.

## Never translate

Do not translate domain identifiers/enums, database field names, route identifiers, analytics event names, or internal error codes. Content entered by schools or teachers is user data and is not automatically translated.

## Coverage

Localization applies to components, page metadata, navigation, actions, empty/error/loading states, validation messages, accessibility labels, emails/notifications if introduced, and generated PDF/Excel labels. Tests should detect missing keys and representative untranslated hardcoded UI copy.

## Teacher-management localization

Task 09C adds `Teachers` and `Activation` namespaces for list, form, active/inactive, invitation, compensation, invalid-link, and password-creation states. Task 09C2 maps the same language-independent Server Action result codes in both catalogs. Email, UUID, token, provider text, and passwords are never interpolation values.

## Class and course localization

Task 10C adds structurally identical `Classes` and `Courses` namespaces for French and Turkish lists, details, forms, status, validation, success, empty, loading, and safe error states. User-entered class/course names and codes are displayed unchanged. The global switcher preserves nested class-detail paths and continues to discard query parameters.

## Student localization

The `Students` namespace covers ADMIN list/detail, search and filters, creation with initial enrollment, identity editing, enrollment history, same-year transfer, closure confirmations, validation, pending, empty, success, and safe error states. Names, school codes, and class names remain untranslated school data. Date-only enrollment values use the active locale with UTC formatting, and the global switcher preserves nested student-detail paths while discarding query parameters.

## Testing expectations

Tests cover the exact locale tuple, French default/root redirect, catalog and ICU parity, Turkish terminology, route-preserving query-stripping switches, localized authentication redirects, role navigation, semester labels/date formats, accessible selected state, and representative rendering. Framework integration is additionally covered by build and local runtime verification.
