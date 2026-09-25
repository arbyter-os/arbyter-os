-- P0-3: approval expiration lifecycle.
--
-- Lifecycle (enforced at the application security boundaries in
-- app/api/approvals/[approvalId]/resolve/route.ts and
-- app/api/approvals/[approvalId]/resume/route.ts):
--
--   pending  -> approved   (owner/admin resolves; requester cannot self-approve)
--   pending  -> rejected   (owner/admin resolves; terminal)
--   pending  -> expired    (expires_at passed; set lazily by the resolve/resume
--                           boundaries; terminal — must never execute)
--   approved -> consumed   (the approved execution completed exactly once via
--                           the resume boundary; terminal — replay impossible)
--   approved -> expired    (expires_at passed before resume; terminal)
--   approved -> running    (existing conditional claim on agent_executions)
--
-- expires_at is ABSOLUTE, set once at approval creation (see
-- lib/execution/approval.ts: requested_at + 24h TTL). Resolution does not
-- extend it: an approval that expires before it is resumed can never execute
-- (TTL -> deny, fail-closed).

begin;

alter table public.approval_requests
  add column if not exists expires_at timestamptz;

-- Backfill: every approval that predates this migration gets a window of
-- 7 days from requested_at. Pending rows already older than that become
-- expired-in-place on first touch by the resolve/resume boundaries.
update public.approval_requests
set expires_at = requested_at + interval '7 days'
where expires_at is null;

alter table public.approval_requests
  alter column expires_at set not null;

-- Extend the status lifecycle. The original check constraint was created
-- inline (auto-generated name), so locate and drop it by definition.
do $$
declare
  constraint_name text;
begin
  select c.conname
  into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.oid = 'public.approval_requests'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ~* 'check \(\(?(status)';
  if constraint_name is not null then
    execute format('alter table public.approval_requests drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.approval_requests
  add constraint approval_requests_status_check
  check (status in ('pending', 'approved', 'rejected', 'expired', 'consumed'));

-- Expiry sweeps and boundary lookups filter on (status, expires_at).
create index if not exists approval_requests_expiry_idx
  on public.approval_requests (status, expires_at);

commit;
