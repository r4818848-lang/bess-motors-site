create table public.workshop_cash_plan (
  id bigint generated always as identity primary key,
  request_key text not null unique,
  kind text not null check (kind in ('balance','in','out','wage','settle')),
  cents bigint not null check (abs(cents) <= 99999999999),
  due date not null,
  label text not null,
  settles bigint unique references public.workshop_cash_plan(id),
  check ((kind = 'settle') = (settles is not null)),
  check (kind = 'balance' or (kind = 'settle' and cents = 0) or cents > 0)
);
alter table public.workshop_cash_plan enable row level security;
revoke all on public.workshop_cash_plan from public, anon, authenticated;
grant select,insert on public.workshop_cash_plan to service_role;
grant usage,select on sequence public.workshop_cash_plan_id_seq to service_role;
