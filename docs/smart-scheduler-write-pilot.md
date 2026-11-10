# Локальный допуск записи владельца

Боевой Smart Scheduler остаётся просмотром. Этот документ описывает отдельную дверь записи, которая по умолчанию закрыта и не открывается на Vercel.

Жёсткие функции не менялись и по-прежнему закрыты:

- `schedulerCrmWritesEnabled()` всегда `false`
- `schedulerUnifiedCalendarWired()` всегда `false`
- `productionCrmUrl()` всегда пустой

## Что делает `SCHEDULER_OWNER_WRITE_PILOT=local`

Переменная действует только вне `VERCEL_ENV=production` и `preview`. Если одновременно включён read-only пилот, запись не открывается.

Открывается страница `/telegram/scheduler` с формой. Сохранить бронь может только владелец Telegram. Администратор получает `403 owner_only`. Механик без права редактирования получает `403`. Назначение `mech-2` в этом режиме возвращает `409 mechanic_not_confirmed`.

База принимается только локальная `bess_scheduler_test`. Адрес Supabase отклоняется. Если база не задана, ответ `503`, `persisted: false`, `crmWritten: false`.

`POST /api/internal/schedule/plan` ничего не записывает. Он считает пакетное время и причину отказа.

## Что включается только локально

Создание, перенос и отмена идут через `commitSchedulerToCrm`. Функция подключается только к локальной копии `bess_crm_copy_test` и в одной транзакции обновляет `crm_store`, строку `appointments`, бронь планировщика и `scheduler_change_log`. `crmWritten: true` означает, что обе поверхности копии записаны. Боевой Supabase эта функция не вызывает. `schedulerCrmWritesEnabled()` по-прежнему всегда `false`.

Повтор того же `idempotencyKey` возвращает уже созданную запись. Чужая версия даёт `409`. Ошибка посередине откатывает всю транзакцию. Отмена ставит статус `cancelled` и оставляет строку. Новый клиент и автомобиль создаются только если владелец явно это подтвердил. Заказ-наряд не создаётся.

Если копия недоступна, ответ `503` и `crmWritten: false`. Подбор времени читает занятость с копии и игнорирует интервалы, присланные браузером.

Норма берётся из `data/smart-scheduler/bess_operation_seed.csv`. Пакет «диски + колодки» не суммируется с отдельной заменой колодок той же оси. Норма без минут помечается как неподтверждённая, а не как заводская.

Сергей может получить рекомендацию. Механик 2 в режиме живых записей в рекомендации не попадает. Подъёмник без подтверждённого UDT по-прежнему не готов к AUTO.

## Как включить локально

1. Не задавать переменную на Vercel.
2. Поднять пустую PostgreSQL `bess_scheduler_test` и копию `bess_crm_copy_test`.
3. Применить `supabase/drafts/smart-scheduler.sql` только к этим базам.
4. Задать `SCHEDULER_OWNER_WRITE_PILOT=local` и `SCHEDULER_DATABASE_URL` на локальный адрес.
5. Открыть Mini App под учётной записью владельца.

## Как откатить

Удалить `SCHEDULER_OWNER_WRITE_PILOT`. Страница снова отвечает 404, пока не включён отдельный read-only. Локальные таблицы снимает `supabase/drafts/smart-scheduler-rollback.sql`. Он не трогает `crm_store` и `appointments`.

На боевой Supabase эти файлы не применялись. Журнал `scheduler_change_log` добавлен только в черновик.

## Что остаётся выключенным в production

`SMART_WORK_SCHEDULER`, `SCHEDULER_UNIFIED_CALENDAR`, `SCHEDULER_TEST_WRITES`, SQL `unified_calendar` и запись Smart Scheduler. Read-only включается по-прежнему отдельно и сам по себе запись не даёт.
