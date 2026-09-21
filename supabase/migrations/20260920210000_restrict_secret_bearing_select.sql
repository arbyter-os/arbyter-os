-- Third RLS hardening pass.
--
-- 20260920190000 and 20260920200000 hardened writes but left SELECT
-- unchanged everywhere, including on three tables that hold secret material
-- or secret references readable by any organization member via a direct
-- PostgREST/browser session:
--
--   * agent_credentials.secret_reference
--   * agent_webhooks.secret_reference
--   * discovery_sources.credential_reference /
--     discovery_sources.configuration.authorization_secret_reference
--
-- Application-code audit (see the accompanying pull request description)
-- found no member-facing code path that reads these tables through the
-- user-scoped Supabase client:
--
--   * agent_credentials is only ever SELECTed via the service-role client
--     (lib/credentials/runtime.ts), which bypasses RLS and is therefore
--     unaffected by this migration.
--   * agent_webhooks has no SELECT call anywhere in the application.
--   * discovery_sources had exactly one legitimate member-facing read
--     (lib/discovery/run-scan.ts, invoked by a member running their own
--     queued scan) that has been moved to the service-role client in the
--     same change set as this migration, with the organization_id/scan_id
--     ownership already re-validated at the route layer before that read.
--
-- Restricting SELECT to owner/admin therefore closes direct read access
-- without removing any capability the application actually exercises.
-- INSERT/UPDATE/DELETE on these tables were already owner/admin-only.

drop policy if exists "Users can view their organization agent credentials" on public.agent_credentials;
create policy "Owners and admins can view their organization agent credentials"
  on public.agent_credentials for select to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  );

drop policy if exists "Users can view their organization agent webhooks" on public.agent_webhooks;
create policy "Owners and admins can view their organization agent webhooks"
  on public.agent_webhooks for select to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  );

drop policy if exists "Users can view discovery sources in their organization" on public.discovery_sources;
create policy "Owners and admins can view discovery sources in their organization"
  on public.discovery_sources for select to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = (select u.organization_id from public.users u where u.id = (select auth.uid()))
  );
