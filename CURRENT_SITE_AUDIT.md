# CURRENT_SITE_AUDIT — BESS MOTORS

**Date:** 2026-09-24  
**URL:** https://www.bess-motors.com/ (canonical via `NEXT_PUBLIC_SITE_URL` / default www)  
**Scope:** Existing Next.js project — redesign branch `cursor/redesign-2026-37fb`

---

## 1. Stack

| Item | Value |
|------|--------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + TypeScript + Tailwind 3 |
| Motion | Framer Motion |
| i18n | Client locale switch PL/RU/EN/UK (`localStorage`) — **no locale URL prefixes** |
| Hosting | Vercel (multiple projects linked) |
| CRM / booking | Supabase cloud store + Telegram bots |
| Analytics | GTM, GA4, Google Ads, Meta Pixel, Yandex (Consent Mode) |

Content: static TS modules (no CMS). Prices: `price-list.ts` + `oil-brake-promo.ts` + facade `service-prices.ts`. NAP: `site.ts` + `site-nap.ts`.

---

## 2. Public routes (high level)

- `/` homepage  
- `/services`, `/cennik`, `/booking`, `/contacts`, `/about`, `/gallery`, `/faq`, `/promocje`, `/blog`, `/privacy`  
- SEO landings via `/[slug]` (oil, brakes, AC, brands, districts…)  
- `/serwis-flot-warszawa`  
- Gated: `/crm/*`, `/mechanic`, `/cabinet`, `/sign/*`  
- Redirects: `next.config.ts` (aliases + apex → www)

---

## 3. Homepage (current order before redesign)

Ticker → Hero → Trust → Oil promo → SameDay services → VIN form → How repair → Reviews → Gallery → Fleet → Map → Local area → Symptom FAQ → Chat help → Final CTA

**Issues:** visual noise (red glow, neon, CAPS, ticker); too many CTAs; red overuse; gaming/neon aesthetic; long page.

---

## 4. Design tokens (before)

- `--bm-red: #e10600`, `--bm-black: #0a0a0a`, `--bm-graphite: #141414`  
- Tailwind shadows: `neon`, `neon-sm`  
- Body: strong red radial gradients  
- Fonts: Inter for display+body (Orbitron loaded but unused for Cyrillic)

---

## 5. Pricing / promotions

| Offer | Source | Status |
|-------|--------|--------|
| Oil labour 80 zł (was 150) | `oil-brake-promo.ts` | Canonical — keep synced |
| Free suspension with oil | package booking items | OK |
| AC −50% | catalog + summer end `2026-09-30` | Auto-hide via `isAcSummerPromoActive` |
| Site −15% non-AC | `price-list` overlay | Separate from oil fixed promo |

Central display helper: `src/lib/service-prices.ts`. Remaining risk: any leftover copy outside facade.

---

## 6. Forms & conversion

| Form | Status |
|------|--------|
| Booking (`/booking`) | Working |
| VIN quote (`VinQuoteForm`) | Working → `/api/call-request` + Lead events |
| Sticky mobile: Call / WA / Umów | Exists; raise tap to 48–56px |
| WhatsApp / Telegram floats | Desktop floats; mobile bottom bar preferred |

---

## 7. SEO

| Area | Status |
|------|--------|
| Meta / canonical | `seo-metadata.ts` |
| Sitemap / robots | App Router routes |
| JSON-LD LocalBusiness | Present; **no fake AggregateRating** (removed) |
| Hreflang / locale URLs | **Missing** — phase later |
| District landings | Thin / doorway risk |
| Oil 80 zł consistency | Fixed in prior PR |

---

## 8. Problems ranked (redesign focus)

1. Visual: too much red, glow, neon, CAPS → cheap promo feel  
2. Header overcrowded (9 nav items + languages all visible)  
3. Homepage length / duplicate CTAs  
4. Ticker under header adds noise  
5. Cards with strong borders/glow  
6. Mobile: sticky OK but tap targets / floating WA compete  
7. Cennik UX still dense (later stage)  
8. Locale SEO (later)  
9. Thin brand/district pages (later)  
10. Performance / image naming (later)

---

## 9. What to preserve

- Booking + CRM + Telegram  
- Analytics IDs / events  
- Existing SEO URLs + redirects  
- Real photos / works gallery data  
- Oil 80 zł promo truth  
- VIN lead form logic  
- Fleet page  

---

## 10. Redesign phases (this branch starts 1–4)

1. Audit (this file)  
2. Design system tokens (less red)  
3. Header + mobile chrome  
4. Homepage visual + section order  
5+ Cennik, services, local SEO, realizacje, blog, CWV — follow-up PRs  

---

## 11. Rollback

Branch: `cursor/redesign-2026-37fb`  
Production stays on `main` until PR merge.
