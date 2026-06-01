# SEO лендинги — что сделано и что делать вам

База: **https://www.bess-motors.com**

## Уже на сайте (технически)

| Элемент | Статус |
|---------|--------|
| 27 страниц `/slug` | Hero, цена, 4 шага, обучение, фото, отзывы, FAQ, карта, CTA |
| Meta title + description | На каждой странице |
| Keywords в `<meta>` | Расширены (название + Warszawa + line1/line2) |
| Schema.org | Service + Breadcrumb + FAQ |
| Sitemap | Все slug в `sitemap.xml` |
| Внутренние ссылки | Блок «Powiązane usługi» на каждом лендинге |
| Cookie consent | Google Ads / Consent Mode |
| Редиректы | Старые URL → новые (`next.config.ts`) |

Проверка: `npm run audit` и `node scripts/audit-landing-pages.mjs`

## Ваша часть (вне кода)

1. **Google Search Console** — добавить сайт, отправить sitemap:  
   `https://www.bess-motors.com/sitemap.xml`
2. **Google Business Profile** — адрес, фото, отзывы
3. **Google Ads** — объявления на конкретные лендинги, не только главную
4. **Уникальные фото** — загрузить в галерею (сейчас часть — баннеры)
5. **Отзывы** — просить клиентов после ремонта

## Тесты

```bash
npm run test:e2e -- e2e/landings.spec.ts
```

## Список всех URL

См. `docs/LANDING_URLS.md`
