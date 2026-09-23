alter table public.discovery_findings enable row level security;

revoke all on table public.discovery_findings from anon, authenticated;

grant select on table public.discovery_findings to authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'discovery_findings'
  loop
    execute format(
      'drop policy if exists %I on public.discovery_findings',
      policy_record.policyname
    );
  end loop;
end
$$;

create policy "Authenticated users can view discovery findings in their organization"
  on public.discovery_findings
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());
