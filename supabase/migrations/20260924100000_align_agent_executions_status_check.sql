-- Reconcile the agent_executions status check constraint with the statuses the
-- application actually persists.
--
-- Evidence (Stage 4 replay, .stage4/FINDINGS.md D-2): lib/execution/audit.ts
-- writes 'blocked', 'awaiting_approval' and 'flagged' after governance
-- interdictions, but the previous constraint accepted only
-- started/running/completed/failed/cancelled. Every governed interdiction
-- therefore violated the constraint, the audit update failed, and the request
-- surfaced as HTTP 500 with the execution row stuck at 'failed'.

alter table public.agent_executions
  drop constraint agent_executions_status_check;

alter table public.agent_executions
  add constraint agent_executions_status_check
  check (
    status = any (array[
      'started'::text,
      'running'::text,
      'completed'::text,
      'failed'::text,
      'cancelled'::text,
      'blocked'::text,
      'awaiting_approval'::text,
      'flagged'::text
    ])
  );
