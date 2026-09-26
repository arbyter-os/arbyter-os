-- F3 (approval resolution MFA): the approval_requests UPDATE policy created in
-- 20260922100000 checks the owner/admin role with a plain subquery and no AAL2
-- requirement, so a privileged session at AAL1 could mutate approval state
-- (status, metadata, expires_at) directly through PostgREST. Every other
-- privileged RLS policy uses public.is_current_user_org_admin(), which since
-- 20260921230000 requires auth.jwt()->>'aal' = 'aal2'. Align the approval
-- policy with that invariant: approval mutations are privileged AND AAL2.
--
-- The application separately enforces requester/resolver separation and
-- expiry at the resolve/resume boundaries; this closes the direct-API path.

drop policy if exists approval_requests_update_privileged on public.approval_requests;

create policy approval_requests_update_privileged on public.approval_requests
for update to authenticated
using (
  public.is_current_user_org_admin()
  and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
)
with check (
  public.is_current_user_org_admin()
  and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
);
