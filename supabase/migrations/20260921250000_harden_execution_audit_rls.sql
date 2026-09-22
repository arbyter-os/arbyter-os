-- Harden the database authorization boundary for server-controlled execution
-- and audit records.
--
-- These relations are application/system records. Authenticated clients may
-- read rows belonging to their organization, but they must not be able to
-- create, mutate, or delete execution history or server-generated audit data.
-- Trusted server-side code writes through the existing service-role client,
-- which intentionally bypasses RLS after the application has authenticated
-- and authorized the operation.

alter table public.agent_executions enable row level security;
alter table public.execution_steps enable row level security;
alter table public.agent_events enable row level security;
alter table public.agent_activity enable row level security;
alter table public.agent_health_checks enable row level security;
alter table public.agent_connection_events enable row level security;

-- RLS does not govern TRUNCATE, and the supplied schema grants broad table
-- privileges to client roles. Remove all direct client table privileges and
-- grant back only the SELECT privilege needed by the application. This makes
-- the absence of client write policies an actual database authorization
-- boundary rather than relying on RLS alone.
revoke all on table
  public.agent_executions,
  public.execution_steps,
  public.agent_events,
  public.agent_activity,
  public.agent_health_checks,
  public.agent_connection_events
from anon, authenticated;

grant select on table
  public.agent_executions,
  public.execution_steps,
  public.agent_events,
  public.agent_activity,
  public.agent_health_checks,
  public.agent_connection_events
to authenticated;

-- Replace any legacy policies on these tables with an explicit read-only
-- client policy set. The dynamic cleanup avoids depending on policy names
-- that are absent from the supplied schema snapshot.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'agent_executions',
        'execution_steps',
        'agent_events',
        'agent_activity',
        'agent_health_checks',
        'agent_connection_events'
      )
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      policy_record.policyname,
      policy_record.tablename
    );
  end loop;
end
$$;

create policy "Authenticated users can view organization agent executions"
  on public.agent_executions
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

create policy "Authenticated users can view organization execution steps"
  on public.execution_steps
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

create policy "Authenticated users can view organization agent events"
  on public.agent_events
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

create policy "Authenticated users can view organization agent activity"
  on public.agent_activity
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

create policy "Authenticated users can view organization agent health checks"
  on public.agent_health_checks
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

create policy "Authenticated users can view organization agent connection events"
  on public.agent_connection_events
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

-- Deliberately no authenticated INSERT/UPDATE/DELETE policies exist for any
-- of these tables. Server/system writes use the existing service-role client.
