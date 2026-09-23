create table if not exists public.connector_execution_idempotency (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  idempotency_key text not null,
  request_hash text not null,
  execution_id uuid,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint connector_execution_idempotency_key unique (organization_id, idempotency_key)
);

create index if not exists connector_execution_idempotency_expires_at_idx
  on public.connector_execution_idempotency (expires_at);

alter table public.connector_execution_idempotency enable row level security;
