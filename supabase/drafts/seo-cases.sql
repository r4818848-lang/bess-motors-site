-- Repair cases for the public /realizacje pages.
-- Separate from the CRM document. It does not read clients, vehicles, phones or orders.
-- Run once in the Supabase SQL editor. The application does not apply this file.
-- After it exists, set SEO_CASE_STORAGE=supabase. Until then the site refuses case writes.

create extension if not exists pgcrypto;

create table if not exists public.seo_cases (
  id uuid primary key,
  version integer not null check (version > 0),
  status text not null check (status in ('draft', 'review', 'approved', 'published', 'archived')),
  body jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.seo_case_photos (
  id uuid primary key,
  case_id uuid not null references public.seo_cases (id),
  mime text not null check (mime = 'image/jpeg'),
  bytes bytea not null,
  reviewed boolean not null default false,
  constraint seo_case_photo_size check (octet_length(bytes) between 1 and 4194304)
);

create table if not exists public.seo_case_actions (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  case_id uuid,
  note text not null
);

create table if not exists public.seo_case_idempotency (
  key text primary key,
  response jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.seo_cases enable row level security;
alter table public.seo_case_photos enable row level security;
alter table public.seo_case_actions enable row level security;
alter table public.seo_case_idempotency enable row level security;

revoke all on table public.seo_cases from public, anon, authenticated;
revoke all on table public.seo_case_photos from public, anon, authenticated;
revoke all on table public.seo_case_actions from public, anon, authenticated;
revoke all on table public.seo_case_idempotency from public, anon, authenticated;

create or replace function public.seo_case_apply(
  op text,
  payload jsonb,
  expected_version integer,
  idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing jsonb;
  row_case public.seo_cases%rowtype;
  new_id uuid;
  new_photo uuid;
  photo_count integer;
  photo_b64 text;
  photo_mime text;
  blob bytea;
begin
  if idempotency_key is not null and idempotency_key <> '' then
    perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
    select response into existing
    from public.seo_case_idempotency
    where key = idempotency_key;
    if found then
      return existing || jsonb_build_object('replayed', true);
    end if;
  end if;

  if op = 'list' then
    return jsonb_build_object(
      'ok', true,
      'cases', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'version', version, 'status', status, 'body', body) order by updated_at desc) from public.seo_cases), '[]'::jsonb)
    );
  elsif op = 'actions' then
    return jsonb_build_object(
      'ok', true,
      'actions', coalesce((select jsonb_agg(jsonb_build_object('at', at, 'actor', actor, 'action', action, 'caseId', case_id, 'note', note) order by id) from public.seo_case_actions), '[]'::jsonb)
    );
  elsif op = 'public_photo' then
    select encode(p.bytes, 'base64'), p.mime
    into photo_b64, photo_mime
    from public.seo_case_photos p
    join public.seo_cases c on c.id = p.case_id
    where c.id = (payload->>'caseId')::uuid
      and p.id = (payload->>'photoId')::uuid
      and c.status = 'published'
      and p.reviewed = true
      and coalesce(c.body->'reviewedPhotoIds', '[]'::jsonb) ? p.id::text;
    if photo_b64 is null then
      return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;
    return jsonb_build_object('ok', true, 'mime', photo_mime, 'bytes', photo_b64);
  end if;

  if op = 'create' then
    new_id := gen_random_uuid();
    insert into public.seo_cases (id, version, status, body)
    values (
      new_id,
      1,
      'draft',
      payload || jsonb_build_object('photoIds', '[]'::jsonb, 'reviewedPhotoIds', '[]'::jsonb, 'publishedAt', null, 'history', jsonb_build_array(jsonb_build_object('at', now(), 'action', 'create', 'from', null, 'to', 'draft')))
    );
    insert into public.seo_case_actions (actor, action, case_id, note)
    values ('admin', 'create_case', new_id, 'draft');
  elsif op = 'update' or op = 'transition' or op = 'attach_photo' or op = 'review_photo' then
    select * into row_case from public.seo_cases where id = (payload->>'id')::uuid for update;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;
    if row_case.version <> expected_version then
      return jsonb_build_object('ok', false, 'error', 'conflict');
    end if;
    if op = 'attach_photo' then
      select count(*) into photo_count from public.seo_case_photos where case_id = row_case.id;
      if photo_count >= 8 then
        return jsonb_build_object('ok', false, 'error', 'too_many_photos');
      end if;
      blob := decode(payload->>'bytes', 'base64');
      if octet_length(blob) < 1 or octet_length(blob) > 4194304 then
        return jsonb_build_object('ok', false, 'error', 'too_large');
      end if;
      new_photo := gen_random_uuid();
      insert into public.seo_case_photos (id, case_id, mime, bytes, reviewed)
      values (new_photo, row_case.id, 'image/jpeg', blob, false);
      update public.seo_cases
      set version = version + 1,
          updated_at = now(),
          body = jsonb_set(
            jsonb_set(body, '{photoIds}', coalesce(body->'photoIds', '[]'::jsonb) || to_jsonb(new_photo::text), true),
            '{history}',
            coalesce(body->'history', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'action', 'edit', 'from', status, 'to', status)),
            true
          )
      where id = row_case.id;
      insert into public.seo_case_actions (actor, action, case_id, note) values ('admin', 'attach_photo', row_case.id, 'image/jpeg');
    elsif op = 'review_photo' then
      update public.seo_case_photos
      set reviewed = true
      where id = (payload->>'photoId')::uuid and case_id = row_case.id;
      if not found then
        return jsonb_build_object('ok', false, 'error', 'not_found');
      end if;
      update public.seo_cases
      set version = version + 1,
          updated_at = now(),
          body = jsonb_set(
            jsonb_set(body, '{reviewedPhotoIds}', coalesce(body->'reviewedPhotoIds', '[]'::jsonb) || to_jsonb(payload->>'photoId'), true),
            '{history}',
            coalesce(body->'history', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'action', 'edit', 'from', status, 'to', status)),
            true
          )
      where id = row_case.id;
      insert into public.seo_case_actions (actor, action, case_id, note)
      values ('admin', 'review_photo', row_case.id, 'owner_confirmed_no_plate_face_or_vin');
    else
      update public.seo_cases
      set version = version + 1,
          status = coalesce(payload->>'status', status),
          updated_at = now(),
          body = coalesce(payload->'body', body)
      where id = row_case.id and version = expected_version;
      if not found then
        return jsonb_build_object('ok', false, 'error', 'conflict');
      end if;
      insert into public.seo_case_actions (actor, action, case_id, note)
      values ('admin', op, row_case.id, coalesce(payload->>'status', row_case.status));
    end if;
  elsif op = 'record' then
    insert into public.seo_case_actions (actor, action, case_id, note)
    values ('admin', payload->>'action', nullif(payload->>'caseId', '')::uuid, left(coalesce(payload->>'note', ''), 300));
  else
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  select jsonb_build_object('id', id, 'version', version, 'status', status, 'body', body)
  into existing
  from public.seo_cases
  where id = coalesce(new_id, (payload->>'id')::uuid);

  existing := jsonb_build_object('ok', true, 'story', existing, 'photoId', new_photo);
  if idempotency_key is not null and idempotency_key <> '' then
    insert into public.seo_case_idempotency (key, response) values (idempotency_key, existing)
    on conflict (key) do nothing;
  end if;
  return existing;
exception
  when others then
    return jsonb_build_object('ok', false, 'error', 'STORAGE_UNAVAILABLE');
end;
$$;

revoke all on function public.seo_case_apply(text, jsonb, integer, text) from public, anon, authenticated;
grant execute on function public.seo_case_apply(text, jsonb, integer, text) to service_role;
