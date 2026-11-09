-- DRAFT ONLY. Do not run this file on production or on any Supabase project.
-- Local mirror tests use bess_scheduler_test. The real-schema copy uses bess_crm_copy_test.
-- Future pilot: backup the existing Supabase project, then apply only these scheduler_* objects there.
-- This file does not create crm_store or appointments and does not replace them.
-- scheduler_store_appointments and scheduler_row_appointments stay test mirrors.
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

do $$ begin
  create role scheduler_reader nologin nobypassrls;
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
  request_id text not null,
  operation_code text not null,
  mechanic_id text not null,
  work_date date not null,
  start_clock text not null,
  minutes integer not null,
  resource_ids text[] not null,
  confirmed_by text not null,
  confirmed_role text not null check (confirmed_role in ('owner', 'admin')),
  confirmed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_by text,
  consumed_request_id text,
  check (expires_at > confirmed_at)
);

create unique index if not exists scheduler_approval_open
  on public.scheduler_approvals (request_id)
  where consumed_by is null;

create table if not exists public.scheduler_actor_sessions (
  id text primary key,
  staff_id text not null,
  actor_role text not null check (actor_role in ('owner', 'admin', 'mechanic')),
  mechanic_id text,
  db_role text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (actor_role <> 'mechanic' or coalesce(mechanic_id, '') <> '')
);

-- Default off. The old calendar stays on its current path until a separate launch.
create table if not exists public.scheduler_runtime (
  id text primary key default 'main',
  live_crm boolean not null default false,
  unified_calendar boolean not null default false
);

insert into public.scheduler_runtime (id) values ('main') on conflict (id) do nothing;

