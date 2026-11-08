# Обратимое переключение календаря

Этот файл — план отдельного запуска. Сейчас он не выполнен. `SMART_WORK_SCHEDULER` выключен, `scheduler_runtime.unified_calendar` по умолчанию `false`, а `schedulerUnifiedCalendarWired()` в приложении всегда возвращает `false`.

## Что уже подготовлено

`commitLiveCalendar` в `src/lib/smart-scheduler/live-crm.ts` обновляет существующие `crm_store` и `appointments` в одной транзакции PostgreSQL. Функция отказывается работать с любой базой, кроме локальной копии `bess_crm_copy_test`. Боевые функции записи не изменены и продолжают работать по-старому.

Включить подготовленный механизм на копии может только суперпользователь:

```sql
select public.scheduler_set_unified_calendar(true);
```

Выключить обратно:

```sql
select public.scheduler_set_unified_calendar(false);
```

Роли `scheduler_staff` и `scheduler_mechanic` не могут вызвать эту функцию и не могут создать себе сессию owner/admin. Пока функция выключена, `commitLiveCalendar` не пишет ни одной строки.

## Пути записи, которые отдельный запуск должен перевести вместе

Пока каждый из них пишет `crm_store` и `appointments` двумя шагами. Их нельзя переключать по одному.

| Путь | Где | Что делает сейчас |
|---|---|---|
| Календарь Mini App | `commitStaffAppointment` | `patchCrmIfUnchanged`, затем отдельный upsert записи. Режимы create, update, cancel, arrive, noshow, remove. |
| Сайт, запись клиента | `src/app/api/appointments/route.ts` POST | Сначала JSON CRM, затем строка `appointments`. |
| Удаление администратором | тот же файл, DELETE | Удаляет только строку `appointments`. |
| Запись клиента в Telegram | `createTelegramBooking` | `mutateCrm`, затем upsert. |
| Перенос клиентом | `rescheduleAppointment` | Чтение и запись JSON, затем upsert. |
| Быстрая запись администратора | `createQuickAppointment` | `mutateCrm`, затем upsert. |

Остальные вызовы `mutateCrm` и `cloudPutCrmStore` меняют клиентов, язык, фото и уведомления. Они не занимают пост и в этот переключатель не входят. Их не нужно переписывать вместе с календарём.

## Как откатить переключение

1. Вернуть `scheduler_set_unified_calendar(false)`.
2. Оставить старые функции на месте: они не удаляются этим черновиком.
3. Если в боевые строки уже попали новые записи, восстановить резервную копию, снятую до запуска, а не удалять таблицы `scheduler_*` как единственный шаг.
