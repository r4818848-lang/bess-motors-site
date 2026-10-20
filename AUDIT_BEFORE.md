# AUDIT_BEFORE — BESS MOTORS (TZ 2026-10-19)

**Date:** 2026-10-20  
**Branch base:** `main`  
**Site:** https://www.bess-motors.com/

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Deploy: Vercel (Git → Production)
- Data: Supabase CRM + Telegram notifications
- i18n: PL (primary), RU, EN, UK

## Public routes (inventory)

Static: `/`, `/services`, `/cennik`, `/booking`, `/booking/thank-you`, `/contacts`, `/about`, `/gallery`, `/faq`, `/blog`, `/blog/[slug]`, `/promocje`, `/privacy`, `/serwis-flot-warszawa`

Dynamic SEO: `/[slug]` — ~72 landings from `seo-landing-pages` + extras (batch1/2). After this TZ work: +5 batch3.

Non-index: `/crm/*`, `/admin`, `/mechanic`, `/cabinet`, `/sign/*`, `/status`, `/referral`

## Price sources (before fix)

| Item | Was | Issue |
|------|-----|--------|
| Tire R13–R17 | 150–180 zł | Outdated vs TZ (200 zł) |
| Tire R18/R19/R20 | 200/230/260 | Outdated (260/300/350) |
| Puncture | 70 zł from | Should be 60 zł fixed |
| Oil labour | 80 zł | OK (promo BessMotors) |
| AC R1234yf | 50 zł/100g | Should be 100 zł/100g |
| Global −15% | Active except AC/tires | OK if fixed tariffs stay clear |
| Packages TO/winter/brake | Shown as savings | Package price > sum of items |
| Pakiet letni | validUntil 2026-08-31 | Expired, still in list |
| EGR/DPF/AdBlue OFF | On cennik | Must not advertise |

## Forms

- Booking → `POST /api/appointments` (needs cloud)
- Call / VIN quote → `POST /api/call-request`
- VIN decode → `GET /api/vin/decode`

## SEO / technical

- `robots.ts`, `sitemap.ts` present
- AggregateRating JSON-LD intentionally disabled
- Google reviews live via Places API (4.9 / ~27) after prior PR
- Booking CTA had “wolne terminy” / “5 minutes” style claims

## Photos / GBP

- Real workshop photos in gallery; no stock replacement planned
- Hours Pn–Sb 8:00–18:00 in code — verify vs Google Business Profile (owner)

## Gap closure (this iteration)

- Chip category hidden from public cennik/PDF/booking; chip landing noindex
- Detailing/PPF/Webasto/stage/chip removed from public /services cards
- OBD “all modules / free” overclaims softened
- Homepage: tyre season block + complex repairs; Jak dojechać + entrance photo
- Booking: SSR shell with H1/NAP; named GA4 conversion events; price validate script
- Packages: public only if savings ≥ 20 zł
