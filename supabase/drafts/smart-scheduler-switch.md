# Обратимое переключение календаря

Этот файл описывает отдельный запуск. Запуск не выполнен: `SMART_WORK_SCHEDULER` выключен, на рабочей базе `unified_calendar` не включается, а `schedulerUnifiedCalendarWired()` в приложении всегда возвращает `false`.

Шесть путей записи уже вызывают `withUnifiedCrm`. Если локальная копия недоступна или `scheduler_runtime.unified_calendar = false`, выполняется прежний код. Если на `bess_crm_copy_test` флаг включён, изменение занятости идёт одной транзакцией PostgreSQL, без второго REST upsert. Vercel production и preview к этой базе не подключаются.

## Что уже подготовлено

`withUnifiedCrm` в `src/lib/server/unified-calendar.ts` держит `crm_store` и `appointments` в одной транзакции. Приезд остаётся в `time`, начало ремонта — в `workStart`, выдача — в `pickupDate`. Стоянка без окна работы механика пост не занимает. Если две поверхности расходятся, запись отклоняется и причина возвращается вызывающему коду. Внешнее уведомление ставится в `scheduler_notification_log` и отправляется после commit; повтор того же ключа не отправляет его снова.

Включить подготовленный механизм на копии может только суперпользователь:

```sql
select public.scheduler_set_unified_calendar(true);
```

Выключить обратно:

```sql
select public.scheduler_set_unified_calendar(false);
```

Роли `scheduler_staff` и `scheduler_mechanic` не могут вызвать эту функцию и не могут создать себе сессию owner/admin. Пока функция выключена, `commitLiveCalendar` не пишет ни одной строки.

## Шесть путей

Пока `unified_calendar = false`, каждый путь пишет по-старому. При `true` на копии тот же обработчик пишет обе поверхности одной транзакцией и не вызывает второй upsert.

| Путь | Где | При выключенном флаге | При включённом флаге |
|---|---|---|---|
| Календарь Mini App | `commitStaffAppointment` | `patchCrmIfUnchanged`, затем отдельный upsert. | Одна транзакция. Режимы create, update, cancel, arrive, noshow, remove. |
| Сайт, запись клиента | `src/app/api/appointments/route.ts` POST | Сначала JSON CRM, затем строка `appointments`. | Одна транзакция, без второго upsert. |
| Удаление администратором | тот же файл, DELETE | Удаление строки, затем отдельное удаление из JSON. | Строка и JSON удаляются вместе. |
| Запись клиента в Telegram | `createTelegramBooking` | `mutateCrm`, затем upsert. | Одна транзакция. |
| Перенос клиентом | `rescheduleAppointment` | Запись JSON, затем upsert. | Одна транзакция. `time` и `workStart` не меняются, если их не передавали. |
| Быстрая запись администратора | `createQuickAppointment` | `mutateCrm`, затем upsert. | Одна транзакция. |

Остальные вызовы `mutateCrm` и `cloudPutCrmStore` меняют клиентов, язык, фото и уведомления. Они не занимают пост и в этот переключатель не входят. Их не нужно переписывать вместе с календарём.

## Как откатить переключение

1. Вернуть `scheduler_set_unified_calendar(false)`.
2. Оставить старые функции на месте: они не удаляются этим черновиком.
3. Если в боевые строки уже попали новые записи, восстановить резервную копию, снятую до запуска, а не удалять таблицы `scheduler_*` как единственный шаг.
