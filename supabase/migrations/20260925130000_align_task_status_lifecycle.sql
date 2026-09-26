-- F1 (approval/execution state machine alignment, part 1):
-- lib/execution/engine.ts records approval interdictions on the task row as
-- 'awaiting_approval' (governance decision REQUIRE_APPROVAL) and 'flagged'
-- (governance decision FLAG). The tasks CHECK constraint added in
-- 20260922100000 only accepted ('pending', 'running', 'completed', 'blocked'),
-- so every governed interdiction on a task-bearing execution violated the
-- constraint, the status update failed, and the request surfaced as an
-- infrastructure error. Extend the lifecycle to match the application state
-- machine (additive only; no existing status is removed or renamed).

alter table public.tasks
  drop constraint tasks_status_check;

alter table public.tasks
  add constraint tasks_status_check
  check (status in (
    'pending',
    'running',
    'completed',
    'blocked',
    'awaiting_approval',
    'flagged'
  ));
