# SEO AUDIT — BESS MOTORS (www.bess-motors.com)

**Date:** 2026-11-02 (Europe/Warsaw)  
**Scope:** Live production + `bess-motors-site` codebase  
**Branch:** `cursor/seo-local-maps-37fb`  
**Out of scope:** ERP / CRM / AI agents / supplier APIs

---

## Executive summary

The public site already has a strong local SEO foundation: ~101 sitemap URLs, AutoRepair JSON-LD, many service landings, apex→www HTTPS, CRM noindex. Gaps fixed in this branch: unified `businessConfig`, gallery crawlable H1, brake URL redirect, chip/geometria removed from homepage banners, Maps “Trasa” on mobile sticky bar, home meta aligned to TZ wording.

---

## Findings

| ID | Issue | Evidence | Severity | Fix | Status |
|---|---|---|---|---|---|
| A1 | Hours may differ from GBP (8:00 vs possible 9:00) | Site/schema `08:00–18:00`; owner note suggests `09:00–18:00` | **High** | Keep published 8:00; `businessConfig.hoursPendingOwnerConfirm`; confirm with GBP | **Owner action** |
| A2 | NAP duplicated across files | `site.ts`, `site-nap.ts`, `google-business-facts`, i18n strings | Medium | `businessConfig` single source | **Fixed** |
| A3 | `/wymiana-hamulcow-warszawa` 404 | Live 404; priority URL in TZ | High | 301 → `/hamulce-warszawa` | **Fixed** |
| A4 | Gallery H1 not in SSR HTML | Curl saw `h1=[]` (client-only) | High | SSR H1 in `gallery/page.tsx` | **Fixed** |
| A5 | Homepage banner advertised chip + geometria | `bannerServices.tuning`, tires “Geometria” | High | Brakes instead of chip; puncture repair instead of alignment | **Fixed** |
| A6 | Mobile sticky lacked directions | Sticky: call/WA/book only | Medium | Add “Trasa” + `get_directions_click` | **Fixed** |
| A7 | Home title slightly verbose | Live title OK but TZ preferred shorter brand form | Low | Updated `HOME_SEO_TITLE` / description | **Fixed** |
| A8 | Priority landings already exist | olej, rozrząd, sprzęgło, wulkanizacja, diagnostyka, zawieszenie, klima, skrzynia, Włochy | — | Curate internal links (Okęcie + AT) | **Done** |
| A9 | Apex / HTTP | `bess-motors.com` → `www` HTTPS 200 | — | Already correct | OK |
| A10 | robots.txt | Disallows `/crm/`, `/admin`, `/mechanic`, `/cabinet`, … | — | OK | OK |
| A11 | CRM indexed? | `/crm` `noindex,nofollow` | — | OK | OK |
| A12 | Self-serving AggregateRating | `businessAggregateRatingSchema()` returns null | — | Correct (no fake stars) | OK |
| A13 | Chip landing still published | `pendingNoIndexSlugs` has chip | Medium | Keep noindex; removed from banner | Partial |
| A14 | Booking slots include 08:00 | `data.ts` | Tied to A1 | Derived from `businessConfig.opens` | Pending hours confirm |
| A15 | Reviews in `data.ts` mention Stage 2 / detailing | Marketing seed reviews | Medium | Do not use as GBP content; prefer live Google reviews component | Documented |
| A16 | Exact keyword volumes | No GSC/Ahrefs in this env | — | Qualitative `SEO_KEYWORDS.md` | Done |

---

## Live URL checks (2026-11-02)

- Priority service URLs: **200** except `/wymiana-hamulcow-warszawa` (**404** → redirect added).
- Sitemap: **101** URLs; Host + Sitemap in robots OK.
- JSON-LD: AutoRepair + LocalBusiness + geo + openingHours present on home.

---

## Owner must confirm before further changes

1. **Opening hours:** keep **8:00–18:00** or switch site+GBP+booking to **9:00–18:00**?
2. Sunday closed — confirm.
3. Price list labour figures (oil 80 zł, tires by rim, etc.) — confirm still current.
4. GSC property access for indexing report / query data.
