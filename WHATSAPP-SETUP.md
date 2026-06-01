# WhatsApp Business — пошаговая настройка (BESS MOTORS)

Бот отправляет клиентам уведомления **автоматически** (как Telegram): подпись заказ-наряда, статус, «авто готово», напоминания из CRM.

**Время:** 30–60 минут (плюс ожидание одобрения шаблонов Meta, если нужны).

---

## Что понадобится

- Аккаунт [Meta Business](https://business.facebook.com/)
- Подключённый **WhatsApp Business** на номер сервиса
- Доступ к **Vercel** (проект сайта bess-motors)
- Сайт уже на домене: `https://www.bess-motors.com`

---

## Шаг 1. Meta — открыть WhatsApp API

1. Войдите в [business.facebook.com](https://business.facebook.com/).
2. Выберите свой бизнес-аккаунт BESS MOTORS.
3. Меню слева: **Настройки бизнеса** → **Аккаунты** → **WhatsApp-аккаунты**  
   *(или: WhatsApp Manager → API Setup)*.
4. Откройте раздел **API Setup** / **Настройка API**.

Запишите:

| В Meta называется | Куда на сайте (Vercel) |
|-------------------|-------------------------|
| **Phone number ID** | `WHATSAPP_PHONE_NUMBER_ID` |
| **WhatsApp Business Account ID** | (для справки, в env не обязателен) |

---

## Шаг 2. Meta — постоянный токен (Access Token)

1. [developers.facebook.com](https://developers.facebook.com/) → **Мои приложения**.
2. Выберите приложение, к которому привязан WhatsApp (или создайте тип **Business**).
3. **Настройки** → **Основное** → скопируйте **Секрет приложения** → это `WHATSAPP_APP_SECRET`.
4. **Инструменты** → **Graph API Explorer** или **Business Settings**:
   - Создайте **System User** (системный пользователь).
   - Назначьте ему активы WhatsApp.
   - Сгенерируйте токен с правами:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
5. Скопируйте длинный токен `EAA...` → это `WHATSAPP_ACCESS_TOKEN`.

> Токен из кнопки «Временный» в API Setup **не подходит** для продакшена — нужен **постоянный** токен System User.

---

## Шаг 3. Придумать секретные строки

На листочке или в блокноте создайте **две разные** случайные строки (буквы+цифры, 20+ символов):

**Пример (не копируйте — свои!):**

```
WHATSAPP_WEBHOOK_VERIFY_TOKEN = BessWaVerify_8k2mN9pQ7xL4
WHATSAPP_SETUP_KEY            = BessWaSetup_3jR6vT1wY8
```

- **VERIFY_TOKEN** — Meta введёт при настройке webhook.
- **SETUP_KEY** — только вы откроете ссылку проверки в браузере.

---

## Шаг 4. Vercel — добавить переменные

1. [vercel.com](https://vercel.com) → проект **bess-motors** (или как называется репозиторий).
2. **Settings** → **Environment Variables**.
3. Добавьте для **Production** (и при желании Preview):

| Имя переменной | Значение |
|----------------|----------|
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID из шага 1 |
| `WHATSAPP_ACCESS_TOKEN` | Токен `EAA...` из шага 2 |
| `WHATSAPP_APP_SECRET` | Секрет приложения Meta |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Ваша строка из шага 3 |
| `WHATSAPP_SETUP_KEY` | Вторая строка из шага 3 |
| `WHATSAPP_TEMPLATE_LANG` | `pl` (или `ru`) |
| `WHATSAPP_ALLOW_PHONE_FALLBACK` | `true` |

4. Нажмите **Save**.
5. **Deployments** → последний деплой → **Redeploy** (чтобы переменные применились).

---

## Шаг 5. Meta — подключить Webhook

1. Meta → WhatsApp → **Configuration** / **Конфигурация** → **Webhook**.
2. Нажмите **Edit** / **Изменить**.

| Поле | Что вписать |
|------|-------------|
| **Callback URL** | `https://www.bess-motors.com/api/whatsapp/webhook` |
| **Verify token** | **Точно** то же, что `WHATSAPP_WEBHOOK_VERIFY_TOKEN` на Vercel |

3. Нажмите **Verify and save**.  
   - Если ошибка — проверьте redeploy на Vercel и совпадение verify token.
4. В **Webhook fields** включите подписку: **messages** (галочка).

---

## Шаг 6. Проверить, что сайт «видит» WhatsApp

После успешного redeploy откройте в браузере (подставьте свой `WHATSAPP_SETUP_KEY`):

```
https://www.bess-motors.com/api/whatsapp/setup?key=ВАШ_WHATSAPP_SETUP_KEY
```

Должен быть JSON примерно такой:

```json
{
  "ok": true,
  "webhookUrl": "https://www.bess-motors.com/api/whatsapp/webhook",
  "verifyTokenSet": true,
  "displayPhone": "+48..."
}
```

Если `"ok": false` — не заданы `WHATSAPP_PHONE_NUMBER_ID` или `WHATSAPP_ACCESS_TOKEN`.

**Дополнительно:** в CRM → настройки → блок **«Integracje serwera»** — строки `whatsapp_api` и `whatsapp_webhook` должны быть зелёными.

Или: `https://www.bess-motors.com/api/health` — в списке `checks` найдите `whatsapp_api`, `whatsapp_webhook`.

---

## Шаг 7. Привязать клиента (первый тест)

1. В CRM у клиента должен быть **тот же телефон**, что в WhatsApp (формат +48…).
2. С **телефона клиента** (или своего тестового) напишите в WhatsApp на **номер сервиса**:
   ```
   меню
   ```
3. Бот должен ответить меню и кнопкой «Кабинет».
4. В CRM откройте заказ-наряд этого клиента → блок **«Сообщения клиенту»**:
   - **WA↑** — отправка **автоматически** (как TG);
   - **WA** — открывает чат с готовым текстом (вручную).

---

## Шаг 8. Проверить автоматику из CRM

1. Создайте или откройте заказ-наряд с привязанным клиентом (телефон + тестовый WA).
2. Поставьте статус **«Готов»** или отправьте **WA↑** → шаблон **«Готово»**.
3. Клиент должен получить сообщение в WhatsApp.

**Подпись:** заказ в статусе «ожидает подпись» → **WA↑** у шаблона **«Подпись»** или сохранение заказа (автоуведомление).

---

## Шаг 9. Шаблоны Meta (если клиент давно не писал)

WhatsApp разрешает **свободный текст** только **24 часа** после последнего сообщения клиента.

Если клиент не писал давно — нужны **одобренные шаблоны** в Meta:

1. WhatsApp Manager → **Message templates** → **Create template**.
2. Категория: **Utility**.
3. Пример имени: `car_ready`, язык **Polish**.
4. Текст с переменными `{{1}}`, `{{2}}` (авто, номер заказа).
5. Дождитесь статуса **Approved**.

На Vercel добавьте (имена = как в Meta):

```env
WHATSAPP_TEMPLATE_SIGN=order_sign_reminder
WHATSAPP_TEMPLATE_READY=car_ready
WHATSAPP_TEMPLATE_STATUS=order_status
```

Сайт сначала шлёт обычный текст; если Meta отклонит — повторит через шаблон.

---

## Как пользоваться каждый день (CRM)

| Кнопка | Действие |
|--------|----------|
| **TG** | Авто в Telegram (нужен подключённый Telegram у клиента) |
| **WA↑** | Авто в WhatsApp через API |
| **WA** | Открыть WhatsApp с готовым текстом — вы нажимаете «Отправить» |
| Копировать | Скопировать текст в буфер |

При **сохранении** заказ-наряда уведомления уходят сами в Telegram и/или WhatsApp.

**Команды клиента в WhatsApp:** `меню`, `статус`, `подпись`, `кабинет`.

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| Webhook не верифицируется | Redeploy Vercel; verify token **буква в букву** как на Vercel |
| `ok: false` в /api/whatsapp/setup | Проверить PHONE_NUMBER_ID и ACCESS_TOKEN |
| Сообщения не доходят | Клиент должен написать сервису хотя бы раз; телефон в CRM = WA |
| Ошибка 131047 / template | Создать шаблон в Meta и прописать `WHATSAPP_TEMPLATE_*` |
| Дубли TG + WA | Нормально, если у клиента оба канала |

---

## Краткий чеклист

- [ ] Phone number ID и Access Token в Vercel  
- [ ] WEBHOOK_VERIFY_TOKEN и SETUP_KEY в Vercel  
- [ ] APP_SECRET в Vercel  
- [ ] Redeploy  
- [ ] Webhook в Meta: URL + verify + messages  
- [ ] `/api/whatsapp/setup?key=...` → `"ok": true`  
- [ ] Тест: «меню» с телефона клиента  
- [ ] Тест: WA↑ из CRM  

---

*Техническая документация API: [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)*
