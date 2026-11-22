-- Both representations of a staff booking advance in the same transaction.
create or replace function public.commit_staff_appointment(
  expected_version timestamptz, next_doc jsonb, appointment_id text
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  booking jsonb;
begin
  select value into strict booking from jsonb_array_elements(next_doc->'appointments')
  where value->>'id' = appointment_id;
  update public.crm_store set doc = next_doc,
    updated_at = greatest(clock_timestamp(), updated_at + interval '1 microsecond')
    where id = 'main' and updated_at = expected_version;
  if not found then return false; end if;
  insert into public.appointments(id, client_phone, user_id, doc, created_at)
    values (appointment_id, coalesce(booking->>'clientPhone',''),
      coalesce(booking->>'userId',''), booking, coalesce((booking->>'createdAt')::timestamptz, now()))
    on conflict (id) do update set client_phone = excluded.client_phone,
      user_id = excluded.user_id, doc = excluded.doc;
  return true;
end;
$$;
revoke all on function public.commit_staff_appointment(timestamptz,jsonb,text) from public,anon,authenticated;
grant execute on function public.commit_staff_appointment(timestamptz,jsonb,text) to service_role;
