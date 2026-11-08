-- DRAFT ONLY. Do not run this file on production.
-- It is not part of a deployment. The planner flag SMART_WORK_SCHEDULER stays false.
-- No existing crm_store or appointments rows are copied or updated.
--
-- Rollback after an accidental test-database run:
--   drop table if exists public.scheduler_actuals;
--   drop table if exists public.scheduler_holds;
--   drop table if exists public.scheduler_overlap_rules;
--   drop table if exists public.scheduler_operations;
-- Existing appointments, clients, work orders and the Telegram bot stay untouched.

create table if not exists public.scheduler_operations (
  operation_code text primary key,
  operation_name_ru text not null,
  operation_name_pl text not null,
  category text not null,
  base_labor_hours numeric,
  min_labor_hours numeric,
  max_labor_hours numeric,
  reference_calendar_minutes integer,
  required_resources text[] not null default '{}',
  booking_mode text not null check (booking_mode in ('AUTO', 'APPROVAL', 'MANUAL')),
  overlap_group text not null default '',
  source text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduler_overlap_rules (
  rule_id text primary key,
  primary_operations text[] not null,
  secondary_operations text[] not null,
  result_operation text,
  shared_disassembly_minutes integer,
  approved_by text,
  version integer not null default 1,
  active boolean not null default false
);

create table if not exists public.scheduler_holds (
  id text primary key,
  appointment_id text,
  work_order_id text,
  mechanic_id text not null default '',
  operation_code text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  active boolean not null default true,
  idempotency_key text,
  version integer not null default 1,
  check (start_at < end_at)
);

create table if not exists public.scheduler_resource_holds (
  hold_id text not null references public.scheduler_holds(id) on delete cascade,
  resource_id text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  active boolean not null default true,
  primary key (hold_id, resource_id),
  check (start_at < end_at)
);

create table if not exists public.scheduler_breaks (
  mechanic_id text not null,
  starts_at time not null,
  ends_at time not null,
  primary key (mechanic_id, starts_at),
  check (starts_at < ends_at)
);

-- Requires btree_gist on the TEST database only.
-- Two concurrent inserts for one mechanic or one resource fail instead of double-booking.
create extension if not exists btree_gist;

alter table public.scheduler_holds
  add constraint scheduler_mechanic_no_overlap
  exclude using gist (
    mechanic_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (active and mechanic_id <> '');

alter table public.scheduler_resource_holds
  add constraint scheduler_resource_no_overlap
  exclude using gist (
    resource_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (active);

create table if not exists public.scheduler_actuals (
  id text primary key,
  operation_code text not null,
  mechanic_id text,
  actual_started_at timestamptz,
  actual_ended_at timestamptz,
  pause_minutes integer not null default 0,
  reason text not null default '',
  approved_by text,
  version integer not null default 1
);

alter table public.scheduler_operations enable row level security;
alter table public.scheduler_overlap_rules enable row level security;
alter table public.scheduler_holds enable row level security;
alter table public.scheduler_resource_holds enable row level security;
alter table public.scheduler_breaks enable row level security;
alter table public.scheduler_actuals enable row level security;

revoke all on table public.scheduler_operations from anon, authenticated;
revoke all on table public.scheduler_overlap_rules from anon, authenticated;
revoke all on table public.scheduler_holds from anon, authenticated;
revoke all on table public.scheduler_resource_holds from anon, authenticated;
revoke all on table public.scheduler_breaks from anon, authenticated;
revoke all on table public.scheduler_actuals from anon, authenticated;

-- No policies for anon or authenticated. service_role is the only server path.
-- Do not grant select/insert/update/delete to anon or authenticated.
