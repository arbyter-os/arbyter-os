-- Harden the database authorization boundary for governance data.
--
-- Governance policy definitions are organization control-plane data and may
-- only be changed by owner/admin sessions. The existing helper also requires
-- AAL2, so the database keeps the same privileged-access model used by the
-- application layer.
--
-- Governance decisions/evaluations and rule-to-regulation mappings are
-- server-generated records. They remain readable within the organization,
-- but authenticated clients receive no direct write policy; trusted
-- service-role operations bypass RLS as intended.
--
-- Regulatory requirements are a shared read-only reference library rather
-- than tenant-owned data, so authenticated users may read them but cannot
-- modify them through the client role.

alter table public.governance_policies enable row level security;
alter table public.governance_policy_rules enable row level security;
alter table public.governance_decisions enable row level security;
alter table public.policy_evaluations enable row level security;
alter table public.regulatory_requirements enable row level security;
alter table public.governance_rule_requirements enable row level security;

-- Replace any legacy policies on these governance tables with the explicit
-- least-privilege policy set below. This is intentionally dynamic because the
-- supplied schema snapshot does not contain these governance relations or
-- their legacy policy names.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'governance_policies',
        'governance_policy_rules',
        'governance_decisions',
        'policy_evaluations',
        'regulatory_requirements',
        'governance_rule_requirements'
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

-- Policy definitions: organization members may read their organization's
-- policies, but only owner/admin AAL2 sessions may create, change, or delete
-- definitions. Cross-organization rows are excluded at the database layer.
create policy "Authenticated users can read organization governance policies"
  on public.governance_policies
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

create policy "Owners and admins can create organization governance policies"
  on public.governance_policies
  for insert
  to authenticated
  with check (
    public.is_current_user_org_admin()
    and organization_id = public.get_user_organization_id()
  );

create policy "Owners and admins can update organization governance policies"
  on public.governance_policies
  for update
  to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = public.get_user_organization_id()
  )
  with check (
    public.is_current_user_org_admin()
    and organization_id = public.get_user_organization_id()
  );

create policy "Owners and admins can delete organization governance policies"
  on public.governance_policies
  for delete
  to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = public.get_user_organization_id()
  );

-- Policy rules follow the same organization and privileged-write boundary.
create policy "Authenticated users can read organization governance policy rules"
  on public.governance_policy_rules
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

create policy "Owners and admins can create organization governance policy rules"
  on public.governance_policy_rules
  for insert
  to authenticated
  with check (
    public.is_current_user_org_admin()
    and organization_id = public.get_user_organization_id()
  );

create policy "Owners and admins can update organization governance policy rules"
  on public.governance_policy_rules
  for update
  to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = public.get_user_organization_id()
  )
  with check (
    public.is_current_user_org_admin()
    and organization_id = public.get_user_organization_id()
  );

create policy "Owners and admins can delete organization governance policy rules"
  on public.governance_policy_rules
  for delete
  to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = public.get_user_organization_id()
  );

-- Governance decisions are server-generated audit records. There is no
-- authenticated-client write policy. The application persists them through
-- the service-role client in lib/governance/audit.ts, which bypasses RLS.
create policy "Authenticated users can read organization governance decisions"
  on public.governance_decisions
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

-- Policy evaluations are server-generated audit records as well.
create policy "Authenticated users can read organization policy evaluations"
  on public.policy_evaluations
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

-- Regulatory requirements are shared reference data, not tenant-owned
-- records. Keep them read-only to the authenticated client role.
create policy "Authenticated users can read regulatory requirements"
  on public.regulatory_requirements
  for select
  to authenticated
  using ((select auth.uid()) is not null);

-- Rule-to-requirement mappings are tenant-owned governance configuration.
-- They are readable within the organization but are server-managed for
-- writes; service-role operations bypass RLS where needed.
create policy "Authenticated users can read organization governance rule requirements"
  on public.governance_rule_requirements
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());
