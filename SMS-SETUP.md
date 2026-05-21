# Настройка SMS для восстановления пароля

Клиент: **Кабинет → Забыли пароль?** — код приходит по SMS.

## 1. SMSAPI (рекомендуется для Польши)

1. Регистрация: https://www.smsapi.com/
2. Создайте токен OAuth в панели.
3. В корне проекта создайте `.env.local`:

```env
SMS_PROVIDER=smsapi
SMSAPI_TOKEN=ваш_токен
SMSAPI_FROM=BESS MOTORS
```

4. Перезапустите сервер: `npm run dev`

## 2. Twilio (международный)

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+48791257229
```

## 3. Проверка

Откройте: http://localhost:3000/api/auth/forgot-password/status

Должно быть: `{"enabled":true,"provider":"smsapi"}`

## 4. Vercel

В **Settings → Environment Variables** добавьте те же переменные для Production.

## 5. Без SMS (разработка)

Если токенов нет — показывается **демо-код** на экране (только локально).

## Важно

- Код хранится на сервере 10 минут (память процесса). На Vercel используйте один инстанс или позже подключите Redis.
- Аккаунт клиента должен быть зарегистрирован с тем же номером телефона.
