-- TEST DATABASE ONLY. Synthetic workshop data. No client names, phones, VINs or plates from production.
-- Do not run against production.

insert into public.scheduler_operations (operation_code, operation_name_ru, operation_name_pl, category, base_labor_hours, reference_calendar_minutes, required_resources, booking_mode, overlap_group, source)
values
  ('MA-001', 'Замена масла двигателя + фильтр', 'Wymiana oleju silnikowego i filtra', 'MA', 0.5, 45, array['mechanic','lift'], 'AUTO', 'oil_service', 'synthetic'),
  ('BR-001', 'Передние колодки, ось', 'Wymiana klocków hamulcowych przód oś', 'BR', 0.75, 60, array['mechanic','lift'], 'AUTO', 'front_brakes', 'synthetic')
on conflict (operation_code) do nothing;

insert into public.scheduler_breaks (mechanic_id, starts_at, ends_at)
values
  ('mech-1', '13:00', '13:20'),
  ('mech-2', '13:30', '13:50')
on conflict do nothing;
