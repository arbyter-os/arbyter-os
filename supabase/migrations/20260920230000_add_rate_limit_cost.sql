create or replace function public.check_rate_limit_cost(
  p_key text,
  p_cost integer,
  p_limit integer,
  p_window_seconds integer
)
returns table(
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  now_at timestamptz := pg_catalog.clock_timestamp();
  bucket_count integer;
  bucket_reset_at timestamptz;
begin
  if p_key is null
     or pg_catalog.length(p_key) = 0
     or p_cost <= 0
     or p_limit <= 0
     or p_window_seconds <= 0 then
    raise exception 'Invalid rate limit parameters';
  end if;

  if p_cost > p_limit then
    raise exception 'Rate limit cost exceeds bucket limit';
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
    set count = p_cost,
        reset_at = now_at + pg_catalog.make_interval(secs => p_window_seconds)
    where key = p_key;

    return query
    select
      true,
      case
        when p_limit - p_cost > 0 then p_limit - p_cost
        else 0
      end,
      0;

    return;
  end if;

  if bucket_count > p_limit - p_cost then
    return query
    select
      false,
      case
        when p_limit - bucket_count > 0 then p_limit - bucket_count
        else 0
      end,
      case
        when pg_catalog.ceil(
          extract(epoch from (bucket_reset_at - now_at))
        )::integer > 1
        then pg_catalog.ceil(
          extract(epoch from (bucket_reset_at - now_at))
        )::integer
        else 1
      end;

    return;
  end if;

  update public.rate_limit_buckets
  set count = bucket_count + p_cost
  where key = p_key;

  return query
  select
    true,
    case
      when p_limit - bucket_count - p_cost > 0
      then p_limit - bucket_count - p_cost
      else 0
    end,
    0;
end;
$function$;

revoke all on function public.check_rate_limit_cost(text, integer, integer, integer)
from public, anon, authenticated;

grant execute on function public.check_rate_limit_cost(text, integer, integer, integer)
to service_role;