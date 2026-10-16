# Google Tag Manager & Google Reviews

## GTM (already in code)

Container: **GTM-NVKV27L8** (override with `NEXT_PUBLIC_GTM_ID` on Vercel).

## Live Google reviews on site

The homepage and service landings call `GET /api/google-reviews`, which pulls
rating + latest reviews from Google Places (New, then Legacy + Maps CID fallback).

### Vercel env vars

| Variable | Description |
|----------|-------------|
| `GOOGLE_PLACES_API_KEY` | Server key from Google Cloud Console (also accepts `GOOGLE_MAPS_API_KEY`) |
| `GOOGLE_PLACE_ID` | Optional Place ID (`ChIJ…`) — skips text search |
| `NEXT_PUBLIC_GOOGLE_PLACE_ID` | Same Place ID for the “leave a review” deep link in the browser |

### Google Cloud setup (required once)

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services.
2. Enable **Places API (New)** and **Places API** (Legacy).
3. Create an **API key** used only on the server (Vercel).
4. Key restrictions:
   - Prefer **Application restriction: None** or **IP** (not HTTP referrers — referrer keys fail on Node/server).
   - API restriction: allow Places API (New) + Places API.
5. Billing must be active on the project (Places requires it).
6. Set `GOOGLE_PLACES_API_KEY` on Vercel → Production → Redeploy.

Optional but recommended: set `GOOGLE_PLACE_ID` / `NEXT_PUBLIC_GOOGLE_PLACE_ID` to the `ChIJ…` id
(Place ID finder, or read `placeId` from `/api/google-reviews` once live).

Stable Maps link already in code: `https://www.google.com/maps?cid=7516200575228226885`.

### Verify

- `GET https://www.bess-motors.com/api/google-reviews?lang=pl` → `"source":"google"` and `reviews[]`.
- CRM → Settings → Integracje → `google_places` green: `Google Places OK — … reviews (live)`.
- If status is `places_api_denied`: key has referrer restriction, wrong APIs enabled, or billing off.
  Health `debug.detail` shows the sanitized Google error.

Without a working key, the site shows curated Google Maps reviews + Maps buttons (no fake rating count).

## More workshop photos

In CRM, open a work order → enable **Show in gallery** → upload before/after photos. They appear on `/gallery`, home, service pages, and About.
