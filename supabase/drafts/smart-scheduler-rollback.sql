-- ROLLBACK DRAFT. Do not run on production until the owner has a backup and explicitly asks.
-- Drops only scheduler objects. crm_store, appointments and client rows are not touched.

drop trigger if exists scheduler_guard_reservation on public.scheduler_reservations;
drop trigger if exists scheduler_reject_crm_mechanic on public.scheduler_holds;
drop trigger if exists scheduler_reject_crm_resource on public.scheduler_resource_holds;

drop table if exists public.scheduler_resource_holds cascade;
drop table if exists public.scheduler_holds cascade;
drop table if exists public.scheduler_crm_occupancy cascade;
drop table if exists public.scheduler_approvals cascade;
drop table if exists public.scheduler_reservations cascade;
drop table if exists public.scheduler_actuals cascade;
drop table if exists public.scheduler_breaks cascade;
drop table if exists public.scheduler_time_off cascade;
drop table if exists public.scheduler_shifts cascade;
drop table if exists public.scheduler_display_names cascade;
drop table if exists public.scheduler_resources cascade;
drop table if exists public.scheduler_overlap_rules cascade;
drop table if exists public.scheduler_operations cascade;

drop function if exists public.scheduler_reject_crm_resource();
drop function if exists public.scheduler_reject_crm_mechanic();
drop function if exists public.scheduler_guard_reservation();
drop function if exists public.scheduler_lock_workshop();
