create or replace function public.commit_crm_snapshot(expected_version timestamptz, next_doc jsonb)
returns timestamptz language plpgsql security invoker set search_path='' as $$
declare
  previous jsonb; stamp timestamptz;
begin
  if jsonb_typeof(next_doc->'appointments') is distinct from 'array' then raise exception 'invalid appointments'; end if;
  if expected_version is null then
    insert into public.crm_store(id,doc,updated_at) values ('main',next_doc,clock_timestamp())
    on conflict do nothing returning updated_at into stamp;
    if not found then return null; end if;
    previous='[]'::jsonb;
  else
    select doc->'appointments' into previous from public.crm_store
      where id='main' and updated_at=expected_version for update;
    if not found then return null; end if;
    update public.crm_store set doc=next_doc,updated_at=greatest(clock_timestamp(),updated_at+interval '1 microsecond')
      where id='main' returning updated_at into stamp;
  end if;
  with prior as (select a->>'id' id,a from jsonb_array_elements(previous) a)
  insert into public.appointments (id, client_phone, user_id, doc, created_at)
    select n->>'id', coalesce(n->>'clientPhone',''),coalesce(n->>'userId',''),n,
      coalesce(nullif(n->>'createdAt','')::timestamptz,now())
    from jsonb_array_elements(next_doc->'appointments') n left join prior p on p.id=n->>'id'
    where p.a is distinct from n
    on conflict(id) do update set doc=excluded.doc,user_id=excluded.user_id,client_phone=excluded.client_phone;
  return stamp;
end;
$$;
revoke all on function public.commit_crm_snapshot(timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.commit_crm_snapshot(timestamptz,jsonb) to service_role;
