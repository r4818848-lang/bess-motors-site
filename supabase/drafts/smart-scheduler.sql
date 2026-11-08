-- DRAFT ONLY. Do not run this file on production or on any Supabase project.
-- Local test database name must be bess_scheduler_test.
-- Future pilot: backup the existing Supabase project, then apply only these scheduler_* tables there.
-- Do not create a second production database. Keep bess_scheduler_test separate.
-- Rollback is supabase/drafts/smart-scheduler-rollback.sql. It does not touch crm_store or appointments.

create extension if not exists btree_gist;

do $$ begin
  create role scheduler_anon nologin;
exception when duplicate_object then null;
end $$;

do $$ begin
  create role scheduler_staff nologin nobypassrls;
exception when duplicate_object then null;
end $$;

do $$ begin
  create role scheduler_mechanic nologin nobypassrls;
exception when duplicate_object then null;
end $$;

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

create table if not exists public.scheduler_resources (
  id text primary key,
  kind text not null,
  label text not null,
  status text not null check (status in ('available', 'broken', 'maintenance')),
  confirmed boolean not null default false
);

create table if not exists public.scheduler_display_names (
  mechanic_id text primary key,
  display_name text not null
);

create table if not exists public.scheduler_shifts (
  mechanic_id text primary key,
  shift_start time,
  shift_end time
);

create table if not exists public.scheduler_time_off (
  id text primary key,
  mechanic_id text not null,
  starts_on date not null,
  ends_on date not null,
  kind text not null check (kind in ('vacation', 'absent')),
  check (starts_on <= ends_on)
);

create table if not exists public.scheduler_breaks (
  mechanic_id text not null,
  starts_at time not null,
  ends_at time not null,
  primary key (mechanic_id, starts_at),
  check (starts_at < ends_at)
);

create table if not exists public.scheduler_reservations (
  id text primary key,
  idempotency_key text not null unique,
  request_fingerprint text not null,
  appointment_id text,
  work_order_id text,
  operation_code text not null,
  mechanic_id text not null,
  parts_status text not null,
  version integer not null default 1,
  confirmed_by text,
  confirmed_at timestamptz,
  confirmed_minutes integer,
  active boolean not null default true
);

create table if not exists public.scheduler_approvals (
  id text primary key,
  operation_code text not null,
  mechanic_id text not null,
  work_date date not null,
  start_clock text not null,
  minutes integer not null,
  confirmed_by text not null,
  confirmed_role text not null check (confirmed_role in ('owner', 'admin')),
  confirmed_at timestamptz not null default now(),
  consumed_by text
);

create unique index if not exists scheduler_approval_open
  on public.scheduler_approvals (operation_code, mechanic_id, work_date, start_clock, minutes)
  where consumed_by is null;

create table if not exists public.scheduler_crm_occupancy (
  id text primary key,
  appointment_id text not null,
  mechanic_id text not null,
  resource_id text not null default '',
  start_at timestamptz not null,
  end_at timestamptz not null,
  active boolean not null default true,
  check (start_at < end_at)
);

create table if not exists public.scheduler_holds (
  id text primary key,
  reservation_id text not null references public.scheduler_reservations(id),
  mechanic_id text not null,
  operation_code text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  active boolean not null default true,
  check (start_at < end_at)
);

