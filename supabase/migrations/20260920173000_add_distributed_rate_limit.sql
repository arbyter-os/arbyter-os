create table if not exists public.rate_limit_buckets (
  key text primary key,
  count integer not null,
  reset_at timestamptz not null
);

alter table public.rate_limit_buckets enable row level security;

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  now_at timestamptz := clock_timestamp();
  bucket_count integer;
  bucket_reset_at timestamptz;
begin
  if p_key is null or length(p_key) = 0 or p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.rate_limit_buckets (key, count, reset_at)
  values (p_key, 0, now_at)
  on conflict (key) do nothing;

  select b.count, b.reset_at
    into bucket_count, bucket_reset_at
    from public.rate_limit_buckets b
   where b.key = p_key
   for update;

  if bucket_reset_at <= now_at then
    update public.rate_limit_buckets
       set count = 1,
           reset_at = now_at + make_interval(secs => p_window_seconds)
     where key = p_key;

    return query select true, greatest(0, p_limit - 1), 0;
    return;
  end if;

  if bucket_count >= p_limit then
    return query select false, 0,
      greatest(1, ceil(extract(epoch from (bucket_reset_at - now_at)))::integer);
    return;
  end if;

  update public.rate_limit_buckets
     set count = bucket_count + 1
   where key = p_key;

  return query select true, greatest(0, p_limit - bucket_count - 1), 0;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
revoke all on function public.check_rate_limit(text, integer, integer) from anon;
revoke all on function public.check_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
