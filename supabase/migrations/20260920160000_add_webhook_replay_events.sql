create table if not exists public.webhook_replay_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  agent_connection_id uuid not null references public.agent_connections(id) on delete cascade,
  replay_key text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint webhook_replay_events_connection_key unique (agent_connection_id, replay_key)
);

create index if not exists webhook_replay_events_expires_at_idx
  on public.webhook_replay_events (expires_at);

alter table public.webhook_replay_events enable row level security;
