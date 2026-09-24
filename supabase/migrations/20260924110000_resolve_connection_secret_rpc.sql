-- Credential secret resolution must not read vault.decrypted_secrets through
-- PostgREST: the platform API only exposes the 'public' schema, so the app's
-- admin client receives 406 PGRST106 ("Only the following schemas are
-- exposed: public") and every connector execution fails at credential
-- resolution (Stage 4 replay, .stage4/FINDINGS.md D-1). This SQL SECURITY
-- DEFINER function performs the vault read inside the database, where the
-- service role's existing SELECT grant on vault.decrypted_secrets applies.
--
-- Access posture (unchanged privileges, one narrowed entry point):
-- - executable only by service_role (explicit revokes below);
-- - requires an exact (organization_id, agent_connection_id) pair and an
--   active, unexpired agent_credentials row — a caller cannot scan secrets;
-- - returns only the decrypted secret value, never vault rows.

create or replace function public.resolve_connection_secret(
  p_organization_id uuid,
  p_connection_id uuid
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.decrypted_secret
  from vault.decrypted_secrets s
  join public.agent_credentials c
    on c.secret_reference ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   and s.id = c.secret_reference::uuid
  where c.organization_id = p_organization_id
    and c.agent_connection_id = p_connection_id
    and c.status = 'active'
    and (c.expires_at is null or c.expires_at > now())
  order by c.created_at desc
  limit 1
$$;

revoke all on function public.resolve_connection_secret(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.resolve_connection_secret(uuid, uuid)
to service_role;
