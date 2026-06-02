# Google Tag Manager & Google Reviews

## GTM (already in code)

Container: **GTM-NVKV27L8** (override with `NEXT_PUBLIC_GTM_ID` on Vercel).

## Live Google reviews on site

Set in Vercel → Environment Variables:

| Variable | Description |
|----------|-------------|
| `GOOGLE_PLACES_API_KEY` | Places API (New) key from Google Cloud Console |
| `GOOGLE_PLACE_ID` | Place ID of BESS MOTORS on Google Maps |

Enable **Places API (New)** in Google Cloud. Restrict key to Places API + your domain.

Without these keys, the site shows honest copy + buttons to Google Maps (no fake review count).

## More workshop photos

In CRM, open a work order → enable **Show in gallery** → upload before/after photos. They appear on `/gallery`, home, service pages, and About.
