# Пилот Smart Scheduler в существующей Supabase

Это план, а не выполненная миграция. Не запускать на боевом проекте, пока владелец не снимет резервную копию и явно не попросит включение. `SMART_WORK_SCHEDULER` остаётся выключенным. `schedulerUnifiedCalendarWired()` в коде приложения всегда `false`: боевые маршруты не переключены. Отдельная production-база не нужна.

Тестовые базы `bess_scheduler_test` и `bess_crm_copy_test` остаются локальными. Код отвергает адрес Supabase и запись при `VERCEL_ENV=production` или `preview`.

## Что является одним источником истины

На копии реальной схемы создание, перенос и отмена проходят одну транзакцию `commitLiveCalendar`:

1. `scheduler_lock_workshop()` берёт общий замок. Только после этого `scheduler_issue_snapshot()` и `scheduler_assert_crm()` считают digest.
2. `scheduler_load_actor()` читает серверную сессию. `scheduler_open_session()` не выдана ролям `scheduler_staff` и `scheduler_mechanic`. Значения `app.actor_role` и `app.actor_mechanic` не дают прав.
3. Digest сравнивает содержимое существующих `crm_store.doc.appointments` и `appointments.doc`: идентификатор, механик, дата, `workStart`, `workMinutes`, ресурс, статус и активность. Сортировка каноническая. Дата и время — Europe/Warsaw. Одинакового количества интервалов недостаточно.
4. До коммита проверяется пересечение с другими записями CRM и с подтверждёнными бронями планировщика.
5. `crm_store` и `appointments` меняются вместе. Частичная запись откатывается.

`scheduler_store_appointments` и `scheduler_row_appointments` остаются только тестовыми зеркалами. Боевой путь их не подставляет вместо CRM.

Шесть путей уже вызывают `withUnifiedCrm`. Пока SQL-флаг выключен, выполняется прежний код. Если процесс явно включил `SCHEDULER_UNIFIED_CALENDAR=on`, а транзакционная база недоступна, сохранение возвращает 503 и ничего не пишет. Адрес боевой Supabase по-прежнему отвергается: `productionCrmUrl()` в этом выпуске всегда пустой. Просмотр расписания не требует права записи: роль `scheduler_reader` имеет только `SELECT`, а ответ доски календаря помечен `writeRequired: false`. Обратимое включение описано в `supabase/drafts/smart-scheduler-switch.md`.

## Миграция

Файл `supabase/drafts/smart-scheduler.sql` создаёт только объекты `scheduler_*`, роли и функции. Он не создаёт и не изменяет `crm_store`, `appointments` и клиентов. Строка `scheduler_runtime` по умолчанию держит `live_crm` и `unified_calendar` выключенными. На боевом Supabase файл можно применить только после копии и только к этому проекту.

## Восстановление

1. Остановить запись: оставить `SMART_WORK_SCHEDULER` пустым, не ставить `SCHEDULER_TEST_WRITES` и не вызывать `scheduler_set_unified_calendar(true)`.
2. Если применён только черновик и боевые записи не менялись, выполнить `supabase/drafts/smart-scheduler-rollback.sql`. Он удаляет объекты `scheduler_*` и не трогает `crm_store` и `appointments`.
3. Если пилот уже писал боевые записи, восстанавливать проект из резервной копии, снятой до включения, а не из отката черновика.
4. Проверить, что сайт снова открывает прежний календарь и что новые таблицы `scheduler_*` отсутствуют.

## Шаги включения

1. Снять полную резервную копию текущего Supabase и проверить, что она открывается.
2. На копии, не на боевом проекте, применить `smart-scheduler.sql`. Таблицы `crm_store` и `appointments` уже должны существовать.
3. Сверить канонические строки `crm_store` и `appointments`. Пока они расходятся, новая запись должна получать отказ, а не выбирает одну из копий.
4. Шесть путей из `smart-scheduler-switch.md` уже вызывают `withUnifiedCrm`. Пока SQL-флаг выключен, у каждого остаётся прежний `patchCrmIfUnchanged` или upsert. Включать флаг на боевой базе этим шагом нельзя: сначала резервная копия и сверка поверхностей.
5. Прогнать локальные PostgreSQL-тесты на `bess_scheduler_test` и на `bess_crm_copy_test`.
6. Только после этого владелец может включить `SMART_WORK_SCHEDULER` на боевом проекте. До этого шага флаг не включается.
