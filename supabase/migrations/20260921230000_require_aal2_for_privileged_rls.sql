-- Require an AAL2 Supabase Auth session for database policies that rely on
-- is_current_user_org_admin(). This closes the direct PostgREST path around
-- the application-layer privileged MFA checks.
--
-- Keep this as a new migration rather than editing the original helper
-- migration so already-deployed environments receive the change.

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
      and coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
  );
$$;

revoke all on function public.is_current_user_org_admin() from public;
grant execute on function public.is_current_user_org_admin() to authenticated;
