-- Runs after the migration, as a superuser, on the disposable local database.

do $checks$
declare
  cases_count integer;
  appointment_count integer;
  bucket_public boolean;
  definer boolean;
begin
  select count(*) into cases_count from public.crm_store where id = 'main' and data = '{"sentinel":true}'::jsonb;
  if cases_count <> 1 then
    raise exception 'crm document changed';
  end if;
  select count(*) into appointment_count from public.appointments where id = 1 and note = 'sentinel';
  if appointment_count <> 1 then
    raise exception 'appointment rows changed';
  end if;
  select public into bucket_public from storage.buckets where id = 'seo-case-photos';
  if bucket_public is distinct from false then
    raise exception 'repair-case bucket is not private';
  end if;
  select proc.prosecdef into definer
  from pg_proc as proc
  join pg_namespace as ns on ns.oid = proc.pronamespace
  where ns.nspname = 'public' and proc.proname = 'seo_case_apply';
  if definer is distinct from false then
    raise exception 'function is security definer';
  end if;
  if has_function_privilege('anon', 'public.seo_case_apply(text,jsonb,integer,text)', 'execute') then
    raise exception 'anon can execute the function';
  end if;
  if has_function_privilege('authenticated', 'public.seo_case_apply(text,jsonb,integer,text)', 'execute') then
    raise exception 'authenticated can execute the function';
  end if;
  if has_schema_privilege('anon', 'seo', 'usage') or has_schema_privilege('authenticated', 'seo', 'usage') then
    raise exception 'client role can use the seo schema';
  end if;
  if has_table_privilege('anon', 'seo.cases', 'select')
     or has_table_privilege('authenticated', 'seo.photos', 'select')
     or has_table_privilege('anon', 'seo.actions', 'select')
     or has_table_privilege('authenticated', 'seo.idempotency', 'select') then
    raise exception 'client role can read repair cases';
  end if;
end
$checks$;

do $anon$
begin
  begin
    set local role anon;
    perform public.seo_case_apply('list', '{}'::jsonb, null, null);
    raise exception 'anon listed cases';
  exception
    when insufficient_privilege then
      null;
  end;
  begin
    set local role authenticated;
    perform 1 from seo.cases;
    raise exception 'authenticated read cases';
  exception
    when insufficient_privilege then
      null;
  end;
  begin
    set local role anon;
    insert into storage.objects (bucket_id, name) values ('seo-case-photos', 'secret.jpg');
    raise exception 'anon wrote the private bucket';
  exception
    when insufficient_privilege then
      null;
  end;
end
$anon$;

set role anon;
insert into storage.objects (bucket_id, name) values ('work-order-files', 'order.jpg');
reset role;

set role service_role;

do $flow$
declare
  created jsonb;
  again jsonb;
  photo jsonb;
  visible jsonb;
  case_id uuid;
  photo_id uuid;
  version integer;
  case_count integer;
  photo_count integer;
  action_count integer;
