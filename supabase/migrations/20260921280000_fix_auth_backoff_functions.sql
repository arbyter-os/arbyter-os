-- Fixes the per-account exponential login backoff introduced in
-- 20260921270000_configurable_auth_backoff.sql. Safe to apply whether or not that
-- migration has already run: every statement is CREATE OR REPLACE / IF NOT EXISTS.
--
-- 1. record_auth_failure() declared a PL/pgSQL variable named "failures", the same
--    name as the table column it reads and updates. With the default
--    plpgsql.variable_conflict = error, PostgreSQL aborts with
--    'column reference "failures" is ambiguous' (SQLSTATE 42702) on every call, so no
--    failure was ever recorded and the exponential backoff could never engage.
--    Variables are now v_-prefixed and columns are alias-qualified.
-- 2. check_auth_rate_limit() inserted a row for every key it was asked about, so anyone
--    could grow the table by probing arbitrary email addresses. It is now read-only;
--    only failed logins create rows.
-- 3. Both functions used `set search_path = public`. Earlier hardening
--    (20260920220000_harden_rate_limit_search_path.sql) moved the rate limiter to an
--    empty search_path with schema-qualified names; this restores that convention.
-- 4. Stale rows (no failure for 24h and no active backoff) are pruned opportunistically.

create index if not exists auth_rate_limit_buckets_updated_at_idx
  on public.auth_rate_limit_buckets (updated_at);

create or replace function public.check_auth_rate_limit(p_key text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_next_allowed timestamptz;
begin
  if p_key is null or pg_catalog.length(p_key) = 0 then
    raise exception 'Invalid auth rate limit key';
  end if;

  select b.next_allowed_at
    into v_next_allowed
    from public.auth_rate_limit_buckets b
   where b.key = p_key;

  if v_next_allowed is null or v_next_allowed <= v_now then
    return query select true, 0;
    return;
  end if;

  return query select false,
    pg_catalog.greatest(1, pg_catalog.ceil(pg_catalog.extract(epoch from (v_next_allowed - v_now)))::integer);
end;
$$;

create or replace function public.record_auth_failure(
  p_key text,
  p_base_ms integer,
  p_max_ms integer,
  p_threshold integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_base_ms integer := pg_catalog.greatest(1, p_base_ms);
  v_max_ms integer := pg_catalog.greatest(pg_catalog.greatest(1, p_base_ms), p_max_ms);
  v_failures integer;
  v_delay_ms integer;
begin
  if p_key is null or pg_catalog.length(p_key) = 0 then
    raise exception 'Invalid auth rate limit key';
  end if;

  insert into public.auth_rate_limit_buckets as b (key, failures, next_allowed_at, updated_at)
  values (p_key, 1, v_now, v_now)
  on conflict (key) do update
    set failures = pg_catalog.least(b.failures + 1, 31),
        updated_at = v_now
  returning b.failures into v_failures;

  -- No delay until more than p_threshold consecutive failures, then base * 2^n, capped.
  if v_failures <= pg_catalog.greatest(0, p_threshold) then
    v_delay_ms := 0;
  else
    v_delay_ms := pg_catalog.least(
      v_max_ms::bigint,
      pg_catalog.greatest(
        v_base_ms::bigint,
        (v_base_ms::numeric * pg_catalog.power(2::numeric, pg_catalog.greatest(0, v_failures - p_threshold - 1)))::bigint
      )
    )::integer;
  end if;

  update public.auth_rate_limit_buckets b
     set next_allowed_at = v_now + pg_catalog.make_interval(secs => v_delay_ms / 1000.0)
   where b.key = p_key;

  -- Opportunistic cleanup (about 1% of calls) so probing cannot grow the table forever.
  if pg_catalog.random() < 0.01 then
    delete from public.auth_rate_limit_buckets b
     where b.updated_at < v_now - interval '24 hours'
       and b.next_allowed_at <= v_now;
  end if;
end;
$$;

create or replace function public.clear_auth_failures(p_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_key is null or pg_catalog.length(p_key) = 0 then
    raise exception 'Invalid auth rate limit key';
  end if;

  delete from public.auth_rate_limit_buckets b where b.key = p_key;
end;
$$;

revoke all on function public.check_auth_rate_limit(text) from public, anon, authenticated;
revoke all on function public.record_auth_failure(text, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.clear_auth_failures(text) from public, anon, authenticated;
grant execute on function public.check_auth_rate_limit(text) to service_role;
grant execute on function public.record_auth_failure(text, integer, integer, integer) to service_role;
grant execute on function public.clear_auth_failures(text) to service_role;
