-- Harden direct Supabase writes to organization configuration.
--
-- Application routes already enforce owner/admin for these operations. This
-- migration makes the database boundary enforce the same rule for direct
-- authenticated-client access, while preserving organization isolation.

-- search_path is set to the empty string rather than 'public'. A SECURITY
-- DEFINER function that keeps a writable schema on its search_path can have
-- *operators* (not just tables/functions) resolved out of that schema by any
-- role holding CREATE on it -- e.g. a hostile public.=(text,text) would be
-- preferred over pg_catalog.=(text,text) inside this function's body.
-- pg_catalog is always implicitly searched, so operators still resolve safely
-- with an empty search_path; every other reference below is schema-qualified.
create or replace function public.is_current_user_org_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.role = any (array['owner'::text, 'admin'::text])
  );
$$;

revoke all on function public.is_current_user_org_admin() from public;
grant execute on function public.is_current_user_org_admin() to authenticated;

-- These tables contain organization configuration/control-plane data. Replace
-- the previous organization-only write policies with owner/admin-only writes.

drop policy if exists "Users can create organization agent capabilities" on public.agent_capabilities;
drop policy if exists "Users can update organization agent capabilities" on public.agent_capabilities;
drop policy if exists "Users can delete organization agent capabilities" on public.agent_capabilities;
create policy "Owners and admins can create organization agent capabilities"
  on public.agent_capabilities for insert to authenticated
  with check (
    public.is_current_user_org_admin()
    and exists (
      select 1 from public.agent_connections ac
      where ac.id = agent_capabilities.agent_connection_id
        and ac.organization_id = (select u.organization_id from public.users u where u.id = auth.uid())
    )
  );
create policy "Owners and admins can update organization agent capabilities"
  on public.agent_capabilities for update to authenticated
  using (public.is_current_user_org_admin() and exists (
    select 1 from public.agent_connections ac
    where ac.id = agent_capabilities.agent_connection_id
      and ac.organization_id = (select u.organization_id from public.users u where u.id = auth.uid())
  ))
  with check (public.is_current_user_org_admin() and exists (
    select 1 from public.agent_connections ac
    where ac.id = agent_capabilities.agent_connection_id
      and ac.organization_id = (select u.organization_id from public.users u where u.id = auth.uid())
  ));
create policy "Owners and admins can delete organization agent capabilities"
  on public.agent_capabilities for delete to authenticated
  using (public.is_current_user_org_admin() and exists (
    select 1 from public.agent_connections ac
    where ac.id = agent_capabilities.agent_connection_id
      and ac.organization_id = (select u.organization_id from public.users u where u.id = auth.uid())
  ));


drop policy if exists "Users can create organization agent connections" on public.agent_connections;
drop policy if exists "Users can update organization agent connections" on public.agent_connections;
drop policy if exists "Users can delete organization agent connections" on public.agent_connections;
create policy "Owners and admins can create organization agent connections"
  on public.agent_connections for insert to authenticated
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can update organization agent connections"
  on public.agent_connections for update to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()))
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can delete organization agent connections"
  on public.agent_connections for delete to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));


drop policy if exists "Users can create organization agent credentials" on public.agent_credentials;
drop policy if exists "Users can update organization agent credentials" on public.agent_credentials;
drop policy if exists "Users can delete organization agent credentials" on public.agent_credentials;
create policy "Owners and admins can create organization agent credentials"
  on public.agent_credentials for insert to authenticated
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can update organization agent credentials"
  on public.agent_credentials for update to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()))
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can delete organization agent credentials"
  on public.agent_credentials for delete to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));


-- agent_deployments is an append-only deployment history (initiated_by,
-- started_at, completed_at, error_message). No application code deletes from
-- it, and the live schema has never had an authenticated DELETE policy. We
-- deliberately do NOT add one: with RLS enabled and no DELETE policy, DELETE
-- is denied for anon and authenticated, which is the intended model. Removing
-- deployment history stays a service-role/operator action.
drop policy if exists "Users can delete organization agent deployments" on public.agent_deployments;
drop policy if exists "Users can create organization agent deployments" on public.agent_deployments;
drop policy if exists "Users can update organization agent deployments" on public.agent_deployments;
create policy "Owners and admins can create organization agent deployments"
  on public.agent_deployments for insert to authenticated
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can update organization agent deployments"
  on public.agent_deployments for update to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()))
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));


drop policy if exists "Users can create organization agent endpoints" on public.agent_endpoints;
drop policy if exists "Users can update organization agent endpoints" on public.agent_endpoints;
drop policy if exists "Users can delete organization agent endpoints" on public.agent_endpoints;
create policy "Owners and admins can create organization agent endpoints"
  on public.agent_endpoints for insert to authenticated
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can update organization agent endpoints"
  on public.agent_endpoints for update to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()))
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can delete organization agent endpoints"
  on public.agent_endpoints for delete to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));


