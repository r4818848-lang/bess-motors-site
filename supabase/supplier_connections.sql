-- Server-only supplier connection secrets (encrypted at app layer with AES-256-GCM).
-- Run once in Supabase SQL Editor. Never expose this table via anon key / RLS for clients.

create table if not exists public.supplier_connections (
  supplier_id text primary key,
  status text not null default 'not_configured',
  login_encrypted text,
  password_encrypted text,
  extra_encrypted text,
  session_meta_encrypted text,
  last_success_at timestamptz,
  last_checked_at timestamptz,
  last_error text,
  environment text,
  updated_at timestamptz not null default now()
);

alter table public.supplier_connections enable row level security;

-- No policies for anon/authenticated — only service_role (used by Next.js server) can access.

comment on table public.supplier_connections is
  'BESS MOTORS ERP — encrypted supplier credentials; passwords never returned to frontend';
