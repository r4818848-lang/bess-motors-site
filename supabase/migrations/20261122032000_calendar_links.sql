create table public.workshop_calendar_links (
  calendar_key text not null,
  appointment_id text not null,
  href text not null,
  signature text not null,
  primary key(calendar_key,appointment_id),
  unique(calendar_key,href)
);
alter table public.workshop_calendar_links enable row level security;
revoke all on public.workshop_calendar_links from public,anon,authenticated;
grant select,insert,update on public.workshop_calendar_links to service_role;
