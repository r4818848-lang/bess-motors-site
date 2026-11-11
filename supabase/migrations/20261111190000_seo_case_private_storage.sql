-- Repair-case storage for /realizacje.
-- Run by hand in the SQL editor of the existing production project. The app does not apply this file.
-- Photographs go to the private Storage bucket seo-case-photos. This database keeps metadata and paths only.
-- The function is security invoker. anon and authenticated cannot execute it or read the seo schema.
-- Do not set SEO_CASE_STORAGE until the post-checks in docs/seo-sprint-5-storage.md pass.

do $migration$
begin
  if to_regclass('seo.cases') is not null then
    raise exception 'seo.cases already exists; refusing to rewrite it';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon')
     or not exists (select 1 from pg_roles where rolname = 'authenticated')
     or not exists (select 1 from pg_roles where rolname = 'service_role') then
    raise exception 'Supabase roles anon, authenticated and service_role are required';
  end if;
end
$migration$;

create schema seo;

revoke all on schema seo from public;
revoke all on schema seo from anon, authenticated;
grant usage on schema seo to service_role;

comment on schema seo is 'Owner-approved repair cases. Unexposed to the Data API. No client records.';

create table seo.cases (
  id uuid primary key,
  version integer not null check (version > 0),
  status text not null check (status in ('draft', 'review', 'approved', 'published', 'archived')),
  body jsonb not null,
  updated_at timestamptz not null default pg_catalog.now(),
  constraint seo_cases_body_object check (jsonb_typeof(body) = 'object')
);

create table seo.photos (
  id uuid primary key,
  case_id uuid not null references seo.cases (id),
  storage_path text not null unique,
  mime text not null check (mime = 'image/jpeg'),
  byte_size integer not null check (byte_size between 1 and 4194304),
  stored boolean not null default false,
  reviewed boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default pg_catalog.now(),
  constraint seo_photos_path_shape check (storage_path = (case_id::text || '/' || id::text || '.jpg')),
  constraint seo_photos_review_requires_bytes check (reviewed = false or stored = true)
);

create table seo.actions (
  id bigint generated always as identity primary key,
  at timestamptz not null default pg_catalog.now(),
  actor text not null check (actor = 'admin'),
  action text not null check (char_length(action) between 1 and 80),
  case_id uuid,
  note text not null check (char_length(note) <= 300)
);

create table seo.idempotency (
  key text primary key check (char_length(key) between 8 and 200),
  response jsonb not null,
  created_at timestamptz not null default pg_catalog.now()
);

create index seo_photos_case_id on seo.photos (case_id);
create index seo_actions_case_id on seo.actions (case_id);

alter table seo.cases enable row level security;
alter table seo.photos enable row level security;
alter table seo.actions enable row level security;
alter table seo.idempotency enable row level security;

revoke all on table seo.cases from public, anon, authenticated;
revoke all on table seo.photos from public, anon, authenticated;
revoke all on table seo.actions from public, anon, authenticated;
revoke all on table seo.idempotency from public, anon, authenticated;

grant select, insert, update on table seo.cases to service_role;
grant select, insert, update on table seo.photos to service_role;
grant select, insert on table seo.actions to service_role;
grant usage, select on sequence seo.actions_id_seq to service_role;
grant select, insert, update on table seo.idempotency to service_role;

create function seo.photo_ids(target uuid, only_reviewed boolean)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select coalesce(
    (
      select jsonb_agg(photos.id::text order by photos.created_at)
      from seo.photos as photos
      where photos.case_id = target
        and photos.archived = false
        and (
          only_reviewed = false
          or (photos.reviewed = true and photos.stored = true)
        )
    ),
    '[]'::jsonb
  );
$$;

create function seo.story(row_case seo.cases)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select jsonb_build_object(
    'id', row_case.id,
    'version', row_case.version,
    'status', row_case.status,
    'body', row_case.body || jsonb_build_object(
      'photoIds', seo.photo_ids(row_case.id, false),
      'reviewedPhotoIds', seo.photo_ids(row_case.id, true)
    )
  );
