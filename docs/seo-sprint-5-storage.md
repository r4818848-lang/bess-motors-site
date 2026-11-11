# SEO sprint 5.2 — хранение реальных работ

Модуль каталога `/realizacje` остаётся **BLOCKED**. Этот документ готовит включение, но не включает его. Миграция на production не выполнялась. Флаг `SEO_CASE_STORAGE` не ставился. Секреты, cron, Telegram и Google Analytics не менялись.

## К какому проекту подключена production

Серверная переменная `SUPABASE_URL` на https://www.bess-motors.com задана и проходит проверку формата. Публичный health отдаёт только начало адреса. Это начало совпадает с проектом `jipdvrumfcxmdlxhffmt` и не совпадает с `hllrmowmoyayukkaslxz` (`bess-motors-crm-restore-test`). Второй проект не используется.

Имена переменных, без значений: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`. Флага `SEO_CASE_STORAGE` в ответе health нет. Ключ service role наружу не выводится. Панель SEO по-прежнему пускает только роль `admin` из собственного JWT сайта.

## Архитектура

Используется уже существующий проект Supabase, не новый сервис и не документ CRM.

| Данные | Где лежат |
| --- | --- |
| Текст кейса, статус, версия | `seo.cases` |
| Путь, размер, факт сохранения и одобрения фото | `seo.photos` |
| Журнал решений владельца | `seo.actions`, только добавление |
| Повтор того же запроса | `seo.idempotency` |
| Байты JPEG | приватный bucket `seo-case-photos` |

Схема `seo` не добавляется в список схем Data API. Таблицы с включённым RLS и без политик для клиентских ролей. `anon` и `authenticated` не получают права на схему, таблицы и функцию. Функция `public.seo_case_apply` — `security invoker`, `search_path` только `pg_catalog`, `execute` только у `service_role`. Внутри она ещё проверяет, что текущая роль — `service_role`. `security definer` нет.

Запись идёт одной транзакцией: блокировка строки `for update`, сравнение версии, журнал и ключ повтора. Повтор с тем же ключом не создаёт второй кейс и не заменяет уже сохранённое фото. Две правки одной версии дают один успех и один `conflict`.

Сайт принимает JPEG, PNG и WebP, проверяет байты, декодирует и записывает новый JPEG без EXIF. В bucket уходит уже этот JPEG, не исходный файл и не base64 в JSON. Прямой путь от клиента не принимается: база выдаёт путь вида `{case}/{photo}.jpg`. Сервер отклоняет любой другой путь, включая `..`.

Черновик, проверка и одобрение не получают публичную ссылку. Объект отдаётся через маршрут сайта только если статус `published`, файл сохранён, владелец отдельно подтвердил кадр и кейс не в архиве. Архив убирает кейс из списка и sitemap, но не удаляет файл. Автоматическая проверка не доказывает, что на кадре нет лица, номера или VIN. Это по-прежнему ручной шаг владельца.

Публичный bucket `work-order-files` для кейсов не используется. Таблицы `public.crm_store` и `public.appointments` миграция не читает и не меняет.

Пока флаг не равен `supabase` или таблицы не созданы, создание, загрузка и публикация отвечают `STORAGE_NOT_CONFIGURED`. Сбой базы или Storage отвечает `STORAGE_UNAVAILABLE`, а не пустым списком. Sitemap при этом собирается без URL кейсов.

## Расходы

Новой подписки нет. Метаданные — килобайты в текущей базе. Фото после перекодирования обычно 150–600 КБ, не больше 4 МБ, не больше 8 кадров на кейс. Двести кейсов — примерно 0,2–1 ГБ.

Курс NBP на 10 ноября 2026: 1 USD = 3,9099 PLN. Сверх квоты Storage на плане Pro это $0,0213 за ГБ в месяц, около 0,08 PLN за ГБ в месяц. На Free в квоту входит 1 ГБ Storage, на Pro — 100 ГБ. Преобразования изображений Supabase не используются. Пока объём внутри уже оплаченной квоты, добавка 0 PLN. Тариф текущего проекта из этого репозитория не виден, поэтому превышение квоты здесь не обещается и не исключается.

## Что сделать владельцу отдельно

Это не сделано в этом PR и не должно запускаться без отдельного разрешения.

1. Открыть SQL Editor только проекта `jipdvrumfcxmdlxhffmt`. Не открывать `hllrmowmoyayukkaslxz`.
2. Выполнить проверки до миграции.
3. Выполнить файл `supabase/migrations/20261111190000_seo_case_private_storage.sql` целиком один раз.
4. Выполнить проверки после миграции.
5. Только после успешных проверок, отдельным решением, поставить в production `SEO_CASE_STORAGE=supabase`. Новых секретов не нужно: сервер уже использует `SUPABASE_SERVICE_ROLE_KEY`. Имя bucket кейсов фиксировано и не берётся из `SUPABASE_STORAGE_BUCKET`.

### До миграции

```sql
select to_regclass('seo.cases') as seo_cases;
select to_regclass('public.crm_store') as crm_document, count(*) as crm_rows from public.crm_store;
select to_regclass('public.appointments') as appointments, count(*) as appointment_rows from public.appointments;
select id, public from storage.buckets where id in ('seo-case-photos', 'work-order-files');
```

Ожидание: `seo.cases` пусто, обе существующие таблицы на месте, их числа строк записаны. Если `seo.cases` уже есть, миграцию не запускать.

### После миграции

```sql
select public, file_size_limit from storage.buckets where id = 'seo-case-photos';
select prosecdef from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'seo_case_apply';
select has_function_privilege('anon', 'public.seo_case_apply(text,jsonb,integer,text)', 'execute') as anon_execute,
       has_schema_privilege('anon', 'seo', 'usage') as anon_schema,
       has_schema_privilege('authenticated', 'seo', 'usage') as authenticated_schema;
