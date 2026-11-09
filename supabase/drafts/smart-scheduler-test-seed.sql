-- TEST DATABASE ONLY. Synthetic workshop data. No client names, phones, VINs or plates from production.
-- Do not run against production.

insert into public.scheduler_operations (operation_code, operation_name_ru, operation_name_pl, category, base_labor_hours, reference_calendar_minutes, required_resources, booking_mode, overlap_group, source)
values
  ('MA-001', 'Замена масла двигателя + фильтр', 'Wymiana oleju silnikowego i filtra', 'MA', 0.5, 45, array['mechanic','lift'], 'AUTO', 'oil_service', 'synthetic'),
  ('BR-001', 'Передние колодки, ось', 'Wymiana klocków hamulcowych przód oś', 'BR', 0.75, 60, array['mechanic','lift'], 'AUTO', 'front_brakes', 'synthetic')
on conflict (operation_code) do nothing;

-- Breaks stay empty until the owner sets one. A test seed must not invent a mandatory lunch.
