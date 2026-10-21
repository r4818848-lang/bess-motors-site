# GSC_CHECKLIST — Google Search Console (manual)

Owner applies in Search Console. Agent cannot access the property without credentials.

## After each production deploy

- [ ] **URL Inspection** for new landings (batch 3–4): request indexing if not discovered within a few days
- [ ] Confirm **sitemap** `https://www.bess-motors.com/sitemap.xml` submitted and without mass errors
- [ ] **Coverage / Pages**: no spike in soft-404 or “Crawled – currently not indexed” on money pages
- [ ] **Canonical**: www only; noindex on `/chip-tuning-warszawa`, CRM, thank-you

## Monthly (30/60/90 days)

- [ ] Queries with impressions but low CTR → rewrite title/meta for that URL only
- [ ] Queries with position 8–20 on oil / opony / klima / rozrząd → strengthen H1 + intro + FAQ
- [ ] Thin geo pages (Ursynów/Mokotów/Ochota): if no demand, consolidate internally — do **not** mass-create more district clones
- [ ] Compare GSC clicks vs GA4 `click_phone` / `booking_request_submit_success` (leads, not vanity traffic)

## Do not

- Bulk doorway pages for every price-list row
- Self-serving AggregateRating schema
- Change indexed URLs without 301 map
