-- Create relations that exist in the application model but were never
-- materialized in environments deployed before the September 2026 hardening
-- campaign. Everything here is additive: new tables only, no drops, no
-- column changes to existing tables.
--
-- These relations are required by code already on main:
--   governance_policies, governance_policy_rules   (app/api/governance/*,
--                                                   lib/governance/rule-loader.ts)
--   governance_decisions, policy_evaluations       (lib/governance/audit.ts)
--   regulatory_sources, regulatory_requirements    (lib/governance/regulatory-library.ts)
--   governance_rule_requirements                   (lib/governance/regulatory-mapper.ts)
--   policy_assignments                             (lib/orchestrator/governance.ts)
--
-- The follow-up migration 20260921240000_harden_governance_rls.sql expects
-- these tables to exist. It replaces policies on the six governance tables
-- with the full least-privilege set; that migration does not manage
-- regulatory_sources or policy_assignments, so the read policies those
-- relations need are created here and kept here.
--
-- Tables are created with RLS enabled. The six governance tables ship with no
-- policies until 20260921240000 installs the hardened set (fail-closed in the
-- interim; rows are only reachable through the service role, which is how
-- lib/governance/audit.ts writes).

begin;

create table if not exists public.governance_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  policy_type text not null default 'company',
  status text not null default 'active',
  version text not null default '1.0',
  effective_date date,
  review_date date,
  effective_from timestamptz,
  effective_until timestamptz,
  source_type text not null default 'company',
  authority text,
  jurisdiction text,
  sector text,
  source_reference text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists governance_policies_organization_idx
  on public.governance_policies (organization_id, status);

create table if not exists public.governance_policy_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  policy_id uuid not null references public.governance_policies(id) on delete cascade,
  name text not null,
  description text,
  rule_type text,
  effect text,
  conditions jsonb not null default '{}'::jsonb,
  priority integer not null default 0,
  enabled boolean not null default true,
  version text,
  scope jsonb not null default '{}'::jsonb,
  exceptions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists governance_policy_rules_policy_idx
  on public.governance_policy_rules (policy_id, priority);
create index if not exists governance_policy_rules_organization_idx
  on public.governance_policy_rules (organization_id, enabled);

create table if not exists public.governance_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid references public.ai_agents(id) on delete set null,
  agent_connection_id uuid references public.agent_connections(id) on delete set null,
  execution_id uuid references public.agent_executions(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  decision text not null,
  risk_level text not null default 'medium',
  reason text,
  policy_id uuid,
  decided_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists governance_decisions_organization_idx
  on public.governance_decisions (organization_id, decided_at desc);
create index if not exists governance_decisions_execution_idx
  on public.governance_decisions (execution_id);

create table if not exists public.policy_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid references public.ai_agents(id) on delete set null,
  execution_id uuid references public.agent_executions(id) on delete set null,
  governance_decision_id uuid references public.governance_decisions(id) on delete cascade,
  policy_id uuid,
  policy_rule_id uuid,
  result text not null,
  risk_level text not null default 'medium',
  explanation text,
  evaluation_context jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now()
);

create index if not exists policy_evaluations_decision_idx
  on public.policy_evaluations (governance_decision_id);
create index if not exists policy_evaluations_organization_idx
  on public.policy_evaluations (organization_id, evaluated_at desc);

-- Shared, non-tenant regulatory reference library (parent of
-- regulatory_requirements). Read-only to authenticated clients.
create table if not exists public.regulatory_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  authority text not null,
  jurisdiction text not null,
  country text,
  state text,
  sector text,
  source_url text,
  source_reference text,
  status text not null default 'active',
  version text,
  effective_from timestamptz,
  effective_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_requirements (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.regulatory_sources(id) on delete cascade,
  requirement_code text,
  title text not null,
  description text not null,
  control_objective text,
  severity text not null default 'medium',
  version text,
  effective_from timestamptz,
  effective_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists regulatory_requirements_source_idx
  on public.regulatory_requirements (source_id);

create table if not exists public.governance_rule_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_id uuid not null references public.governance_policy_rules(id) on delete cascade,
  requirement_id uuid not null references public.regulatory_requirements(id) on delete cascade,
  relationship text not null default 'maps_to',
  created_at timestamptz not null default now()
);

create index if not exists governance_rule_requirements_rule_idx
  on public.governance_rule_requirements (rule_id);
create index if not exists governance_rule_requirements_requirement_idx
  on public.governance_rule_requirements (requirement_id);

create table if not exists public.policy_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid not null references public.ai_agents(id) on delete cascade,
  policy_id uuid not null references public.governance_policies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (agent_id, policy_id)
);

create index if not exists policy_assignments_agent_idx
  on public.policy_assignments (agent_id);

-- Row level security on every new relation.
alter table public.governance_policies enable row level security;
alter table public.governance_policy_rules enable row level security;
alter table public.governance_decisions enable row level security;
alter table public.policy_evaluations enable row level security;
alter table public.regulatory_sources enable row level security;
alter table public.regulatory_requirements enable row level security;
alter table public.governance_rule_requirements enable row level security;
alter table public.policy_assignments enable row level security;

-- The six governance relations receive their full least-privilege policy set
-- from 20260921240000_harden_governance_rls.sql. Until that migration runs in
-- the same chain they are intentionally policyless (fail-closed: the client
-- role sees nothing; the service role, which the audit writer uses, is
-- unaffected by RLS).

-- Shared regulatory reference data: readable by any authenticated member,
-- never writable through the client role (matches the policy applied to
-- regulatory_requirements by 20260921240000).
drop policy if exists "Authenticated users can read regulatory sources" on public.regulatory_sources;
create policy "Authenticated users can read regulatory sources"
  on public.regulatory_sources
  for select
  to authenticated
  using ((select auth.uid()) is not null);

-- Policy assignments are tenant-owned governance configuration: readable
-- within the organization, writable only by owner/admin sessions, matching
-- the governance hardening model.
drop policy if exists "Authenticated users can read organization policy assignments" on public.policy_assignments;
create policy "Authenticated users can read organization policy assignments"
  on public.policy_assignments
  for select
  to authenticated
  using (organization_id = public.get_user_organization_id());

drop policy if exists "Owners and admins can create organization policy assignments" on public.policy_assignments;
create policy "Owners and admins can create organization policy assignments"
  on public.policy_assignments
  for insert
  to authenticated
  with check (
    public.is_current_user_org_admin()
    and organization_id = public.get_user_organization_id()
  );

drop policy if exists "Owners and admins can delete organization policy assignments" on public.policy_assignments;
create policy "Owners and admins can delete organization policy assignments"
  on public.policy_assignments
  for delete
  to authenticated
  using (
    public.is_current_user_org_admin()
    and organization_id = public.get_user_organization_id()
  );

commit;
