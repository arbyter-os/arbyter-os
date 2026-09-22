create or replace function public.check_auth_rate_limit(
  p_key text
)
returns table(
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_next_allowed timestamptz;
  v_retry integer;
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

  v_retry := pg_catalog.ceil(
    extract(epoch from (v_next_allowed - v_now))
  )::integer;

  if v_retry < 1 then
    v_retry := 1;
  end if;

  return query
    select false, v_retry;
end;
$function$;

revoke all on function public.check_auth_rate_limit(text)
from public, anon, authenticated;

grant execute on function public.check_auth_rate_limit(text)
to service_role;


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
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_base_ms integer;
  v_max_ms integer;
  v_failures integer;
  v_delay_ms bigint;
  v_exponent integer;
begin
  if p_key is null or pg_catalog.length(p_key) = 0 then
    raise exception 'Invalid auth rate limit key';
  end if;

  if p_base_ms > 1 then
    v_base_ms := p_base_ms;
  else
    v_base_ms := 1;
  end if;

  if p_max_ms > v_base_ms then
    v_max_ms := p_max_ms;
  else
    v_max_ms := v_base_ms;
  end if;

  insert into public.auth_rate_limit_buckets as b
    (key, failures, next_allowed_at, updated_at)
  values
    (p_key, 1, v_now, v_now)
  on conflict (key) do update
    set failures =
      case
        when b.failures + 1 < 31 then b.failures + 1
        else 31
      end,
      updated_at = v_now
  returning b.failures into v_failures;

  if v_failures <= p_threshold then
    v_delay_ms := 0;
  else
    v_exponent := v_failures - p_threshold - 1;

    if v_exponent < 0 then
      v_exponent := 0;
    end if;

    v_delay_ms := (
      v_base_ms::numeric
      * pg_catalog.power(2::numeric, v_exponent)
    )::bigint;

    if v_delay_ms < v_base_ms::bigint then
      v_delay_ms := v_base_ms::bigint;
    end if;

    if v_delay_ms > v_max_ms::bigint then
      v_delay_ms := v_max_ms::bigint;
    end if;
  end if;

  update public.auth_rate_limit_buckets b
  set next_allowed_at =
    v_now + pg_catalog.make_interval(
      secs => v_delay_ms / 1000.0
    )
  where b.key = p_key;

  if pg_catalog.random() < 0.01 then
    delete from public.auth_rate_limit_buckets b
    where b.updated_at < v_now - interval '24 hours'
      and b.next_allowed_at <= v_now;
  end if;
end;
$function$;

revoke all on function public.record_auth_failure(text, integer, integer, integer)
from public, anon, authenticated;

grant execute on function public.record_auth_failure(text, integer, integer, integer)
to service_role;


create or replace function public.clear_auth_failures(
  p_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_key is null or pg_catalog.length(p_key) = 0 then
    raise exception 'Invalid auth rate limit key';
  end if;

  delete from public.auth_rate_limit_buckets b
  where b.key = p_key;
end;
$function$;

revoke all on function public.clear_auth_failures(text)
from public, anon, authenticated;

grant execute on function public.clear_auth_failures(text)
to service_role;