create table if not exists public.scheduler_notification_log (
  event_key text primary key,
  status text not null check (status in ('pending', 'sending', 'sent', 'failed')),
  send_count integer not null default 0,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  next_attempt_at timestamptz not null default now(),
  locked_by text,
  locked_until timestamptz,
  last_error text,
  error_history jsonb not null default '[]'::jsonb,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Local stand-ins for tests. They are not the production CRM.
-- Live mode reads the existing crm_store and appointments instead.
create table if not exists public.scheduler_store_appointments (
  id text primary key,
  mechanic_id text not null,
  resource_id text not null default '',
  start_at timestamptz not null,
  end_at timestamptz not null,
  active boolean not null default true,
  check (start_at < end_at)
);

create table if not exists public.scheduler_row_appointments (
  id text primary key,
  mechanic_id text not null,
  resource_id text not null default '',
  start_at timestamptz not null,
  end_at timestamptz not null,
  active boolean not null default true,
  check (start_at < end_at)
);

create table if not exists public.scheduler_crm_snapshot (
  id text primary key,
  digest text not null,
  available boolean not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

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
  -- Shared by the old calendar writer and Smart Scheduler. Re-entrant in one transaction.
  perform pg_advisory_xact_lock(874213);
end $$;

create or replace function public.scheduler_surface_digest(surface text) returns text
language sql stable as $$
  select coalesce(md5(string_agg(
    id || '|' || mechanic_id || '|' || resource_id || '|' || start_at::text || '|' || end_at::text,
    ',' order by id
  )), md5('empty'))
  from (
    select id, mechanic_id, resource_id, start_at, end_at
    from public.scheduler_store_appointments
    where surface = 'store' and active
    union all
    select id, mechanic_id, resource_id, start_at, end_at
    from public.scheduler_row_appointments
    where surface = 'row' and active
  ) rows;
$$;

create or replace function public.scheduler_open_session(staff_id text, actor_role text, mechanic_id text) returns text
language plpgsql
set search_path = public
as $$
declare
  session_id text := 'ses-' || gen_random_uuid()::text;
  bound_role text;
begin
  if current_user in ('scheduler_staff', 'scheduler_mechanic', 'scheduler_anon', 'anon', 'authenticated') then
    raise exception 'forbidden_reservation' using errcode = '42501';
  end if;
  if actor_role not in ('owner', 'admin', 'mechanic') then
    raise exception 'forbidden_reservation' using errcode = '42501';
  end if;
  if actor_role = 'mechanic' and coalesce(mechanic_id, '') = '' then
    raise exception 'forbidden_reservation' using errcode = '42501';
  end if;
  bound_role := case when actor_role = 'mechanic' then 'scheduler_mechanic' else 'scheduler_staff' end;
  insert into public.scheduler_actor_sessions (id, staff_id, actor_role, mechanic_id, db_role, expires_at)
  values (session_id, staff_id, actor_role, mechanic_id, bound_role, now() + interval '10 minutes');
  return session_id;
end $$;

create or replace function public.scheduler_load_actor(session_id text)
returns table(staff_id text, actor_role text, mechanic_id text)
language plpgsql
set search_path = public
as $$
declare
  sess public.scheduler_actor_sessions%rowtype;
begin
  perform public.scheduler_lock_workshop();
  -- app.actor_role and app.actor_mechanic are ignored on purpose.
  select * into sess from public.scheduler_actor_sessions
  where id = session_id and expires_at > now();
  if not found then
    raise exception 'forbidden_reservation' using errcode = '42501';
  end if;
  if current_user = 'scheduler_mechanic' and sess.db_role <> 'scheduler_mechanic' then
    raise exception 'forbidden_reservation' using errcode = '42501';
  end if;
  if current_user = 'scheduler_staff' and sess.db_role <> 'scheduler_staff' then
    raise exception 'forbidden_reservation' using errcode = '42501';
  end if;
  if current_user in ('scheduler_anon', 'anon', 'authenticated') then
    raise exception 'forbidden_reservation' using errcode = '42501';
  end if;
  staff_id := sess.staff_id;
  actor_role := sess.actor_role;
  mechanic_id := sess.mechanic_id;
  return next;
end $$;

create or replace function public.scheduler_appointment_lines(doc jsonb)
returns setof text
language sql
immutable
set search_path = public
as $$
  with chosen as (
    select distinct coalesce(value, '') as resource_id
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(doc->'resourceIds') = 'array' and jsonb_array_length(doc->'resourceIds') > 0
        then doc->'resourceIds'
        else jsonb_build_array(coalesce(doc->>'resourceId', ''))
      end
    ) as value
  )
  select
    coalesce(doc->>'id', '') || '|' ||
    coalesce(doc->>'mechanicId', '') || '|' ||
    coalesce(doc->>'date', '') || '|' ||
    coalesce(doc->>'workStart', '') || '|' ||
    coalesce(nullif(doc->>'workMinutes', ''), '0') || '|' ||
    coalesce(resource_id, '') || '|' ||
    coalesce(doc->>'appointmentStatus', '') || '|' ||
    case
      when coalesce(doc->>'appointmentStatus', '') in ('cancelled', 'completed')
        or coalesce(doc->>'visitState', '') = 'no_show'
        or lower(coalesce(doc->>'calendarHidden', 'false')) in ('true', 't', '1')
      then '0' else '1'
    end
  from chosen;
$$;

create or replace function public.scheduler_warsaw_parts(instant timestamptz)
returns table(work_date text, work_clock text)
language sql
stable
set search_path = public
as $$
  select to_char(instant at time zone 'Europe/Warsaw', 'YYYY-MM-DD'),
         to_char(instant at time zone 'Europe/Warsaw', 'HH24:MI');
$$;

create or replace function public.scheduler_live_crm_enabled() returns boolean
language plpgsql
stable
set search_path = public
as $$
begin
  if to_regclass('public.crm_store') is null or to_regclass('public.appointments') is null then
    return false;
  end if;
  return coalesce((select live_crm from public.scheduler_runtime where id = 'main'), false);
end $$;

create or replace function public.scheduler_live_digest(surface text) returns text
language plpgsql
stable
set search_path = public
as $$
declare
  digest text;
begin
  if to_regclass('public.crm_store') is null or to_regclass('public.appointments') is null then
    return md5('missing');
  end if;
  if surface = 'store' then
    select coalesce(md5(string_agg(line, ',' order by line)), md5('empty')) into digest
    from (
      select line
      from public.crm_store
      cross join lateral jsonb_array_elements(coalesce(doc->'appointments', '[]'::jsonb)) item
      cross join lateral public.scheduler_appointment_lines(item) as lines(line)
      where crm_store.id = 'main'
    ) lines;
  else
    select coalesce(md5(string_agg(line, ',' order by line)), md5('empty')) into digest
    from (
      select line
      from public.appointments
      cross join lateral public.scheduler_appointment_lines(doc) as lines(line)
    ) lines;
  end if;
  return digest;
end $$;

create or replace function public.scheduler_claim_notification(worker text, target_key text default null)
returns setof public.scheduler_notification_log
language plpgsql
set search_path = public
as $$
declare
  claimed public.scheduler_notification_log%rowtype;
begin
  if current_user in ('scheduler_staff', 'scheduler_mechanic', 'scheduler_anon', 'scheduler_reader', 'anon', 'authenticated') then
    raise exception 'forbidden_session' using errcode = '42501';
  end if;
  select * into claimed
  from public.scheduler_notification_log
  where (
      status in ('pending', 'failed')
      or (status = 'sending' and locked_until is not null and locked_until < now())
    )
    and next_attempt_at <= now()
    and attempt_count < max_attempts
    and (target_key is null or event_key = target_key)
  order by created_at
  for update skip locked
  limit 1;
  if not found then
    return;
  end if;
  update public.scheduler_notification_log
  set status = 'sending',
      locked_by = worker,
      locked_until = now() + interval '30 seconds',
      attempt_count = attempt_count + 1,
      updated_at = now()
  where event_key = claimed.event_key
  returning * into claimed;
  return next claimed;
end $$;

create or replace function public.scheduler_set_unified_calendar(enabled boolean) returns void
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('scheduler_staff', 'scheduler_mechanic', 'scheduler_anon', 'anon', 'authenticated') then
    raise exception 'forbidden_session' using errcode = '42501';
  end if;
  insert into public.scheduler_runtime (id, live_crm, unified_calendar)
  values ('main', enabled, enabled)
  on conflict (id) do update set live_crm = excluded.live_crm, unified_calendar = excluded.unified_calendar;
end $$;

create or replace function public.scheduler_guard_session() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('scheduler_staff', 'scheduler_mechanic', 'scheduler_anon', 'anon', 'authenticated') then
    raise exception 'forbidden_session' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists scheduler_guard_session on public.scheduler_actor_sessions;
create trigger scheduler_guard_session
before insert or update on public.scheduler_actor_sessions
for each row execute function public.scheduler_guard_session();

create or replace function public.scheduler_issue_snapshot(available boolean) returns text
language plpgsql
set search_path = public
as $$
declare
  store_digest text;
  row_digest text;
  token text := 'snap-' || gen_random_uuid()::text;
begin
  perform public.scheduler_lock_workshop();
  if public.scheduler_live_crm_enabled() then
    store_digest := public.scheduler_live_digest('store');
    row_digest := public.scheduler_live_digest('row');
  else
    store_digest := public.scheduler_surface_digest('store');
    row_digest := public.scheduler_surface_digest('row');
  end if;
  if not available then
    raise exception 'crm_unavailable';
  end if;
  if store_digest is distinct from row_digest then
    raise exception 'crm_diverged';
  end if;
  if (select count(*) from public.scheduler_resources) < 6 then
    raise exception 'config_missing';
  end if;
  insert into public.scheduler_crm_snapshot (id, digest, available, expires_at)
  values (token, store_digest, true, now() + interval '30 seconds');
  return token;
end $$;

create or replace function public.scheduler_assert_crm(snapshot_id text) returns void
language plpgsql
set search_path = public
as $$
declare
  snap public.scheduler_crm_snapshot%rowtype;
  store_digest text;
  row_digest text;
begin
  perform public.scheduler_lock_workshop();
  if snapshot_id is null or snapshot_id = '' then
    raise exception 'crm_unavailable';
  end if;
  select * into snap from public.scheduler_crm_snapshot where id = snapshot_id;
  if not found or not snap.available then
    raise exception 'crm_unavailable';
  end if;
  if snap.expires_at <= now() then
    raise exception 'crm_stale';
  end if;
  if public.scheduler_live_crm_enabled() then
    store_digest := public.scheduler_live_digest('store');
    row_digest := public.scheduler_live_digest('row');
  else
    store_digest := public.scheduler_surface_digest('store');
    row_digest := public.scheduler_surface_digest('row');
  end if;
  if store_digest is distinct from row_digest then
    raise exception 'crm_diverged';
  end if;
  if store_digest is distinct from snap.digest then
    raise exception 'crm_stale';
  end if;
  if (select count(*) from public.scheduler_resources) < 6 then
    raise exception 'config_missing';
  end if;
end $$;

create or replace function public.scheduler_mirror_interval(
  interval_id text,
  mechanic text,
  resource text,
  starts_at timestamptz,
  ends_at timestamptz
) returns void
language plpgsql as $$
begin
  insert into public.scheduler_store_appointments (id, mechanic_id, resource_id, start_at, end_at)
  values (interval_id, mechanic, resource, starts_at, ends_at);
  insert into public.scheduler_row_appointments (id, mechanic_id, resource_id, start_at, end_at)
  values (interval_id, mechanic, resource, starts_at, ends_at);
  insert into public.scheduler_crm_occupancy (id, appointment_id, mechanic_id, resource_id, start_at, end_at)
  values (interval_id, interval_id, mechanic, resource, starts_at, ends_at);
end $$;

create or replace function public.scheduler_release_interval(interval_id text) returns void
language plpgsql as $$
begin
  delete from public.scheduler_store_appointments
  where id = interval_id or id like interval_id || ':%';
  delete from public.scheduler_row_appointments
  where id = interval_id or id like interval_id || ':%';
  delete from public.scheduler_crm_occupancy
  where id = interval_id or appointment_id = interval_id or id like interval_id || ':%';
end $$;

create or replace function public.scheduler_guard_reservation() returns trigger
language plpgsql as $$
declare
  sess public.scheduler_actor_sessions%rowtype;
begin
  -- A custom setting is only a lookup key. It never grants owner or mechanic identity.
  select * into sess from public.scheduler_actor_sessions
  where id = current_setting('app.actor_session', true) and expires_at > now();
  if not found then
    raise exception 'forbidden_reservation' using errcode = '42501';
  end if;
  if current_user = 'scheduler_mechanic' and sess.db_role <> 'scheduler_mechanic' then
    raise exception 'forbidden_reservation' using errcode = '42501';
  end if;
  if sess.actor_role in ('owner', 'admin') and current_user <> 'scheduler_mechanic' then
    return new;
  end if;
  if sess.actor_role = 'mechanic' and coalesce(sess.mechanic_id, '') <> ''
     and new.mechanic_id = sess.mechanic_id
     and (tg_op = 'INSERT' or old.mechanic_id = sess.mechanic_id) then
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
alter table public.scheduler_actor_sessions enable row level security;
alter table public.scheduler_store_appointments enable row level security;
alter table public.scheduler_row_appointments enable row level security;
alter table public.scheduler_crm_snapshot enable row level security;
alter table public.scheduler_crm_occupancy enable row level security;
alter table public.scheduler_runtime enable row level security;
alter table public.scheduler_notification_log enable row level security;

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
alter table public.scheduler_actor_sessions force row level security;
alter table public.scheduler_store_appointments force row level security;
alter table public.scheduler_row_appointments force row level security;
alter table public.scheduler_crm_snapshot force row level security;
alter table public.scheduler_crm_occupancy force row level security;
alter table public.scheduler_runtime force row level security;
alter table public.scheduler_notification_log force row level security;

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
revoke all on table public.scheduler_approvals from public, scheduler_anon, scheduler_mechanic;
revoke all on table public.scheduler_actor_sessions from public, scheduler_anon, scheduler_mechanic;
revoke all on table public.scheduler_store_appointments from public, scheduler_anon, scheduler_mechanic;
revoke all on table public.scheduler_row_appointments from public, scheduler_anon, scheduler_mechanic;
revoke all on table public.scheduler_crm_snapshot from public, scheduler_anon, scheduler_mechanic;
revoke all on table public.scheduler_crm_occupancy from public, scheduler_anon, scheduler_mechanic;
revoke all on table public.scheduler_runtime from public, scheduler_anon, scheduler_mechanic, scheduler_staff;
revoke all on table public.scheduler_notification_log from public, scheduler_anon, scheduler_mechanic, scheduler_staff, scheduler_reader;

do $$ begin
  if to_regclass('public.crm_store') is not null then
    execute 'grant select on table public.crm_store to scheduler_reader';
  end if;
  if to_regclass('public.appointments') is not null then
    execute 'grant select on table public.appointments to scheduler_reader';
  end if;
  execute 'grant select on table public.scheduler_holds, public.scheduler_resources, public.scheduler_reservations to scheduler_reader';
end $$;

do $$
declare role_name text;
declare table_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      foreach table_name in array array[
        'scheduler_operations','scheduler_overlap_rules','scheduler_resources','scheduler_display_names',
        'scheduler_shifts','scheduler_time_off','scheduler_breaks','scheduler_reservations',
        'scheduler_holds','scheduler_resource_holds','scheduler_actuals','scheduler_approvals','scheduler_actor_sessions',
        'scheduler_store_appointments','scheduler_row_appointments','scheduler_crm_snapshot','scheduler_crm_occupancy',
        'scheduler_runtime','scheduler_notification_log'
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
revoke insert, update, delete on table public.scheduler_actor_sessions from scheduler_staff;
grant select on table public.scheduler_actor_sessions to scheduler_staff;
grant select on table public.scheduler_runtime to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_store_appointments to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_row_appointments to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_crm_snapshot to scheduler_staff;
grant select, insert, update, delete on table public.scheduler_crm_occupancy to scheduler_staff;
grant select, update on table public.scheduler_reservations to scheduler_mechanic;
grant select on table public.scheduler_holds to scheduler_mechanic;
grant select on table public.scheduler_actor_sessions to scheduler_mechanic;

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
drop policy if exists scheduler_staff_sessions on public.scheduler_actor_sessions;
create policy scheduler_staff_sessions on public.scheduler_actor_sessions for select to scheduler_staff using (true);
drop policy if exists scheduler_staff_runtime on public.scheduler_runtime;
create policy scheduler_staff_runtime on public.scheduler_runtime for select to scheduler_staff using (true);
drop policy if exists scheduler_reader_holds on public.scheduler_holds;
create policy scheduler_reader_holds on public.scheduler_holds for select to scheduler_reader using (true);
drop policy if exists scheduler_reader_resources on public.scheduler_resources;
create policy scheduler_reader_resources on public.scheduler_resources for select to scheduler_reader using (true);
drop policy if exists scheduler_mechanic_own_session on public.scheduler_actor_sessions;
create policy scheduler_mechanic_own_session on public.scheduler_actor_sessions for select to scheduler_mechanic
  using (
    id = current_setting('app.actor_session', true)
    and actor_role = 'mechanic'
    and db_role = 'scheduler_mechanic'
  );
drop policy if exists scheduler_staff_store on public.scheduler_store_appointments;
create policy scheduler_staff_store on public.scheduler_store_appointments for all to scheduler_staff using (true) with check (true);
drop policy if exists scheduler_staff_rows on public.scheduler_row_appointments;
create policy scheduler_staff_rows on public.scheduler_row_appointments for all to scheduler_staff using (true) with check (true);
drop policy if exists scheduler_mechanic_read on public.scheduler_reservations;
create policy scheduler_mechanic_read on public.scheduler_reservations for select to scheduler_mechanic
  using (mechanic_id = (
    select mechanic_id from public.scheduler_actor_sessions
    where id = current_setting('app.actor_session', true)
      and actor_role = 'mechanic'
      and db_role = 'scheduler_mechanic'
      and expires_at > now()
  ));
drop policy if exists scheduler_mechanic_change on public.scheduler_reservations;
create policy scheduler_mechanic_change on public.scheduler_reservations for update to scheduler_mechanic
  using (mechanic_id = (
    select mechanic_id from public.scheduler_actor_sessions
    where id = current_setting('app.actor_session', true)
      and actor_role = 'mechanic'
      and db_role = 'scheduler_mechanic'
      and expires_at > now()
  ))
  with check (mechanic_id = (
    select mechanic_id from public.scheduler_actor_sessions
    where id = current_setting('app.actor_session', true)
      and actor_role = 'mechanic'
      and db_role = 'scheduler_mechanic'
      and expires_at > now()
  ));
drop policy if exists scheduler_mechanic_holds on public.scheduler_holds;
create policy scheduler_mechanic_holds on public.scheduler_holds for select to scheduler_mechanic
  using (mechanic_id = (
    select mechanic_id from public.scheduler_actor_sessions
    where id = current_setting('app.actor_session', true)
      and actor_role = 'mechanic'
      and db_role = 'scheduler_mechanic'
      and expires_at > now()
  ));

revoke all on function public.scheduler_open_session(text, text, text) from public, scheduler_staff, scheduler_mechanic, scheduler_anon;
revoke all on function public.scheduler_load_actor(text) from public;
revoke all on function public.scheduler_issue_snapshot(boolean) from public;
revoke all on function public.scheduler_assert_crm(text) from public;
revoke all on function public.scheduler_mirror_interval(text, text, text, timestamptz, timestamptz) from public;
revoke all on function public.scheduler_release_interval(text) from public;
revoke all on function public.scheduler_set_unified_calendar(boolean) from public, scheduler_staff, scheduler_mechanic, scheduler_anon, scheduler_reader;
revoke all on function public.scheduler_claim_notification(text, text) from public, scheduler_staff, scheduler_mechanic, scheduler_anon, scheduler_reader;
revoke all on function public.scheduler_guard_session() from public;
revoke all on function public.scheduler_live_digest(text) from public;
revoke all on function public.scheduler_live_crm_enabled() from public;
revoke all on function public.scheduler_appointment_lines(jsonb) from public;
revoke all on function public.scheduler_warsaw_parts(timestamptz) from public;
grant execute on function public.scheduler_load_actor(text) to scheduler_staff;
grant execute on function public.scheduler_live_digest(text) to scheduler_staff;
grant execute on function public.scheduler_live_crm_enabled() to scheduler_staff;
grant execute on function public.scheduler_appointment_lines(jsonb) to scheduler_staff;
grant execute on function public.scheduler_warsaw_parts(timestamptz) to scheduler_staff;
grant execute on function public.scheduler_issue_snapshot(boolean) to scheduler_staff;
grant execute on function public.scheduler_assert_crm(text) to scheduler_staff;
grant execute on function public.scheduler_mirror_interval(text, text, text, timestamptz, timestamptz) to scheduler_staff;
grant execute on function public.scheduler_release_interval(text) to scheduler_staff;
