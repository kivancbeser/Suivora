# Teacher invitation setup runbook

TASK 09C implements the code path, and TASK 09D-PRE deploys it to the dedicated Vercel project at `https://suivora.vercel.app`. The development Auth URLs were configured after the explicit TASK 09D-PRE gate; no invitation has been sent. Keep development and future production configuration separate.

## Server-only environment

Configure `SUPABASE_SECRET_KEY` with a current Supabase `sb_secret_…` key and `APP_URL` with the application origin. `APP_URL` must be one absolute HTTP(S) origin: no credentials, path, query, fragment, or trailing-path redirect. Never use `NEXT_PUBLIC_`, a publishable-key fallback, logs, screenshots, documentation, or client-side hosting variables for the secret.

Local development uses `http://localhost:3000`; the deployed Vercel Production environment uses the stable `https://suivora.vercel.app` alias. Never use a branch-specific preview deployment as an invitation origin.

The isolated privileged client disables persisted sessions, URL session detection, and token refresh. It is used only for `auth.admin.inviteUserByEmail` and exact-user compensation. Normal database reads and both profile RPCs continue through the authenticated cookie-aware client and RLS.

## Supabase Auth configuration

- Keep public signup disabled.
- The current Suivora development Site URL is `https://suivora.vercel.app`, configured after explicit approval.
- The redirect allow-list contains `https://suivora.vercel.app/**` for the controlled `/auth/confirm` callback and `http://localhost:3000/**` for local work.
- Configure the invite email template to direct the token hash and invitation type to this exact shape:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/fr/activation
```

- Disable email-link tracking or rewriting for Auth emails because rewriting can invalidate authentication links.
- Configure a production SMTP provider before pilot use. Supabase's default email service is only appropriate for limited development verification.

## Lifecycle

An active ADMIN supplies an email and display name. The server re-authenticates and authorizes the request, validates both values, loads privileged configuration lazily, sends the Auth invitation, and passes only the returned Auth user ID plus normalized name to `admin_provision_teacher_profile` through the ADMIN's normal client. Supabase Auth owns email and password; `user_profiles` owns school, role, display name, and active state.

The email link reaches `/auth/confirm`, which accepts only `type=invite`, a bounded token hash, and exact `next=/fr/activation`. Successful OTP verification establishes SSR cookies and redirects without the token. The authenticated active TEACHER chooses a matching password of at least 12 characters on `/fr/activation`; ADMIN and unauthenticated access are rejected.

TASK 09D is required before pilot use to review the remote template/URL/SMTP configuration and exercise exactly one controlled invitation and activation without exposing identifiers or credentials.