begin
  created := public.seo_case_apply(
    'create',
    jsonb_build_object(
      'make', 'Audi',
      'model', 'Q5',
      'year', '2018',
      'problemPl', 'Bicie kierownicy',
      'diagnosisPl', 'Zuzyte klocki',
      'workPl', 'Wymiana klockow',
      'serviceId', 'brakes'
    ),
    null,
    'idem-create-0001'
  );
  if created->>'ok' <> 'true' then
    raise exception 'create failed: %', created->>'error';
  end if;
  again := public.seo_case_apply(
    'create',
    jsonb_build_object(
      'make', 'Audi',
      'model', 'Q5',
      'problemPl', 'Bicie kierownicy',
      'diagnosisPl', 'Zuzyte klocki',
      'workPl', 'Wymiana klockow',
      'serviceId', 'brakes'
    ),
    null,
    'idem-create-0001'
  );
  if again->>'replayed' <> 'true' or again->'story'->>'id' <> created->'story'->>'id' then
    raise exception 'create replay failed';
  end if;
  select count(*) into case_count from seo.cases;
  if case_count <> 1 then
    raise exception 'create wrote a second case';
  end if;

  case_id := (created->'story'->>'id')::uuid;
  version := (created->'story'->>'version')::integer;
  if (public.seo_case_apply('transition', jsonb_build_object('id', case_id, 'status', 'published'), version, null)->>'error') <> 'forbidden_transition' then
    raise exception 'draft was published directly';
  end if;

  photo := public.seo_case_apply('attach_photo', jsonb_build_object('id', case_id, 'byteSize', 1200), version, 'idem-photo-0001');
  if photo->>'ok' <> 'true' then
    raise exception 'attach failed: %', photo->>'error';
  end if;
  if photo->>'storagePath' !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' or position('..' in photo->>'storagePath') > 0 then
    raise exception 'unsafe photo path';
  end if;
  if photo ? 'bytes' then
    raise exception 'photo bytes were stored in the response';
  end if;
  photo_id := (photo->>'photoId')::uuid;
  version := (photo->'story'->>'version')::integer;
  if (public.seo_case_apply('public_photo', jsonb_build_object('caseId', case_id, 'photoId', photo_id), null, null)->>'error') <> 'not_found' then
    raise exception 'unstored photo was public';
  end if;

  photo := public.seo_case_apply('confirm_photo', jsonb_build_object('id', case_id, 'photoId', photo_id), null, 'idem-photo-0001');
  if photo->>'stored' <> 'true' then
    raise exception 'confirm failed';
  end if;
  again := public.seo_case_apply('attach_photo', jsonb_build_object('id', case_id, 'byteSize', 1200), version, 'idem-photo-0001');
  if again->>'replayed' <> 'true' or again->>'photoId' <> photo_id::text or again->>'stored' <> 'true' then
    raise exception 'photo replay failed';
  end if;
  select count(*) into photo_count from seo.photos;
  if photo_count <> 1 then
    raise exception 'photo replay inserted another row';
  end if;

  created := public.seo_case_apply('transition', jsonb_build_object('id', case_id, 'status', 'review'), version, null);
  if created->>'ok' <> 'true' then
    raise exception 'review transition failed';
  end if;
  version := (created->'story'->>'version')::integer;
  created := public.seo_case_apply('transition', jsonb_build_object('id', case_id, 'status', 'approved'), version, null);
  if created->>'ok' <> 'true' then
    raise exception 'approved transition failed';
  end if;
  version := (created->'story'->>'version')::integer;
  if (public.seo_case_apply('transition', jsonb_build_object('id', case_id, 'status', 'published'), version, null)->>'error') <> 'photo_not_reviewed' then
    raise exception 'unreviewed photo was published';
  end if;
  created := public.seo_case_apply('review_photo', jsonb_build_object('id', case_id, 'photoId', photo_id), version, null);
  if created->>'ok' <> 'true' then
    raise exception 'owner review failed: %', created->>'error';
  end if;
  version := (created->'story'->>'version')::integer;
  created := public.seo_case_apply('transition', jsonb_build_object('id', case_id, 'status', 'published'), version, null);
  if created->>'ok' <> 'true' then
    raise exception 'publish failed: %', created->>'error';
  end if;
  version := (created->'story'->>'version')::integer;

  visible := public.seo_case_apply('public_photo', jsonb_build_object('caseId', case_id, 'photoId', photo_id), null, null);
  if visible->>'ok' <> 'true' or visible->>'storagePath' !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' or visible ? 'bytes' then
    raise exception 'published photo was not a private path';
  end if;
  if (public.seo_case_apply('update', jsonb_build_object('id', case_id, 'notesPl', 'stara'), version - 1, null)->>'error') <> 'conflict' then
    raise exception 'stale version was accepted';
  end if;
  created := public.seo_case_apply('update', jsonb_build_object('id', case_id, 'notesPl', 'nowa'), version, null);
  if created->>'ok' <> 'true' or created->'story'->'body'->>'notesPl' <> 'nowa' then
    raise exception 'update failed';
  end if;
  version := (created->'story'->>'version')::integer;

  created := public.seo_case_apply('transition', jsonb_build_object('id', case_id, 'status', 'archived'), version, null);
  if created->>'ok' <> 'true' then
    raise exception 'archive failed';
  end if;
  if (public.seo_case_apply('public_photo', jsonb_build_object('caseId', case_id, 'photoId', photo_id), null, null)->>'error') <> 'not_found' then
    raise exception 'archived photo stayed public';
  end if;
  visible := public.seo_case_apply('list_published', '{}'::jsonb, null, null);
  if jsonb_array_length(visible->'cases') <> 0 then
    raise exception 'archived case stayed in the public list';
  end if;
  select count(*) into action_count from seo.actions;
  if action_count < 5 then
    raise exception 'owner history was not kept';
  end if;
end
$flow$;

reset role;

revoke insert on seo.cases from service_role;
set role service_role;

do $outage$
declare
  result jsonb;
  before_count integer;
  after_count integer;
begin
  select count(*) into before_count from seo.cases;
  result := public.seo_case_apply(
    'create',
    jsonb_build_object(
      'make', 'Audi',
      'model', 'A4',
      'problemPl', 'Stuk',
      'diagnosisPl', 'Wahacz',
      'workPl', 'Wymiana',
      'serviceId', 'suspension'
    ),
    null,
    'idem-fail-0001'
  );
  if result->>'error' <> 'STORAGE_UNAVAILABLE' then
    raise exception 'database refusal was not reported';
  end if;
  select count(*) into after_count from seo.cases;
  if after_count <> before_count then
    raise exception 'database refusal removed rows';
  end if;
end
$outage$;

reset role;
grant insert on seo.cases to service_role;
