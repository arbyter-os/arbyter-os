-- P1-2/P1-3 (rate-limit / abuse-resistance audit): organization-wide
-- execution quotas.
--
-- The per-user limits enforced by proxy.ts bound one account, not one
-- organization: N privileged members sum linearly (30+10+10+10+10 requests
-- per minute per member across the five execution-bearing entry routes), and
-- every one of those requests fans out into Gemini calls, credential vault
-- decryptions, governance evaluations, external AgentMail sends, and
-- execution/audit row growth. This migration adds the shared
-- organization-level buckets consumed by the execution engine (the single
-- choke point for all four direct execution routes) and by the approval
-- resume boundary.
--
-- Two buckets per organization per window:
--   exec:{org}   — execution-bearing requests (execute, connectors/execute,
--                  tasks/execute, tasks/:id/execute, approvals resume)
--   mail:{org}   — AgentMail sends (shared provider account resource;
--                  protects the sender identity/reputation for everyone)
--
-- Uses the existing distributed fixed-window limiter (rate_limit_buckets +
-- atomic RPC, correct across serverless instances, fail-closed consumers).
-- Limits default to the audit-proposed 30 exec/min/org and 20 mail/min/org
-- and are env-tunable.

create or replace function public.check_org_execution_quota(
  p_organization_id uuid,
  p_requested integer default 1
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_result record;
begin
  if p_organization_id is null then
    raise exception 'Organization quota requires an organization id';
  end if;

  select allowed into v_result
  from public.check_rate_limit_cost(
    'exec:' || p_organization_id::text,
    greatest(1, p_requested),
    coalesce(
      nullif(current_setting('app.org_execution_quota', true), '')::int,
      30
    ),
    60
  );

  if v_result.allowed then
    return 0;
  end if;
  return 1;
end;
$function$;

create or replace function public.check_org_mail_quota(
  p_organization_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_result record;
begin
  if p_organization_id is null then
    raise exception 'Mail quota requires an organization id';
  end if;

  select allowed into v_result
  from public.check_rate_limit_cost(
    'mail:' || p_organization_id::text,
    1,
    coalesce(
      nullif(current_setting('app.org_mail_quota', true), '')::int,
      20
    ),
    60
  );

  if v_result.allowed then
    return 0;
  end if;
  return 1;
end;
$function$;

revoke all on function public.check_org_execution_quota(uuid, integer) from public, anon, authenticated;
revoke all on function public.check_org_mail_quota(uuid) from public, anon, authenticated;
grant execute on function public.check_org_execution_quota(uuid, integer) to service_role;
grant execute on function public.check_org_mail_quota(uuid) to service_role;
