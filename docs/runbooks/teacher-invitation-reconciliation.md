# Teacher invitation reconciliation runbook

Use this runbook when Auth invitation succeeded but TEACHER profile provisioning did not clearly complete. Never search and delete broadly by email, and never paste a real email, UUID, token, or credential into source control, tickets, or ordinary logs.

## Automatic bounded compensation

The request retains only the Auth user ID returned by its own successful invitation. After an RPC failure it checks, through the authenticated ADMIN/RLS boundary, whether that exact ID is now a same-school TEACHER profile. A valid profile reconciles the operation as success. Otherwise it attempts one deletion of only that newly returned Auth identity. It never deletes after an existing-user/duplicate invitation failure, never targets the ADMIN, and never loops or retries automatically.

- Cleanup success produces a safe retryable result.
- Cleanup failure produces a manual-intervention-required result.
- Provider errors, email, user IDs, and tokens are never returned or logged.

## Manual reconciliation

1. Stop further invitations for the affected address.
2. In the verified Supabase development project, inspect the specific invitation execution and its symbolic `<INVITED_AUTH_USER_ID>` using an approved administrative channel.
3. Check whether `public.user_profiles.id = <INVITED_AUTH_USER_ID>` exists and is a same-school TEACHER.
4. If the valid profile exists, retain both records and treat provisioning as reconciled.
5. If no profile exists, confirm the Auth identity came from that exact failed invitation, is not pre-existing, is not the ADMIN, and has no application references before a separately reviewed cleanup.
6. If provenance or ownership is uncertain, do not delete. Escalate for manual review.
7. Record the outcome without personal identifiers or raw provider errors.

Do not bypass the protected RPC, add direct profile grants, assign school/role from metadata, or create a profile through the privileged Auth client.
