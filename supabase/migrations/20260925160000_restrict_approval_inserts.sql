-- P1 (rate-limit / abuse-resistance audit): approval_requests INSERT authorization.
--
-- Threat: proxy.ts and the Next.js rate limiter cannot see direct Supabase
-- PostgREST traffic. The previous INSERT policy allowed ANY authenticated
-- member of an organization to insert approval_requests rows directly through
-- PostgREST (requested_by = auth.uid() was the only identity constraint), so a
-- member could flood the approver queue at unlimited volume — approval-queue
-- DoS that no application-layer rate limit can reach.
--
-- New model (tightening only):
--   1. INSERT requires owner/admin (AAL2 invariant via
--      is_current_user_org_admin()) in the row's organization. Members can no
--      longer create approvals at all — approval creation is a privileged
--      security-state change, matching the resolve/resume authorization model.
--   2. Rows referencing an execution (execution_id IS NOT NULL) are
--      execution-linked security state. The only legitimate writer is the
--      authoritative engine through the service-role client, which bypasses
--      RLS; authenticated INSERT WITH CHECK forbids execution_id entirely so
--      no client can forge a row that the resume boundary could consider.
--      (Resume-side provenance additionally roots in the service-role-written
--      governance_decisions table; this removes the forge attempt at the
--      database layer as well.)
--   3. Governance-generated, execution-less requests (requested_by = auth.uid()
--      preserved) remain insertable by privileged users only, replacing the
--      prior member-insertable behavior of the governance request_approval
--      action.
--
-- SELECT/UPDATE/DELETE policies are unchanged: SELECT stays org-wide (members
-- must read the queue), UPDATE stays owner/admin + AAL2
-- (20260925150000_require_aal2_for_approval_updates.sql).

drop policy if exists approval_requests_insert_same_org on public.approval_requests;

create policy approval_requests_insert_privileged on public.approval_requests
for insert to authenticated
with check (
  public.is_current_user_org_admin()
  and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  and requested_by = auth.uid()
  and execution_id is null
);

comment on policy approval_requests_insert_privileged on public.approval_requests is
  'P1: approval creation is privileged; execution-linked rows are service-role only (engine writes bypass RLS). Closes direct-PostgREST approval-queue spam.';
