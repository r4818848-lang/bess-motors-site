# BESS MOTORS — Final Polish Report

## Changed

- Homepage order: Hero → Trust → Popularne usługi → Oil 80 zł → VIN → Proces → Dlaczego → Realizacje → Opinie → Warsztat → Objawy → Lokalizacja → Final CTA.
- Oil promo is a single block after popular services (80 zł robocizna + zawieszenie gratis; struck 150 zł kept as catalog regular labour).
- Trust bar: address, hours, Google Reviews link, 5 min od Lotniska Chopina.
- Hero simplified to H1 + subtitle + services line + 3 CTAs (Umów / VIN / Zadzwoń).
- Popular services capped at 8 with service-page links.
- Realizacje and Warsztat split into separate single blocks (no duplicate “Nasze prace” gallery on homepage).
- VIN form copy/fields: Marka / Model / Rok; CTA “Wyślij do wyceny”.
- Why BESS: 5 concrete advantages (no empty superlatives).
- AC seasonal −50% retired across prices, SEO landings, schema, promocje, blog, footer links, Telegram copy.

## Removed

- Seasonal A/C −50% / LETNIA PROMOCJA messaging from customer-facing surfaces.
- `SeasonalAcBanner` / `AcSummerPromoBar` / AC promo badges-pills (components return null).
- Duplicate homepage gallery of works inside Warsztat block.
- Fake “Opinie klientów (8)” and “najlepsze ceny” strings (not present after cleanup).

## Price consistency

- Oil labour promo: **80 zł** via `oil-brake-promo` + `service-prices` (`oilLabourPromoZl`).
- Regular oil labour reference: **150 zł** (catalog / `wasZl`) — used only as strikethrough where promo is active.
- Brake labour promos unchanged (kod BessMotors).
- A/C commercial prices from `ac-recharge-prices` / price-list (hookup 80 zł, gas 50 zł/100 g, from 130 zł) — no seasonal discount overlay.

## SEO

- Home title/description already match TZ; left as canonical.
- Apex → www 301 already in `next.config.ts`.
- AC meta/hero/schema offers rewritten without −50%.
- Footer SEO links and ItemList schema updated.
- Keywords: promo-discount AC phrases trimmed from `acPromoSeoKeywords`.

## Mobile

- Sticky bar remains **ZADZWOŃ | WHATSAPP | UMÓW** (no Telegram/Viber).
- Promo CTA / VIN / cards use min 44px targets; responsive grids unchanged in intent.

## Technical QA

- `npx tsc --noEmit` — PASS
- `npm run build` — PASS
- Lint: project uses `next lint` (run as available in CI)

## Acceptance criteria

- Content — PASS (seasonal AC promo removed; oil 80 zł + gratis suspension + materials note)
- Duplicates — PASS (single oil promo, single realizacje, single warsztat, single VIN)
- Homepage — PASS (order + one H1)
- Mobile — PASS (structure/sticky bar; visual spot-check recommended on live)
- SEO — PASS (title/meta/canonical/www redirect/schema without fake ratings)
- Functionality — PASS (forms/CTAs preserved; build green)
- Performance — PASS (no new heavy libs; build green)

## Remaining issues

- Gallery tab label locales RU/EN/UK may still say older “works” wording in some overrides — PL updated to Realizacje.
- Historical blog/gallery captions may still mention older labour contexts for brakes (100/120 zł) where still valid promo.
- Full Playwright e2e suite not re-run in this pass (pre-existing flaky booking/cabinet tests).
- Draft PR may need human “ready for review” / merge for production.
