create table if not exists public.auth_rate_limit_buckets (
  key text primary key,
  failures integer not null default 0,
  next_allowed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.auth_rate_limit_buckets enable row level security;
revoke all on table public.auth_rate_limit_buckets from public, anon, authenticated;

create or replace function public.check_auth_rate_limit(p_key text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data public.auth_rate_limit_buckets%rowtype;
  now_at timestamptz := clock_timestamp();
begin
  if p_key is null or length(p_key) = 0 then raise exception 'Invalid auth rate limit key'; end if;
  insert into public.auth_rate_limit_buckets(key) values (p_key) on conflict (key) do nothing;
  select * into row_data from public.auth_rate_limit_buckets where key = p_key for update;
  if row_data.next_allowed_at <= now_at then
    return query select true, 0;
  end if;
  return query select false, greatest(1, ceil(extract(epoch from (row_data.next_allowed_at - now_at)))::integer);
end;
$$;

create or replace function public.record_auth_failure(p_key text, p_base_ms integer, p_max_ms integer, p_threshold integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  now_at timestamptz := clock_timestamp();
  failures integer;
  base_ms integer := greatest(1, p_base_ms);
  max_ms integer := greatest(base_ms, p_max_ms);
  delay_ms integer;
begin
  if p_key is null or length(p_key) = 0 then raise exception 'Invalid auth rate limit key'; end if;
  insert into public.auth_rate_limit_buckets(key) values (p_key) on conflict (key) do nothing;
  select failures into failures from public.auth_rate_limit_buckets where key = p_key for update;
  failures := least(failures + 1, 31);
  delay_ms := case when failures <= greatest(0, p_threshold) then 0 else least(max_ms, greatest(base_ms, base_ms * (2 ^ greatest(0, failures - p_threshold - 1)))) end;
  update public.auth_rate_limit_buckets
     set failures = failures, next_allowed_at = now_at + make_interval(secs => delay_ms / 1000.0), updated_at = now_at
   where key = p_key;
end;
$$;

create or replace function public.clear_auth_failures(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_key is null or length(p_key) = 0 then raise exception 'Invalid auth rate limit key'; end if;
  delete from public.auth_rate_limit_buckets where key = p_key;
end;
$$;

revoke all on function public.check_auth_rate_limit(text) from public, anon, authenticated;
revoke all on function public.record_auth_failure(text, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.clear_auth_failures(text) from public, anon, authenticated;
grant execute on function public.check_auth_rate_limit(text) to service_role;
grant execute on function public.record_auth_failure(text, integer, integer, integer) to service_role;
grant execute on function public.clear_auth_failures(text) to service_role;
