# BESS MOTORS — SEO TZ P0/P1 report (2026-10-20)

Branch: `cursor/seo-tz-p0-p1-37fb` · Site not claimed as live-indexed from this run.

## P0 — done

- Tire ladder R13–R17 **200** / R18 **260** / R19 **300** / R20 **350**; puncture **60 zł**; AC R1234yf **100 zł/100g**
- EGR/DPF/AdBlue OFF removed from cennik
- Misleading packages hidden (expired or savings &lt; 20 zł)
- Oil labour messaging: **80 zł robocizna**, materials separate
- Softened SLA copy («wolne terminy» / «5 minut» / «24/7 reservation»)
- Google reviews: live Places API (no hardcoded count); rating from API

## P1 — done (this iteration + prior)

- Public catalog filters: chip category hidden; detailing/PPF/Webasto/stage/chip out of /services cards
- `/chip-tuning-warszawa` **noindex** + out of sitemap until equipment confirmed
- OBD overclaims softened (no “all modules / free OBD” guarantees)
- Booking: SSR H1 + NAP; client form island; «potwierdzimy telefonicznie»
- Homepage: tyre season block + complex repairs; Jak dojechać + entrance photo
- GA4 named events: `click_phone`, `click_whatsapp`, `callback_submit_success`, `vin_quote_submit_success`, `booking_request_submit_success`, `get_directions_click`
- `npm run validate:prices` — tire/AC/puncture consistency
- Docs: `AUDIT_BEFORE.md`, `SEO_URL_MATRIX.md`, `CONTENT_REVIEW.md`, `KPI_TRACKING.md`, `GBP_CHECKLIST.md`
- New SEO landings (batch3): DPF/EGR cleaning, suspension diag, battery, A/C disinfection

## P2 — not in this PR

- Case studies expansion, blog depth, CMS price admin, GSC-driven iterations

## Commands

| Command | Result |
|---------|--------|
| `npm run validate:prices` | OK |
| `npx tsc --noEmit` | OK |
| `npm run lint` | OK (pre-existing CRM hook warnings only) |
| `npm run build` | OK |

## Owner blockers → `CONTENT_REVIEW.md`

Hours vs GBP, NIP/legal entity, hourly 250 zł, SUV/R21+, chip/detailing restore, wash promo, −15% confirmation.
