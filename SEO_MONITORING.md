# SEO MONITORING — BESS MOTORS

## Tools (owner accounts)

| Tool | Purpose |
|---|---|
| Google Search Console | Index coverage, queries, CTR, sitemap |
| GA4 (+ GTM if used) | Organic sessions, conversion events |
| Google Business Profile Insights | Maps calls, direction requests, website clicks |
| PageSpeed Insights | LCP / INP / CLS lab + field (CrUX) |

This environment cannot log into your GSC/GA4 — no fabricated “before/after rankings.”

---

## Weekly checklist

1. GSC → Indexing → Pages: new errors / excluded by ‘noindex’.  
2. GSC → Performance: top queries for Włochy / Okęcie / olej / opony / klima.  
3. Compare GBP Insights (calls, directions) week-over-week.  
4. Spot-check 5 landings: title, H1, phone, hours identical to `businessConfig`.  
5. PSI mobile on `/` and one money page (e.g. `/wymiana-oleju-warszawa`).

---

## Conversion events (already named in site)

- `click_phone`
- `click_whatsapp`
- `get_directions_click` (sticky Trasa + contacts)
- `callback_submit_success`
- `vin_quote_submit_success`
- `booking_request_submit_success`

Do not count a button tap as a confirmed booking — only `booking_request_submit_success` (or CRM confirmation).

Avoid double-firing the same conversion from both raw gtag and a duplicate GTM tag.

---

## Technical health endpoints

- `GET /api/health` — env / integrations health  
- `GET /robots.txt`, `GET /sitemap.xml`  
- After deploy: crawl `/wymiana-hamulcow-warszawa` → expect **301** to `/hamulce-warszawa`

---

## Critical alerts (manual or future automation)

- Site hours ≠ GBP hours  
- Homepage phone/address drift  
- Sitemap submit failure in GSC  
- Soft 404 on money pages  
- LCP regress (hero image / third-party scripts)

---

## Next highest-ROI actions (after this PR)

1. Confirm hours 8 vs 9 with GBP and update `businessConfig` once.  
2. Upload real photos + complete services in GBP.  
3. GSC: inspect indexing of batch landings; request indexing for new/updated URLs after merge.  
4. Strengthen unique PL copy only on thin district pages if Impressions >> Clicks.  
5. Compress any oversized workshop hero assets if PSI flags LCP.
