# BESS MOTORS — инструкция (RU)

## 1. Как смотреть сайт на своём компьютере

1. Откройте **PowerShell** или **CMD**.
2. Выполните (если PowerShell ругается на `npm`, используйте `npm.cmd`):

```powershell
cd c:\Users\Asus\Desktop\website\bess-motors
npm.cmd install
npm.cmd run dev
```

3. В браузере: **http://localhost:3000**
4. Остановить: `Ctrl + C` в терминале.

**Сохранить проект:** папка `bess-motors` на рабочем столе — это и есть весь сайт. Копируйте её на флешку / в облако (Google Drive). Ничего дополнительно «сохранять» не нужно.

---

## 2. Вход в админ-панель (CRM)

**Полная пошаговая инструкция (сайт в интернете + Vercel):**  
→ **[docs/INSTRUKCJA-CRM-POLNA.md](docs/INSTRUKCJA-CRM-POLNA.md)**

### Кратко (продакшен)

1. Откройте: **https://www.bess-motors.com/cabinet?crm=1**
2. **Телефон** — из Vercel (`ADMIN_PHONE`).
3. **Второе поле** — **пароль** из Vercel (`ADMIN_PASSWORD`), не госномер авто.
4. После входа откроется **https://www.bess-motors.com/crm**

### Локально (на ПК)

1. **http://localhost:3000/cabinet?crm=1** (после `npm run dev`)
2. Те же телефон и пароль из файла `.env.local`

### Заказ-наряды

- **/crm/work-orders** — заказ-наряды, PDF, подпись, сообщения клиенту (TG / WA)

**Данные:** на продакшене — в **Supabase** (облако). Локально нужен `.env.local` с ключами Supabase.

---

## 3. Личный кабинет клиента

- Адрес: **http://localhost:3000/cabinet**
- Регистрация: телефон + регистрационный номер авто (демо-клиентов нет).

---

## 4. Часы работы и запись

- **Пн–Вс, 7:00–20:00** — на сайте и в записи.
- Выбор механика **убран** — сервис сам назначает мастера.

---

## 5. Как сделать сайт «рабочим» в интернете (для всех)

Сейчас сайт работает только пока запущен `npm run dev` на вашем ПК. Чтобы он был **всегда онлайн**:

### Вариант A — бесплатно (Vercel, рекомендуется)

1. Зарегистрируйтесь: https://vercel.com  
2. Установите Git: https://git-scm.com  
3. В папке проекта:

```powershell
cd c:\Users\Asus\Desktop\website\bess-motors
git init
git add .
git commit -m "BESS MOTORS site"
```

4. Создайте репозиторий на GitHub, загрузите код.
5. В Vercel: **Import Project** → выберите репозиторий → Deploy.
6. Получите адрес вида `https://bess-motors.vercel.app`.

### Вариант B — свой хостинг

```powershell
npm.cmd run build
npm.cmd start
```

Нужен VPS или хостинг с Node.js.

---

## 6. Что ещё нужно для полноценной работы (как у «настоящего» сервиса)

| Сейчас (демо) | Для продакшена |
|---------------|----------------|
| Данные в браузере | **Supabase** или **Firebase** — одна база для сайта и приложения |
| Вход по телефону (локально) | SMS-код (Twilio) или Firebase Auth |
| PDF на компьютере клиента | Генерация на сервере + отправка в WhatsApp |
| AI — заглушки | API OpenAI / свой сервер |
| Домен bessmotors.pl | Купить домен и привязать в Vercel |

Минимум **для открытия сайта в интернете:** Node.js (у вас есть) + аккаунт **Vercel** + (желательно) **GitHub**.

---

## 7. PowerShell: ошибка «выполнение сценариев отключено»

Используйте:

```powershell
npm.cmd install
npm.cmd run dev
```

Или в PowerShell от администратора:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Контакты на сайте

- Телефон: +48 791 257 229  
- Адрес: Aleja Krakowska 48/52, 02-284 Warszawa  
- CRM admin: тот же номер телефона  
