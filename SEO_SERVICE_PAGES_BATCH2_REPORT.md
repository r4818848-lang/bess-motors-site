# SEO Service Pages — Batch 2 (30 URLs)

## Routing
Same App Router dynamic route as batch 1:

`src/app/[slug]/page.tsx` → `SeoLandingPageView`

Slugs registered via `EXTRA_SEO_SERVICE_PAGES` = batch1 (9) + batch2 (30).

Redirect removed (now indexed page):
- `/wulkanizacja-warszawa` (was 301 → `/opony`)

## Files

### Created
- `src/lib/seo-extra-service-pages-batch2.ts` — 30 page defs, unique profiles, related links

### Updated
- `src/lib/seo-extra-service-pages.ts` — merges batch2 + parent related updates
- `src/lib/seo-landing-related.ts` — `/opony` and `/hamulce` link to new cluster pages
- `src/lib/seo-footer-links.ts` — key new URLs in footer
- `next.config.ts` — remove `/wulkanizacja-warszawa` redirect

## New URLs (30)

| URL | metaTitle (layout adds `\| BESS MOTORS`) | H1 (`title`) |
|-----|------------------------------------------|--------------|
| /wulkanizacja-warszawa | Wulkanizacja Warszawa \| Wymiana opon | Wulkanizacja i wymiana opon Warszawa |
| /wymiana-opon-warszawa | Wymiana opon Warszawa | Wymiana opon Warszawa |
| /wywazanie-kol-warszawa | Wyważanie kół Warszawa | Wyważanie kół Warszawa |
| /naprawa-opon-warszawa | Naprawa opon Warszawa | Naprawa opon Warszawa |
| /wymiana-klockow-hamulcowych-warszawa | Wymiana klocków hamulcowych Warszawa | Wymiana klocków hamulcowych Warszawa |
| /wymiana-tarcz-hamulcowych-warszawa | Wymiana tarcz hamulcowych Warszawa | Wymiana tarcz hamulcowych Warszawa |
| /wymiana-plynu-hamulcowego-warszawa | Wymiana płynu hamulcowego Warszawa | Wymiana płynu hamulcowego Warszawa |
| /wymiana-amortyzatorow-warszawa | Wymiana amortyzatorów Warszawa | Wymiana amortyzatorów Warszawa |
| /wymiana-wahaczy-warszawa | Wymiana wahaczy Warszawa | Wymiana wahaczy Warszawa |
| /naprawa-ukladu-kierowniczego-warszawa | Naprawa układu kierowniczego Warszawa | Naprawa układu kierowniczego Warszawa |
| /wymiana-przekladni-kierowniczej-warszawa | Wymiana przekładni kierowniczej Warszawa | Wymiana przekładni kierowniczej Warszawa |
| /wymiana-drazkow-kierowniczych-warszawa | Wymiana drążków kierowniczych Warszawa | Wymiana drążków kierowniczych Warszawa |
| /wymiana-filtrow-warszawa | Wymiana filtrów Warszawa | Wymiana filtrów samochodowych Warszawa |
| /wymiana-plynu-chlodniczego-warszawa | Wymiana płynu chłodniczego Warszawa | Wymiana płynu chłodniczego Warszawa |
| /wymiana-swiec-zaplonowych-warszawa | Wymiana świec zapłonowych Warszawa | Wymiana świec zapłonowych Warszawa |
| /wymiana-alternatora-warszawa | Wymiana alternatora Warszawa | Wymiana alternatora Warszawa |
| /wymiana-rozrusznika-warszawa | Wymiana rozrusznika Warszawa | Wymiana rozrusznika Warszawa |
| /naprawa-wydechu-warszawa | Naprawa układu wydechowego Warszawa | Naprawa układu wydechowego Warszawa |
| /diagnostyka-silnika-warszawa | Diagnostyka silnika Warszawa | Diagnostyka silnika Warszawa |
| /test-kompresji-warszawa | Pomiar kompresji silnika Warszawa | Pomiar kompresji silnika Warszawa |
| /diagnostyka-dymem-warszawa | Diagnostyka dymem Warszawa | Diagnostyka dymem układu dolotowego Warszawa |
| /diagnostyka-przed-zakupem-warszawa | Sprawdzenie samochodu przed zakupem Warszawa | Sprawdzenie samochodu przed zakupem Warszawa |
| /wymiana-pompy-wody-warszawa | Wymiana pompy wody Warszawa | Wymiana pompy wody Warszawa |
| /wymiana-uszczelki-pokrywy-zaworow-warszawa | Wymiana uszczelki pokrywy zaworów Warszawa | Wymiana uszczelki pokrywy zaworów Warszawa |
| /wymiana-poduszki-silnika-warszawa | Wymiana poduszki silnika Warszawa | Wymiana poduszki silnika Warszawa |
| /wymiana-lozyska-kola-warszawa | Wymiana łożyska koła Warszawa | Wymiana łożyska koła Warszawa |
| /serwis-skrzyni-automatycznej-warszawa | Serwis automatycznej skrzyni biegów Warszawa | Serwis automatycznej skrzyni biegów Warszawa |
| /wymiana-oleju-dsg-warszawa | Wymiana oleju DSG Warszawa | Wymiana oleju w skrzyni DSG Warszawa |
| /serwis-haldex-warszawa | Serwis Haldex Warszawa | Serwis Haldex Warszawa |
| /mechanik-warszawa-okecie | Mechanik Warszawa Okęcie | Mechanik samochodowy Warszawa Okęcie |

## Price policy
- Prices shown only from existing `price-list` / known promos (e.g. klocki 100 zł).
- No cennik price → `price: null` + “Zapytaj o wycenę” in content (kompresja, dym, Haldex).

## Internal linking clusters
- Hamulce → klocki / tarcze / płyn
- Wulkanizacja → wymiana / wyważanie / naprawa
- Zawieszenie → amortyzatory / wahacze / łożysko
- Diagnostyka → silnik / dym / kompresja / przed zakupem
- Automat → serwis AT / DSG / Haldex