create table if not exists public.scheduler_resource_holds (
  hold_id text not null references public.scheduler_holds(id) on delete cascade,
  resource_id text not null references public.scheduler_resources(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  active boolean not null default true,
  primary key (hold_id, resource_id),
  check (start_at < end_at)
);

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

do $$ begin
  alter table public.scheduler_holds
    add constraint scheduler_mechanic_no_overlap
    exclude using gist (
      mechanic_id with =,
      tstzrange(start_at, end_at, '[)') with &&
    ) where (active and mechanic_id <> '');
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.scheduler_resource_holds
    add constraint scheduler_resource_no_overlap
    exclude using gist (
      resource_id with =,
      tstzrange(start_at, end_at, '[)') with &&
    ) where (active);
exception when duplicate_object then null;
end $$;

create or replace function public.scheduler_lock_workshop() returns void
language plpgsql as $$
begin
  -- One workshop lock for scheduler holds and, later, the existing calendar write.
  perform pg_advisory_xact_lock(874213);
end $$;

create or replace function public.scheduler_guard_reservation() returns trigger
language plpgsql as $$
declare
  actor_role text := current_setting('app.actor_role', true);
  actor_mechanic text := current_setting('app.actor_mechanic', true);
begin
  if actor_role in ('owner', 'admin') then
    return new;
  end if;
  if actor_role = 'mechanic' and actor_mechanic <> '' and new.mechanic_id = actor_mechanic
     and (tg_op = 'INSERT' or old.mechanic_id = actor_mechanic) then
    return new;
  end if;
  raise exception 'forbidden_reservation' using errcode = '42501';
end $$;

drop trigger if exists scheduler_guard_reservation on public.scheduler_reservations;
create trigger scheduler_guard_reservation
before insert or update on public.scheduler_reservations
for each row execute function public.scheduler_guard_reservation();

create or replace function public.scheduler_reject_crm_mechanic() returns trigger
language plpgsql as $$
begin
  if new.active and exists (
    select 1 from public.scheduler_crm_occupancy crm
    where crm.active and crm.mechanic_id = new.mechanic_id
      and tstzrange(crm.start_at, crm.end_at, '[)') && tstzrange(new.start_at, new.end_at, '[)')
  ) then
    raise exception 'crm_overlap' using errcode = '23P01';
  end if;
  return new;
end $$;

drop trigger if exists scheduler_reject_crm_mechanic on public.scheduler_holds;
create trigger scheduler_reject_crm_mechanic
before insert or update on public.scheduler_holds
for each row execute function public.scheduler_reject_crm_mechanic();

create or replace function public.scheduler_reject_crm_resource() returns trigger
language plpgsql as $$
begin
  if new.active and exists (
    select 1 from public.scheduler_crm_occupancy crm
    where crm.active and crm.resource_id <> '' and crm.resource_id = new.resource_id
      and tstzrange(crm.start_at, crm.end_at, '[)') && tstzrange(new.start_at, new.end_at, '[)')
  ) then
    raise exception 'crm_overlap' using errcode = '23P01';
  end if;
  return new;
end $$;

drop trigger if exists scheduler_reject_crm_resource on public.scheduler_resource_holds;
create trigger scheduler_reject_crm_resource
before insert or update on public.scheduler_resource_holds
for each row execute function public.scheduler_reject_crm_resource();

insert into public.scheduler_resources (id, kind, label, status, confirmed) values
  ('lift-1', 'lift', 'Подъёмник 1', 'maintenance', false),
  ('lift-2', 'lift', 'Подъёмник 2', 'maintenance', false),
  ('tyre-1', 'tyre_machine', 'Шиномонтажный станок', 'maintenance', false),
  ('balancer-1', 'balancer', 'Балансировочный станок', 'maintenance', false),
  ('ac-1', 'ac_station', 'Станция кондиционера', 'maintenance', false),
  ('diag-1', 'diagnostic_device', 'Диагностическое оборудование', 'maintenance', false)
on conflict (id) do nothing;

alter table public.scheduler_operations enable row level security;
alter table public.scheduler_overlap_rules enable row level security;
alter table public.scheduler_resources enable row level security;
alter table public.scheduler_display_names enable row level security;
alter table public.scheduler_shifts enable row level security;
alter table public.scheduler_time_off enable row level security;
alter table public.scheduler_breaks enable row level security;
alter table public.scheduler_reservations enable row level security;
alter table public.scheduler_holds enable row level security;
alter table public.scheduler_resource_holds enable row level security;
alter table public.scheduler_actuals enable row level security;
alter table public.scheduler_approvals enable row level security;
alter table public.scheduler_crm_occupancy enable row level security;

alter table public.scheduler_operations force row level security;
alter table public.scheduler_overlap_rules force row level security;
alter table public.scheduler_resources force row level security;
alter table public.scheduler_display_names force row level security;
alter table public.scheduler_shifts force row level security;
alter table public.scheduler_time_off force row level security;
alter table public.scheduler_breaks force row level security;
alter table public.scheduler_reservations force row level security;
alter table public.scheduler_holds force row level security;
alter table public.scheduler_resource_holds force row level security;
alter table public.scheduler_actuals force row level security;
alter table public.scheduler_approvals force row level security;
alter table public.scheduler_crm_occupancy force row level security;

revoke all on table public.scheduler_operations from public, scheduler_anon;
revoke all on table public.scheduler_overlap_rules from public, scheduler_anon;
revoke all on table public.scheduler_resources from public, scheduler_anon;
revoke all on table public.scheduler_display_names from public, scheduler_anon;
revoke all on table public.scheduler_shifts from public, scheduler_anon;
revoke all on table public.scheduler_time_off from public, scheduler_anon;
revoke all on table public.scheduler_breaks from public, scheduler_anon;
revoke all on table public.scheduler_reservations from public, scheduler_anon;
revoke all on table public.scheduler_holds from public, scheduler_anon;
revoke all on table public.scheduler_resource_holds from public, scheduler_anon;
revoke all on table public.scheduler_actuals from public, scheduler_anon;
revoke all on table public.scheduler_approvals from public, scheduler_anon;
revoke all on table public.scheduler_crm_occupancy from public, scheduler_anon;

do $$
declare role_name text;
declare table_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      foreach table_name in array array[
        'scheduler_operations','scheduler_overlap_rules','scheduler_resources','scheduler_display_names',
        'scheduler_shifts','scheduler_time_off','scheduler_breaks','scheduler_reservations',
        'scheduler_holds','scheduler_resource_holds','scheduler_actuals','scheduler_approvals','scheduler_crm_occupancy'
      ] loop
        execute format('revoke all on table public.%I from %I', table_name, role_name);
      end loop;
    end if;
  end loop;
end $$;

grant select, insert, update, delete on table public.scheduler_operations to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_overlap_rules to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_resources to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_display_names to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_shifts to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_time_off to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_breaks to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_reservations to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_holds to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_resource_holds to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_actuals to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_approvals to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_crm_occupancy to scheduler_staff;
grant select, update on table public.scheduler_reservations to scheduler_mechanic;
grant select on table public.scheduler_holds to scheduler_mechanic;

drop policy if exists scheduler_staff_all on public.scheduler_holds;
create policy scheduler_staff_all on public.scheduler_holds for all to scheduler_staff using (true) with check (true);
drop policy if exists scheduler_staff_resources on public.scheduler_resources;
create policy scheduler_staff_resources on public.scheduler_resources for all to scheduler_staff using (true) with check (true);
drop policy if exists scheduler_staff_resource_holds on public.scheduler_resource_holds;
create policy scheduler_staff_resource_holds on public.scheduler_resource_holds for all to scheduler_staff using (true) with check (true);
drop policy if exists scheduler_staff_reservations on public.scheduler_reservations;
create policy scheduler_staff_reservations on public.scheduler_reservations for all to scheduler_staff using (true) with check (true);
drop policy if exists scheduler_staff_approvals on public.scheduler_approvals;
create policy scheduler_staff_approvals on public.scheduler_approvals for all to scheduler_staff using (true) with check (true);
drop policy if exists scheduler_staff_crm on public.scheduler_crm_occupancy;
create policy scheduler_staff_crm on public.scheduler_crm_occupancy for all to scheduler_staff using (true) with check (true);
drop policy if exists scheduler_mechanic_read on public.scheduler_reservations;
create policy scheduler_mechanic_read on public.scheduler_reservations for select to scheduler_mechanic
  using (mechanic_id = current_setting('app.actor_mechanic', true));
drop policy if exists scheduler_mechanic_change on public.scheduler_reservations;
create policy scheduler_mechanic_change on public.scheduler_reservations for update to scheduler_mechanic
  using (mechanic_id = current_setting('app.actor_mechanic', true))
  with check (mechanic_id = current_setting('app.actor_mechanic', true));
drop policy if exists scheduler_mechanic_holds on public.scheduler_holds;
create policy scheduler_mechanic_holds on public.scheduler_holds for select to scheduler_mechanic
  using (mechanic_id = current_setting('app.actor_mechanic', true));
