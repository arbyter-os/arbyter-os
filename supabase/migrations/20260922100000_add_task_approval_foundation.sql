begin;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'blocked')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_organization_status_idx
  on public.tasks (organization_id, status);

create index if not exists tasks_organization_created_at_idx
  on public.tasks (organization_id, created_at desc);

create index if not exists tasks_created_by_idx
  on public.tasks (created_by);

create table if not exists public.agent_tasks (
  task_id uuid not null references public.tasks(id) on delete cascade,
  agent_id uuid not null references public.ai_agents(id) on delete cascade,
  primary key (task_id, agent_id)
);

create index if not exists agent_tasks_agent_id_idx
  on public.agent_tasks (agent_id);

alter table public.agent_executions
  add column if not exists task_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agent_executions_task_id_fkey'
      and conrelid = 'public.agent_executions'::regclass
  ) then
    alter table public.agent_executions
      add constraint agent_executions_task_id_fkey
      foreign key (task_id)
      references public.tasks(id)
      on delete set null;
  end if;
end
$$;

create index if not exists agent_executions_task_id_idx
  on public.agent_executions (task_id);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid references public.ai_agents(id) on delete set null,
  execution_id uuid references public.agent_executions(id) on delete set null,
  governance_decision_id uuid,
  task_id uuid references public.tasks(id) on delete set null,
  requested_by uuid references public.users(id) on delete set null,
  assigned_to uuid references public.users(id) on delete set null,
  title text not null default 'Approval required',
  description text,
  risk_level text not null default 'medium'
    check (risk_level in ('low', 'medium', 'high', 'critical')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  decision_note text,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists approval_requests_organization_status_idx
  on public.approval_requests (organization_id, status, requested_at desc);

create index if not exists approval_requests_execution_id_idx
  on public.approval_requests (execution_id);

create index if not exists approval_requests_task_id_idx
  on public.approval_requests (task_id);

create index if not exists approval_requests_requested_by_idx
  on public.approval_requests (requested_by);

alter table public.tasks enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.approval_requests enable row level security;

drop policy if exists tasks_select_same_org on public.tasks;
create policy tasks_select_same_org on public.tasks
for select to authenticated
using (organization_id = public.get_user_organization_id());

drop policy if exists tasks_insert_same_org on public.tasks;
create policy tasks_insert_same_org on public.tasks
for insert to authenticated
with check (
  organization_id = public.get_user_organization_id()
  and created_by = auth.uid()
);

drop policy if exists tasks_update_same_org on public.tasks;
create policy tasks_update_same_org on public.tasks
for update to authenticated
using (organization_id = public.get_user_organization_id())
with check (organization_id = public.get_user_organization_id());

drop policy if exists tasks_delete_same_org on public.tasks;
create policy tasks_delete_same_org on public.tasks
for delete to authenticated
using (organization_id = public.get_user_organization_id());

drop policy if exists agent_tasks_select_same_org on public.agent_tasks;
create policy agent_tasks_select_same_org on public.agent_tasks
for select to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.ai_agents a on a.id = agent_tasks.agent_id
    where t.id = agent_tasks.task_id
      and t.organization_id = public.get_user_organization_id()
      and a.organization_id = public.get_user_organization_id()
  )
);

drop policy if exists agent_tasks_insert_same_org on public.agent_tasks;
create policy agent_tasks_insert_same_org on public.agent_tasks
for insert to authenticated
with check (
  exists (
    select 1
    from public.tasks t
    join public.ai_agents a on a.id = agent_tasks.agent_id
    where t.id = agent_tasks.task_id
      and t.organization_id = public.get_user_organization_id()
      and a.organization_id = public.get_user_organization_id()
  )
);

drop policy if exists agent_tasks_delete_same_org on public.agent_tasks;
create policy agent_tasks_delete_same_org on public.agent_tasks
for delete to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.ai_agents a on a.id = agent_tasks.agent_id
    where t.id = agent_tasks.task_id
      and t.organization_id = public.get_user_organization_id()
      and a.organization_id = public.get_user_organization_id()
  )
);

drop policy if exists approval_requests_select_same_org on public.approval_requests;
create policy approval_requests_select_same_org on public.approval_requests
for select to authenticated
using (organization_id = public.get_user_organization_id());

drop policy if exists approval_requests_insert_same_org on public.approval_requests;
create policy approval_requests_insert_same_org on public.approval_requests
for insert to authenticated
with check (
  organization_id = public.get_user_organization_id()
  and requested_by = auth.uid()
);

drop policy if exists approval_requests_update_privileged on public.approval_requests;
create policy approval_requests_update_privileged on public.approval_requests
for update to authenticated
using (
  organization_id = public.get_user_organization_id()
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id = organization_id
      and u.role in ('owner', 'admin')
  )
)
with check (
  organization_id = public.get_user_organization_id()
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.organization_id = organization_id
      and u.role in ('owner', 'admin')
  )
);

commit;
