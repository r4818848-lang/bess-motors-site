# KPI_TRACKING — lead measurement

## Events (wire in GTM — no PII)

| Event | Fire when | Source |
|-------|-----------|--------|
| `click_phone` | `tel:+48791257229` click | Header / sticky / CTA |
| `click_whatsapp` | `wa.me/48791257229` click | Sticky / contacts |
| `callback_submit_success` | `/api/call-request` 200 | Callback forms |
| `vin_quote_submit_success` | call-request `source=vin_quote` 200 | VinQuoteForm |
| `booking_request_submit_success` | `/api/appointments` 200 | Booking |
| `booking_confirmed` | Only after human/CRM confirm | CRM — not on button click |
| `get_directions_click` | Maps directions link | Contacts / landings |

**Rules:** fire success events only after server OK; never send VIN/phone/name to GA4/Meta.

## Weekly sheet (owner)

| Date | Source | Calls | Forms | Unique leads | Qualified | Confirmed bookings | Arrivals | Orders | Revenue |
|------|--------|-------|-------|--------------|-----------|--------------------|----------|--------|---------|
| | Organic / Maps / Direct / Ads / Social | | | | | | | | |

## Baseline (TZ)

- ~0–2 inquiries / day, Ads off
- 30-day hypothesis (not a guarantee): 2–4 qualified leads/day average after acquisition is on
