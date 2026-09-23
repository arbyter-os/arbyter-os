-- Normalize table privileges: client roles never need REFERENCES or TRIGGER.
--
-- Production's platform default privileges auto-granted REFERENCES and
-- TRIGGER to anon/authenticated on tables created inside the migration
-- chain. The application never creates foreign keys or triggers through
-- client sessions, so these privileges are pure surface area. This migration
-- revokes them from all public tables (staging already matches this state)
-- and from default privileges so future tables start clean as well.

begin;

revoke references, trigger on all tables in schema public
  from anon, authenticated;
revoke references, trigger on all tables in schema public
  from anon, authenticated cascade;

alter default privileges in schema public
  revoke references, trigger on tables from anon, authenticated;

commit;
