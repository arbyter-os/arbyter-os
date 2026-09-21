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
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_reset_at timestamptz;
  v_count integer;
begin
  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.rate_limit_buckets (
    key,
    count,
    reset_at
  )
  values (
    p_key,
    1,
    v_now + pg_catalog.make_interval(secs => p_window_seconds)
  )
  on conflict (key)
  do update set
    count = case
      when public.rate_limit_buckets.reset_at <= v_now
      then 1
      else public.rate_limit_buckets.count + 1
    end,
    reset_at = case
      when public.rate_limit_buckets.reset_at <= v_now
      then v_now + pg_catalog.make_interval(secs => p_window_seconds)
      else public.rate_limit_buckets.reset_at
    end;

  select
    b.reset_at,
    b.count
  into
    v_reset_at,
    v_count
  from public.rate_limit_buckets b
  where b.key = p_key;

  if v_count <= p_limit then
    return query
    select
      true,
      case
        when p_limit - v_count > 0 then p_limit - v_count
        else 0
      end,
      0;
  else
    return query
    select
      false,
      0,
      case
        when extract(epoch from (v_reset_at - v_now)) > 0
        then extract(epoch from (v_reset_at - v_now))::integer
        else 0
      end;
  end if;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer)
from public, anon, authenticated;

grant execute on function public.check_rate_limit(text, integer, integer)
to service_role;
