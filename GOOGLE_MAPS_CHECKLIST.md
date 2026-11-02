# GOOGLE BUSINESS PROFILE / MAPS CHECKLIST — BESS MOTORS

**Important:** This agent does **not** have login access to your Google Business Profile. Nothing below was “updated in Google” — only the website was aligned and this checklist prepared for the owner.

---

## Match website ↔ GBP (verify manually)

| Field | Website (`businessConfig`) | Action in GBP |
|---|---|---|
| Name | BESS MOTORS (no keyword stuffing) | Keep legal/trade name only |
| Primary category | Warsztat samochodowy / Auto repair | Confirm primary |
| Secondary | Wulkanizacja, Klimatyzacja samochodowa, … | Add only true services |
| Address | Aleja Krakowska 48/52, 02-284 Warszawa | Exact match + pin at entrance |
| Phone | +48 791 257 229 | Exact match |
| Website | https://www.bess-motors.com | www canonical |
| Hours | **Published site: Pn–Sb 08:00–18:00** | If GBP is 09:00–18:00 → **align both** after owner decision |
| Sunday | Closed | Confirm |
| Booking link | https://www.bess-motors.com/booking | Set as appointment URL |
| Directions | Maps dir API from address | Use same address string |

---

## Website Maps CTAs (implemented)

- Google Maps profile: `businessConfig.googleMapsUrl` (CID)
- Directions: `WORKSHOP_DIRECTIONS_URL` / sticky **Trasa**
- Reviews list: same Maps URL
- Write review: Place ID → `googleWriteReviewUrl`
- Do **not** create fake reviews

---

## Photos to upload in GBP (use real workshop shots)

- Entrance / gate on Aleja Krakowska  
- Facade / sign  
- Lifts / bay  
- Tire station  
- Equipment  
- Avoid stock fake staff certificates  

---

## Services descriptions in GBP

Copy labour-only clarity from site (e.g. olej 80 zł = **robocizna**; oil/filter separate).  
Do not list geometria / dynamic ATF / unverified chip.

---

## UTM for GBP website clicks

Suggested website URL in GBP:

`https://www.bess-motors.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp`

Track in GA4/GTM with existing conversion events (`click_phone`, `get_directions_click`, `booking_request_submit_success`).
