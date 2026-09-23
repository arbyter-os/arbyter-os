-- Grant the standard Supabase client privileges on every public table.
--
-- The base tables' privileges were granted by one-off SQL that predates the
-- migration chain, so every table created by a migration (governance tables,
-- webhook_replay_events, connector_execution_idempotency, tasks, ...) had no
-- grants at all: authenticated members were permission-denied even where RLS
-- policies allow reads, and service-role writes (webhook replay reservation,
-- governance audit persistence) would fail.
--
-- This restores the platform contract: broad grants + RLS as the boundary.
-- Deliberate hardening versus the original baseline: TRUNCATE is never
-- granted to anon/authenticated because TRUNCATE ignores row level security.

begin;

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated;
grant all privileges on all tables in schema public
  to service_role;

-- Future tables created by migrations inherit the same privileges.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant all privileges on tables to service_role;

-- TRUNCATE bypasses RLS: keep it away from client roles on every table.
revoke truncate on all tables in schema public from anon, authenticated;
alter default privileges in schema public
  revoke truncate on tables from anon, authenticated;

commit;