drop policy if exists "Users can create organization agent environments" on public.agent_environments;
drop policy if exists "Users can update organization agent environments" on public.agent_environments;
drop policy if exists "Users can delete organization agent environments" on public.agent_environments;
create policy "Owners and admins can create organization agent environments"
  on public.agent_environments for insert to authenticated
  with check (public.is_current_user_org_admin() and exists (
    select 1 from public.agent_connections ac
    where ac.id = agent_environments.agent_connection_id
      and ac.organization_id = (select u.organization_id from public.users u where u.id = auth.uid())
  ));
create policy "Owners and admins can update organization agent environments"
  on public.agent_environments for update to authenticated
  using (public.is_current_user_org_admin() and exists (
    select 1 from public.agent_connections ac
    where ac.id = agent_environments.agent_connection_id
      and ac.organization_id = (select u.organization_id from public.users u where u.id = auth.uid())
  ))
  with check (public.is_current_user_org_admin() and exists (
    select 1 from public.agent_connections ac
    where ac.id = agent_environments.agent_connection_id
      and ac.organization_id = (select u.organization_id from public.users u where u.id = auth.uid())
  ));
create policy "Owners and admins can delete organization agent environments"
  on public.agent_environments for delete to authenticated
  using (public.is_current_user_org_admin() and exists (
    select 1 from public.agent_connections ac
    where ac.id = agent_environments.agent_connection_id
      and ac.organization_id = (select u.organization_id from public.users u where u.id = auth.uid())
  ));


drop policy if exists "Users can create organization agent permissions" on public.agent_permissions;
drop policy if exists "Users can update organization agent permissions" on public.agent_permissions;
drop policy if exists "Users can delete organization agent permissions" on public.agent_permissions;
create policy "Owners and admins can create organization agent permissions"
  on public.agent_permissions for insert to authenticated
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can update organization agent permissions"
  on public.agent_permissions for update to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()))
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can delete organization agent permissions"
  on public.agent_permissions for delete to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));


drop policy if exists "Users can create organization agent tools" on public.agent_tools;
drop policy if exists "Users can update organization agent tools" on public.agent_tools;
drop policy if exists "Users can delete organization agent tools" on public.agent_tools;
create policy "Owners and admins can create organization agent tools"
  on public.agent_tools for insert to authenticated
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can update organization agent tools"
  on public.agent_tools for update to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()))
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can delete organization agent tools"
  on public.agent_tools for delete to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));


drop policy if exists "Users can create organization agent versions" on public.agent_versions;
drop policy if exists "Users can update organization agent versions" on public.agent_versions;
drop policy if exists "Users can delete organization agent versions" on public.agent_versions;
create policy "Owners and admins can create organization agent versions"
  on public.agent_versions for insert to authenticated
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can update organization agent versions"
  on public.agent_versions for update to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()))
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can delete organization agent versions"
  on public.agent_versions for delete to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));


drop policy if exists "Users can create organization agent webhooks" on public.agent_webhooks;
drop policy if exists "Users can update organization agent webhooks" on public.agent_webhooks;
drop policy if exists "Users can delete organization agent webhooks" on public.agent_webhooks;
create policy "Owners and admins can create organization agent webhooks"
  on public.agent_webhooks for insert to authenticated
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can update organization agent webhooks"
  on public.agent_webhooks for update to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()))
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can delete organization agent webhooks"
  on public.agent_webhooks for delete to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));


-- NOTE: the live schema has no authenticated UPDATE policy on ai_agents, so
-- the UPDATE policy below is a deliberate, disclosed change rather than a
-- pure tightening. It is required, not incidental: the governance control
-- `pause_agent` in lib/governance/action-executor.ts updates ai_agents.status
-- through the user-scoped client, and today that update matches zero rows and
-- reports "Agent was not found in the organization." The policy is scoped to
-- owner/admin, which matches ADMIN_ACTIONS in app/api/governance/action/route.ts.
drop policy if exists "Users can create agents in their organization" on public.ai_agents;
drop policy if exists "Users can delete agents in their organization" on public.ai_agents;
drop policy if exists "Users can update agents in their organization" on public.ai_agents;
create policy "Owners and admins can create agents in their organization"
  on public.ai_agents for insert to authenticated
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can update agents in their organization"
  on public.ai_agents for update to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()))
  with check (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
create policy "Owners and admins can delete agents in their organization"
  on public.ai_agents for delete to authenticated
  using (public.is_current_user_org_admin() and organization_id = (select u.organization_id from public.users u where u.id = auth.uid()));