$$;

revoke all on function seo.photo_ids(uuid, boolean) from public, anon, authenticated;
revoke all on function seo.story(seo.cases) from public, anon, authenticated;
grant execute on function seo.photo_ids(uuid, boolean) to service_role;
grant execute on function seo.story(seo.cases) to service_role;

create function public.seo_case_apply(
  op text,
  payload jsonb,
  expected_version integer,
  idempotency_key text
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  existing jsonb;
  row_case seo.cases%rowtype;
  new_id uuid;
  new_photo uuid;
  photo_count integer;
  photo_path text;
  photo_size integer;
  photo_stored boolean;
  photo_archived boolean;
  next_status text;
  next_body jsonb;
  service_id text;
  clipped text;
begin
  if current_user <> 'service_role' then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then
    payload := '{}'::jsonb;
  end if;
  if op is null or op !~ '^[a-z_]{1,40}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  if idempotency_key is not null and idempotency_key <> '' then
    if idempotency_key !~ '^[A-Za-z0-9._:-]{8,200}$' then
      return jsonb_build_object('ok', false, 'error', 'invalid');
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(idempotency_key, 0));
    select response into existing from seo.idempotency where key = idempotency_key;
    if found and existing->>'op' is not distinct from op then
      return existing || jsonb_build_object('replayed', true);
    end if;
  end if;

  if op = 'list' then
    return jsonb_build_object(
      'ok', true,
      'cases', coalesce((
        select jsonb_agg(seo.story(cases) order by cases.updated_at desc)
        from seo.cases as cases
      ), '[]'::jsonb)
    );
  elsif op = 'list_published' then
    return jsonb_build_object(
      'ok', true,
      'cases', coalesce((
        select jsonb_agg(seo.story(cases) order by cases.updated_at desc)
        from seo.cases as cases
        where cases.status = 'published'
      ), '[]'::jsonb)
    );
  elsif op = 'actions' then
    return jsonb_build_object(
      'ok', true,
      'actions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'at', actions.at,
          'actor', actions.actor,
          'action', actions.action,
          'caseId', actions.case_id,
          'note', actions.note
        ) order by actions.id)
        from seo.actions as actions
      ), '[]'::jsonb)
    );
  elsif op = 'public_photo' then
    if coalesce(payload->>'caseId', '') !~ '^[0-9a-f-]{36}$'
       or coalesce(payload->>'photoId', '') !~ '^[0-9a-f-]{36}$' then
      return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;
    select photos.storage_path
    into photo_path
    from seo.photos as photos
    join seo.cases as cases on cases.id = photos.case_id
    where cases.id = (payload->>'caseId')::uuid
      and photos.id = (payload->>'photoId')::uuid
      and cases.status = 'published'
      and photos.stored = true
      and photos.reviewed = true
      and photos.archived = false
      and (seo.photo_ids(cases.id, true) ? photos.id::text);
    if photo_path is null
       or photo_path <> (lower(payload->>'caseId') || '/' || lower(payload->>'photoId') || '.jpg') then
      return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;
    return jsonb_build_object('ok', true, 'mime', 'image/jpeg', 'storagePath', photo_path);
  end if;

  if op = 'create' then
    service_id := payload->>'serviceId';
    if service_id not in ('tires', 'mechanic', 'oil', 'diagnostics', 'brakes', 'suspension', 'ac', 'timing', 'engine', 'gearbox') then
      return jsonb_build_object('ok', false, 'error', 'unknown_service');
    end if;
    if length(btrim(coalesce(payload->>'make', ''))) = 0
       or length(btrim(coalesce(payload->>'model', ''))) = 0
       or length(btrim(coalesce(payload->>'problemPl', ''))) = 0
       or length(btrim(coalesce(payload->>'diagnosisPl', ''))) = 0
       or length(btrim(coalesce(payload->>'workPl', ''))) = 0 then
      return jsonb_build_object('ok', false, 'error', 'invalid');
    end if;
    new_id := pg_catalog.gen_random_uuid();
    insert into seo.cases (id, version, status, body)
    values (
      new_id,
      1,
      'draft',
      jsonb_build_object(
        'make', left(btrim(payload->>'make'), 2000),
        'model', left(btrim(payload->>'model'), 2000),
        'generation', left(btrim(coalesce(payload->>'generation', '')), 2000),
        'year', left(btrim(coalesce(payload->>'year', '')), 2000),
        'engine', left(btrim(coalesce(payload->>'engine', '')), 2000),
        'problemPl', left(btrim(payload->>'problemPl'), 2000),
        'diagnosisPl', left(btrim(payload->>'diagnosisPl'), 2000),
        'workPl', left(btrim(payload->>'workPl'), 2000),
        'notesPl', left(btrim(coalesce(payload->>'notesPl', '')), 2000),
        'serviceId', service_id,
        'photoIds', '[]'::jsonb,
        'reviewedPhotoIds', '[]'::jsonb,
        'publishedAt', null,
        'createdAt', pg_catalog.now(),
        'updatedAt', pg_catalog.now(),
        'history', jsonb_build_array(jsonb_build_object('at', pg_catalog.now(), 'action', 'create', 'from', null, 'to', 'draft'))
      )
    );
    insert into seo.actions (actor, action, case_id, note)
    values ('admin', 'create_case', new_id, 'draft');
  elsif op = 'record' then
    if coalesce(payload->>'action', '') !~ '^[A-Za-z0-9_:-]{1,80}$' then
      return jsonb_build_object('ok', false, 'error', 'invalid');
    end if;
    if coalesce(payload->>'caseId', '') <> '' and (payload->>'caseId') !~ '^[0-9a-f-]{36}$' then
      return jsonb_build_object('ok', false, 'error', 'invalid');
    end if;
    insert into seo.actions (actor, action, case_id, note)
    values (
      'admin',
      payload->>'action',
      nullif(payload->>'caseId', '')::uuid,
      left(coalesce(payload->>'note', ''), 300)
    );
    existing := jsonb_build_object('ok', true, 'recorded', true, 'op', op);
    if idempotency_key is not null and idempotency_key <> '' then
      insert into seo.idempotency (key, response) values (idempotency_key, existing);
    end if;
    return existing;
  elsif op in ('update', 'transition', 'attach_photo', 'confirm_photo', 'review_photo') then
    if coalesce(payload->>'id', '') !~ '^[0-9a-f-]{36}$' then
      return jsonb_build_object('ok', false, 'error', 'invalid');
    end if;
    select * into row_case from seo.cases where id = (payload->>'id')::uuid for update;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;

    if op = 'confirm_photo' then
      if coalesce(payload->>'photoId', '') !~ '^[0-9a-f-]{36}$' then
        return jsonb_build_object('ok', false, 'error', 'invalid');
      end if;
      update seo.photos
      set stored = true
      where id = (payload->>'photoId')::uuid
        and case_id = row_case.id
        and archived = false
        and storage_path = (row_case.id::text || '/' || id::text || '.jpg');
      if not found then
        return jsonb_build_object('ok', false, 'error', 'not_found');
      end if;
      if idempotency_key is not null and idempotency_key <> '' then
        update seo.idempotency
        set response = response || jsonb_build_object('stored', true, 'op', 'attach_photo')
        where key = idempotency_key;
      end if;
      select * into row_case from seo.cases where id = row_case.id;
      return jsonb_build_object(
        'ok', true,
        'story', seo.story(row_case),
        'photoId', payload->>'photoId',
        'storagePath', row_case.id::text || '/' || (payload->>'photoId') || '.jpg',
        'stored', true,
        'byteSize', (select byte_size from seo.photos where id = (payload->>'photoId')::uuid)
      );
    end if;

    if expected_version is null or row_case.version <> expected_version then
      return jsonb_build_object('ok', false, 'error', 'conflict');
    end if;

    next_body := row_case.body;
    next_status := row_case.status;

    if op = 'attach_photo' then
      if coalesce(payload->>'byteSize', '') !~ '^[0-9]{1,7}$' then
        return jsonb_build_object('ok', false, 'error', 'invalid');
      end if;
      photo_size := (payload->>'byteSize')::integer;
      if photo_size < 1 or photo_size > 4194304 then
        return jsonb_build_object('ok', false, 'error', 'too_large');
      end if;
      select count(*) into photo_count
      from seo.photos
      where case_id = row_case.id and archived = false;
      if photo_count >= 8 then
        return jsonb_build_object('ok', false, 'error', 'too_many_photos');
      end if;
      new_photo := pg_catalog.gen_random_uuid();
      photo_path := row_case.id::text || '/' || new_photo::text || '.jpg';
      insert into seo.photos (id, case_id, storage_path, mime, byte_size, stored, reviewed, archived)
      values (new_photo, row_case.id, photo_path, 'image/jpeg', photo_size, false, false, false);
      insert into seo.actions (actor, action, case_id, note)
      values ('admin', 'attach_photo', row_case.id, 'image/jpeg');
    elsif op = 'review_photo' then
      if coalesce(payload->>'photoId', '') !~ '^[0-9a-f-]{36}$' then
        return jsonb_build_object('ok', false, 'error', 'invalid');
      end if;
      select stored, archived into photo_stored, photo_archived
      from seo.photos
      where id = (payload->>'photoId')::uuid and case_id = row_case.id
      for update;
      if not found or photo_archived then
        return jsonb_build_object('ok', false, 'error', 'not_found');
      end if;
      if not photo_stored then
        return jsonb_build_object('ok', false, 'error', 'not_stored');
      end if;
      update seo.photos
      set reviewed = true
      where id = (payload->>'photoId')::uuid and case_id = row_case.id;
      insert into seo.actions (actor, action, case_id, note)
      values ('admin', 'review_photo', row_case.id, 'owner_confirmed_no_plate_face_or_vin');
    elsif op = 'transition' then
      next_status := payload->>'status';
      if next_status not in ('draft', 'review', 'approved', 'published', 'archived') then
        return jsonb_build_object('ok', false, 'error', 'invalid');
      end if;
      if not (
        (row_case.status = 'draft' and next_status = 'review')
        or (row_case.status = 'review' and next_status in ('approved', 'draft'))
        or (row_case.status = 'approved' and next_status in ('published', 'draft'))
        or (row_case.status = 'published' and next_status = 'archived')
        or (row_case.status = 'archived' and next_status = 'draft')
      ) then
        return jsonb_build_object('ok', false, 'error', 'forbidden_transition');
      end if;
      if next_status = 'published' then
        if length(btrim(coalesce(next_body->>'make', ''))) = 0 or length(btrim(coalesce(next_body->>'model', ''))) = 0 then
          return jsonb_build_object('ok', false, 'error', 'missing_vehicle');
        end if;
        if length(btrim(coalesce(next_body->>'problemPl', ''))) = 0
           or length(btrim(coalesce(next_body->>'diagnosisPl', ''))) = 0
           or length(btrim(coalesce(next_body->>'workPl', ''))) = 0 then
          return jsonb_build_object('ok', false, 'error', 'missing_work');
        end if;
        if coalesce(next_body->>'serviceId', '') not in ('tires', 'mechanic', 'oil', 'diagnostics', 'brakes', 'suspension', 'ac', 'timing', 'engine', 'gearbox') then
          return jsonb_build_object('ok', false, 'error', 'unknown_service');
        end if;
        if coalesce(next_body->>'year', '') <> '' and next_body->>'year' !~ '^[0-9]{4}$' then
          return jsonb_build_object('ok', false, 'error', 'unconfirmed_year');
        end if;
        if jsonb_array_length(seo.photo_ids(row_case.id, false)) = 0 then
          return jsonb_build_object('ok', false, 'error', 'missing_photo');
        end if;
        if seo.photo_ids(row_case.id, false) <> seo.photo_ids(row_case.id, true) then
          return jsonb_build_object('ok', false, 'error', 'photo_not_reviewed');
        end if;
        next_body := jsonb_set(next_body, '{publishedAt}', to_jsonb(pg_catalog.now()));
      end if;
      next_body := jsonb_set(
        next_body,
        '{history}',
        coalesce(next_body->'history', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
          'at', pg_catalog.now(), 'action', 'transition', 'from', row_case.status, 'to', next_status
        ))
      );
      insert into seo.actions (actor, action, case_id, note)
      values ('admin', 'transition', row_case.id, next_status);
    else
      service_id := coalesce(payload->>'serviceId', next_body->>'serviceId');
      if service_id not in ('tires', 'mechanic', 'oil', 'diagnostics', 'brakes', 'suspension', 'ac', 'timing', 'engine', 'gearbox') then
        return jsonb_build_object('ok', false, 'error', 'unknown_service');
      end if;
      foreach clipped in array array['make', 'model', 'generation', 'year', 'engine', 'problemPl', 'diagnosisPl', 'workPl', 'notesPl'] loop
        if payload ? clipped then
          next_body := jsonb_set(next_body, array[clipped], to_jsonb(left(btrim(coalesce(payload->>clipped, '')), 2000)));
        end if;
      end loop;
      next_body := jsonb_set(next_body, '{serviceId}', to_jsonb(service_id));
      next_body := jsonb_set(
        next_body,
        '{history}',
        coalesce(next_body->'history', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
          'at', pg_catalog.now(), 'action', 'edit', 'from', row_case.status, 'to', row_case.status
        ))
      );
      insert into seo.actions (actor, action, case_id, note)
      values ('admin', 'edit', row_case.id, 'text');
    end if;

    next_body := next_body || jsonb_build_object(
      'photoIds', seo.photo_ids(row_case.id, false),
      'reviewedPhotoIds', seo.photo_ids(row_case.id, true),
      'updatedAt', pg_catalog.now()
    );
    update seo.cases
    set version = version + 1,
        status = next_status,
        updated_at = pg_catalog.now(),
        body = next_body
    where id = row_case.id and version = expected_version;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'conflict');
    end if;
  else
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  select * into row_case from seo.cases where id = coalesce(new_id, (payload->>'id')::uuid);
  existing := jsonb_build_object('ok', true, 'op', op, 'story', seo.story(row_case));
  if new_photo is not null then
    existing := existing || jsonb_build_object(
      'photoId', new_photo,
      'storagePath', photo_path,
      'stored', false,
      'byteSize', photo_size
    );
  end if;
  if idempotency_key is not null and idempotency_key <> '' then
    insert into seo.idempotency (key, response) values (idempotency_key, existing);
  end if;
  return existing;
exception
  when others then
    return jsonb_build_object('ok', false, 'error', 'STORAGE_UNAVAILABLE');
end;
$$;

revoke all on function public.seo_case_apply(text, jsonb, integer, text) from public, anon, authenticated;
grant execute on function public.seo_case_apply(text, jsonb, integer, text) to service_role;

comment on function public.seo_case_apply(text, jsonb, integer, text) is
  'Service-role repair-case transaction. Security invoker. Not granted to anon or authenticated.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('seo-case-photos', 'seo-case-photos', false, 4194304, array['image/jpeg']::text[])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types,
    name = excluded.name;

alter table storage.objects enable row level security;

drop policy if exists seo_case_photos_block_client on storage.objects;
create policy seo_case_photos_block_client
on storage.objects
as restrictive
for all
to anon, authenticated
using (bucket_id is distinct from 'seo-case-photos')
with check (bucket_id is distinct from 'seo-case-photos');

comment on policy seo_case_photos_block_client on storage.objects is
  'Blocks client roles from the repair-case bucket even if another policy is broad. Other buckets stay unchanged.';
