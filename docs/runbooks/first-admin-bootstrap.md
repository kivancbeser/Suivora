# First-administrator bootstrap runbook

This runbook provisions the first Suivora administrator only after the authentication and authorization migrations are present. Never paste a password, access token, database password, real email, or real UUID into this repository, migrations, issue trackers, logs, or shell history. Production bootstrap requires a fresh, separately approved review; do not reuse a development execution blindly.

## Prerequisites and target gate

1. Confirm the CLI link, ignored local public URL and authenticated Supabase account resolve to the same healthy project named `Suivora`.
2. Confirm the approved environment classification and verify that neither Numeon nor production is involved.
3. Confirm local/remote migration history matches with no pending migration.
4. Confirm exactly eight authorization policies and three protected helpers exist, RLS is enabled on all four tables, and Auth users plus all application tables are empty.
5. Inspect `schools` and `user_profiles`; the current profile schema has no display-name field.

## Disable public signup

In Supabase Dashboard, select the verified Suivora project, open **Authentication → Sign In / Providers → Email**, leave the Email provider enabled, disable **Allow new users to sign up**, and save. Re-read the public Auth settings endpoint to confirm email/password remains enabled and public signup is disabled. Do not change social providers, password policy, SMTP or unrelated services.

Review **Authentication → URL Configuration**. Record no invented URL: configure the real Site URL and redirect allow-list only when pilot/production application URLs are known and separately approved.

## Create the Auth user manually

Open **Authentication → Users → Add user → Create new user**. Enter the explicitly approved administrator email and a password directly in Dashboard. Codex must never receive or record the password. Mark the email confirmed only when appropriate for this controlled manual bootstrap. Create exactly one user, keep public signup disabled, then verify the Auth user count is one.

## Atomic school/profile transaction template

Replace placeholders only in the secure, untracked SQL Editor execution. Do not save the populated statement to disk. The current schema cannot persist an administrator display name.

```sql
begin;

do $$
declare
  target_user_id uuid;
  created_school_id uuid;
begin
  select users.id
  into strict target_user_id
  from auth.users as users
  where lower(users.email) = lower('<ADMIN_EMAIL>');

  if (select count(*) from auth.users) <> 1 then
    raise exception 'Expected exactly one Auth user';
  end if;

  if exists (select 1 from public.schools) then
    raise exception 'School bootstrap precondition failed';
  end if;

  if exists (select 1 from public.user_profiles) then
    raise exception 'Profile bootstrap precondition failed';
  end if;

  if exists (
    select 1 from public.user_profiles
    where role = 'ADMIN'::public.app_role
  ) then
    raise exception 'Administrator already exists';
  end if;

  insert into public.schools (name)
  values ('<SCHOOL_DISPLAY_NAME>')
  returning id into created_school_id;

  insert into public.user_profiles (id, school_id, role, active)
  values (target_user_id, created_school_id, 'ADMIN'::public.app_role, true);
end;
$$;

select
  (select count(*) from auth.users) as auth_user_count,
  (select count(*) from public.schools) as school_count,
  (select count(*) from public.user_profiles where role = 'ADMIN' and active) as active_admin_count,
  (select count(*) from public.school_years) as school_year_count,
  (select count(*) from public.terms) as term_count;

commit;
```

Any exception aborts the transaction; issue `rollback;` if the SQL Editor leaves it open. After success the preconditions make the transaction non-repeatable.

## Verification

- Confirm counts are exactly one Auth user, one school, one active ADMIN profile, zero school years and zero terms.
- Confirm the profile references the sole Auth user and school without copying identifiers into documentation.
- Sign in through `/fr/connexion`, reach `/fr/app`, sign out, then confirm protected access redirects back to sign-in.
- Through the authenticated public client, verify own school/profile and helper results, foreign/random-school denial, profile/school mutation denial and anonymous denial.
- Create one clearly temporary same-school year and term through the authenticated client, verify read/update and forged-school rejection, then remove them with a separately reviewed privileged cleanup transaction. Finish with zero years and zero terms.

## Recovery

- **Auth user exists but transaction failed:** inspect counts and the SQL error. Reuse the same Auth user only after confirming schools/profiles remain empty, then rerun the corrected atomic transaction.
- **School exists without a profile:** stop and inspect transaction/audit state; this should be impossible after a committed template execution. Do not create or delete records automatically.
- **Wrong email selected:** stop before SQL. Correct the manually created Auth user in Dashboard only after reviewing whether any profile references it.
- **Wrong role or school:** do not patch through the authenticated client. Inspect identifiers and use a separately reviewed privileged corrective transaction.
- **Duplicate execution:** the transaction must fail its school/profile preconditions without mutation. Inspect rather than bypassing the guards.
- **Login works but profile lookup fails:** confirm the Auth UUID matches `user_profiles.id`, the profile is active, its school exists, migrations are current and RLS helpers return expected values. Do not weaken RLS.

## Development execution record

Task 06C completed this runbook against the confirmed Suivora development project. Public signup remained disabled after provisioning; email/password login, logout and protected-route redirects passed. The reviewed authenticated/anonymous RLS matrix passed, temporary year/term records were removed, and the final safe counts were one Auth user, one school, one active ADMIN profile, zero school years and zero terms. Personal identifiers and credentials are intentionally omitted.
