# E2E-тесты (Playwright)

Автоматически «нажимают» ключевые кнопки и открывают страницы — без ручного обхода 27 лендингов и CRM.

## 1. Установка (один раз)

```bash
cd bess-motors
npm install
npx playwright install chromium
```

## 2. Запуск локально

**Терминал 1** (если сервер ещё не запущен — Playwright может стартовать сам):

```bash
npm run dev
```

**Терминал 2:**

```bash
# все тесты (smoke + 27 лендингов + бронирование + кабинет)
npm run test:e2e

# с окном браузера
npm run test:e2e:headed

# интерактивный режим (удобно отлаживать)
npm run test:e2e:ui

# только smoke
npm run test:e2e -- e2e/smoke.spec.ts

# только лендинги
npm run test:e2e -- e2e/landings.spec.ts
```

Playwright по умолчанию поднимает `npm run dev` на `http://127.0.0.1:3000`, если порт свободен.

## 3. Тесты CRM (нужен пароль админа)

```bash
cp .env.e2e.example .env.e2e.local
# отредактируйте E2E_ADMIN_PHONE и E2E_ADMIN_PASSWORD (как на Vercel)
```

Windows PowerShell:

```powershell
$env:E2E_ADMIN_PHONE="+48..."
$env:E2E_ADMIN_PASSWORD="..."
npm run test:e2e -- e2e/crm.spec.ts
```

Без переменных файл `e2e/crm.spec.ts` **пропускается** (не падает).

## 4. Тест против продакшена

```bash
set PLAYWRIGHT_BASE_URL=https://www.bess-motors.com
npm run test:e2e -- e2e/smoke.spec.ts e2e/landings.spec.ts
```

Не запускайте CRM-тесты на проде без отдельного тестового аккаунта.

## 5. Что покрыто

| Файл | Что проверяет |
|------|----------------|
| `e2e/smoke.spec.ts` | API `/api/health`, главная, 9 страниц меню |
| `e2e/landings.spec.ts` | Все **27** SEO URL: h1, кнопка записи, FAQ |
| `e2e/booking.spec.ts` | Добавление в корзину, шаг «Дalej», модалка с лендинга |
| `e2e/cabinet.spec.ts` | Форма входа, восстановление пароля |
| `e2e/crm.spec.ts` | Вход админа → CRM, горячие заказы, заказ-наряды, календарь |

**Telegram-бот** в браузере не тестируется — для него остаётся `npm run audit` (callback-и).

## 6. CI (GitHub Actions)

Workflow `.github/workflows/e2e.yml` при push:

1. `npm run build`
2. `npm run test:e2e` (без CRM, если секреты не заданы)

Секреты репозитория (опционально): `E2E_ADMIN_PHONE`, `E2E_ADMIN_PASSWORD`.

## 7. Отчёт после падения

```bash
npx playwright show-report
```

Скриншоты и trace — в `playwright-report/` и `test-results/`.

## 8. Добавить свой сценарий

1. Создайте `e2e/my-flow.spec.ts`.
2. Используйте `preparePage(page)` из `e2e/helpers.ts`.
3. Ищите элементы по роли: `getByRole('button', { name: '...' })`.
4. Для стабильности добавьте `data-testid` в компонент (по желанию).

Пример:

```ts
import { test, expect } from "@playwright/test";
import { preparePage } from "./helpers";

test("contacts phone link", async ({ page }) => {
  await preparePage(page);
  await page.goto("/contacts");
  await expect(page.getByRole("link", { name: /\+48/i }).first()).toBeVisible();
});
```
