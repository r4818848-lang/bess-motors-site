-- Full CRM snapshot (clients, work orders, expenses, warehouse, …). Run once in SQL Editor.
create table if not exists public.crm_store (
  id text primary key default 'main',
  doc jsonb not null,
  updated_at timestamptz not null default now()
);