select count(*) as crm_rows from public.crm_store;
select count(*) as appointment_rows from public.appointments;
```

Ожидание: bucket `public = false`, `prosecdef = false`, все три привилегии `false`, числа строк CRM и записей те же, что до миграции.

## Откат без потери данных

Если в `seo.cases` ещё нет строк и в bucket нет объектов, можно убрать только новые объекты:

```sql
drop function if exists public.seo_case_apply(text, jsonb, integer, text);
drop function if exists seo.story(seo.cases);
drop function if exists seo.photo_ids(uuid, boolean);
drop table if exists seo.idempotency;
drop table if exists seo.actions;
drop table if exists seo.photos;
drop table if exists seo.cases;
drop schema if exists seo;
drop policy if exists seo_case_photos_block_client on storage.objects;
delete from storage.buckets
where id = 'seo-case-photos'
  and not exists (select 1 from storage.objects where bucket_id = 'seo-case-photos');
```

Если строки или файлы уже есть, таблицы и bucket не удалять. Достаточно убрать `SEO_CASE_STORAGE`: сайт снова отвечает `STORAGE_NOT_CONFIGURED`, а данные остаются приватными. `crm_store` и `appointments` не входят в откат.

## Проверки

Локальная база создаётся на этом компьютере и удаляется в конце. В неё не копируются клиенты. Тест отказывается идти на хост, отличный от localhost. Production SQL не запускался.

Проверено на этой базе: `anon` не вызывает функцию и не пишет в bucket кейсов; запись в другой bucket этой политикой не закрывается; повтор запроса не создаёт второй кейс; чужая версия даёт `conflict`; две параллельные правки одной версии дают один успех и один `conflict`; черновик и архив не отдают фото; публикация без подтверждения кадра запрещена; отказ вставки не стирает уже записанные строки; sentinel-строки двух существующих таблиц остаются на месте.

Клиент Storage проверяется подменой сети: байты не кладутся в JSON функции, запрос идёт в приватный URL, путь с `..` не скачивается, ответ 503 становится `STORAGE_UNAVAILABLE`.

## Локальный прогон, 11 ноября 2026

- lint: exit 0, прежние предупреждения `dbTick` и `next/script`
- `tsc --noEmit`: exit 0
- `next build`: exit 0, 142 страницы
- `test:unit`, включая SQL на временной локальной базе: зелёный
- `test:lead-notices`: зелёный. Без токена Telegram тест пишет ожидаемый отказ и проходит
- `validate:prices`: 150 строк, ok
- Playwright на `127.0.0.1:3456`: 125 passed, 4 skipped. Readonly: 1 passed
- `/realizacje` без флага: 404. Sitemap собирается и не содержит `/realizacje`

Код хранения: `109cde9cdc1a25fcf1b7a4d5887102170a550f9a`. GitHub Actions и Vercel Preview дописываются после push. Merge не делается.
