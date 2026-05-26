-- Run in Supabase → SQL Editor (one time)
create table if not exists public.appointments (
  id text primary key,
  client_phone text not null default '',
  user_id text not null default 'guest',
  doc jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists appointments_phone_idx on public.appointments (client_phone);
create index if not exists appointments_created_idx on public.appointments (created_at desc);
