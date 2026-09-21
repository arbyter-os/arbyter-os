-- Second RLS hardening pass.
--
-- 20260920190000 hardened the agent control-plane tables but left three
-- categories of trust-bearing state writable by any organization member:
--
--   * agent_identities.verified      -- surfaced as the agent's verified flag
--                                       by lib/agents/registry.ts
--   * agent_decisions.approved /
--     agent_decisions.approved_by    -- a self-approval primitive
--   * discovery_sources.endpoint_url /
--     discovery_sources.credential_reference /
--     discovery_sources.configuration.authorization_secret_reference
--                                    -- scan targets and Vault-backed secrets
--
-- Organization isolation is preserved everywhere. SELECT is deliberately left
-- unchanged on all three tables: members must still be able to read them.

------------------------------------------------------------------------------
-- agent_identities: verification state is an administrative assertion.
------------------------------------------------------------------------------

drop policy if exists "Users can create organization agent identities" on public.agent_identities;
drop policy if exists "Users can update organization agent identities" on public.agent_identities;
drop policy if exists "Users can delete organization agent identities" on public.agent_identities;

create policy "Owners and admins can create organization agent identities"
  on public.agent_identities for insert to authenticated
  with check (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  );
create policy "Owners and admins can update organization agent identities"
  on public.agent_identities for update to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  )
  with check (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  );
create policy "Owners and admins can delete organization agent identities"
  on public.agent_identities for delete to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  );

------------------------------------------------------------------------------
-- agent_decisions: members may record a decision, but may not approve one.
--
-- INSERT stays open to members so agent runtimes operating under a member
-- session can log decisions, but the WITH CHECK forbids a member from writing
-- an already-approved row. UPDATE (the only way to flip `approved` after the
-- fact) is owner/admin only. DELETE has no policy and stays denied: decisions
-- are an audit trail.
------------------------------------------------------------------------------

drop policy if exists "Users can create organization agent decisions" on public.agent_decisions;
drop policy if exists "Users can update organization agent decisions" on public.agent_decisions;

create policy "Members can record unapproved organization agent decisions"
  on public.agent_decisions for insert to authenticated
  with check (
    organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
    and (
      public.is_current_user_org_admin()
      or (coalesce(approved, false) = false and approved_by is null)
    )
  );
create policy "Owners and admins can update organization agent decisions"
  on public.agent_decisions for update to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  )
  with check (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  );

------------------------------------------------------------------------------
-- discovery_sources: scan targets and credential references.
--
-- Creating a source chooses an outbound endpoint the scanner will call and can
-- provision a Vault secret, so it is an administrative action. Scans,
-- scan_sources and findings remain member-writable: those operate only over
-- sources an owner/admin has already approved.
------------------------------------------------------------------------------

drop policy if exists "Users can create discovery sources in their organization" on public.discovery_sources;
drop policy if exists "Users can update discovery sources in their organization" on public.discovery_sources;
drop policy if exists "Users can delete discovery sources in their organization" on public.discovery_sources;

create policy "Owners and admins can create discovery sources in their organization"
  on public.discovery_sources for insert to authenticated
  with check (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  );
create policy "Owners and admins can update discovery sources in their organization"
  on public.discovery_sources for update to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  )
  with check (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  );
create policy "Owners and admins can delete discovery sources in their organization"
  on public.discovery_sources for delete to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  );
