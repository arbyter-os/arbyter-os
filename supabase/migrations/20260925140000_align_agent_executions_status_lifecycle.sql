-- F1 (approval/execution state machine alignment, part 2):
-- app/api/approvals/[approvalId]/resolve/route.ts marks the interdicted
-- execution as 'approved' when an owner/admin approves the request. The
-- agent_executions CHECK constraint (20260924100000) does not contain
-- 'approved', so the production database rejects the write (23514) and the
-- resolve happy path 500s. This migration adds the missing state so the
-- production database and the application state machine agree.
--
-- 'approved' means: an owner/admin resolved the linked approval with
-- decision = approved and the execution is waiting for the resume boundary.
-- It is NOT terminal: only the resume boundary may move it forward.

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
      'flagged'::text,
      'approved'::text
    ])
  );
