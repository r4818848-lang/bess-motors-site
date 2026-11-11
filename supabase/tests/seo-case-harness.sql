-- Local stand-in for Supabase roles and Storage. Never run this against production.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema storage;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text
);

alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated;
grant select, insert on storage.objects to anon, authenticated;

create policy storage_objects_allow_all
on storage.objects
as permissive
for all
to anon, authenticated
using (true)
with check (true);

create table public.crm_store (
  id text primary key,
  data jsonb not null
);

insert into public.crm_store (id, data) values ('main', '{"sentinel":true}'::jsonb);

create table public.appointments (
  id integer primary key,
  note text not null
);

insert into public.appointments (id, note) values (1, 'sentinel');
