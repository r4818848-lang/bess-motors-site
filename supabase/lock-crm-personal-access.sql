-- DO NOT RUN on production until the statements below have been reviewed
-- and a fresh backup of crm_store and appointments exists.
-- This file is not applied by the application deploy.
--
-- Read-only check (safe to run by itself in the SQL editor):
-- select c.relname as table_name,
--        c.relrowsecurity as rls_enabled,
--        c.relforcerowsecurity as rls_forced
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relname in ('crm_store', 'appointments');
--
-- select grantee, table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public' and table_name in ('crm_store', 'appointments')
-- order by table_name, grantee, privilege_type;

-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY. In Supabase that role
-- bypasses RLS, so CRM, the site forms, and the Telegram calendar keep working.
-- anon and authenticated receive no policies, so personal rows are denied.

alter table public.crm_store enable row level security;
alter table public.appointments enable row level security;
alter table public.crm_store force row level security;
alter table public.appointments force row level security;

revoke all on table public.crm_store from public, anon, authenticated;
revoke all on table public.appointments from public, anon, authenticated;

grant select, insert, update, delete on table public.crm_store to service_role;
grant select, insert, update, delete on table public.appointments to service_role;
