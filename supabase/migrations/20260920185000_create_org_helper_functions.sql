-- Create the organization-scoping helper used by every organization-isolated
-- RLS policy in this chain (38 call sites) and by policies already deployed
-- on the tasks/approval tables. No prior migration defined it, which broke
-- policy evaluation on any environment that did not already have the function
-- from a hand-applied patch.
--
-- Same security shape as is_current_user_org_admin(): SECURITY DEFINER so the
-- users lookup is not itself subject to RLS, empty search_path so operators
-- and relations cannot be shadowed by a hostile public schema, every
-- reference schema-qualified, executable only by the authenticated role.

begin;

create or replace function public.get_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.organization_id
  from public.users u
  where u.id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.get_user_organization_id() from public;
grant execute on function public.get_user_organization_id() to authenticated;

commit;
