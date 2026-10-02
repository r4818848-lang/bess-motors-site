# SEO Service Pages — created URLs

## Routing
All pages use existing App Router dynamic route:

`src/app/[slug]/page.tsx` → `SeoLandingPageView`

New slugs registered in `seoLandingPages` via `EXTRA_SEO_SERVICE_PAGES`.

Redirects removed (now indexed pages):
- `/wymiana-oleju-warszawa` (was 301 → `/wymiana-oleju`)
- `/hamulce-warszawa` (was 301 → `/hamulce`)

## Files created / updated

### Created
- `src/lib/seo-extra-service-pages.ts` — page defs, unique profiles, related links
- `src/components/seo/SeoLandingBreadcrumbs.tsx`
- `src/components/home/HomeSeoServiceLinks.tsx`

### Updated
- `src/lib/seo-landing-pages.ts`
- `src/lib/seo-landing-slug-profiles.ts`
- `src/lib/seo-landing-related.ts`
- `src/lib/seo-footer-links.ts`
- `src/lib/seo-structured-data.ts`
- `src/components/seo/SeoLandingPageView.tsx`
- `src/components/seo/landing/ServiceLandingBottomCta.tsx`
- `src/app/page.tsx`
- `src/app/services/page.tsx`
- `src/app/sitemap.ts`
- `next.config.ts`

## Title + meta description

| URL | Title (layout adds `\| BESS MOTORS`) | Meta description |
|-----|--------------------------------------|------------------|
| /wymiana-rozrzadu-warszawa | Wymiana rozrządu Warszawa | Wymiana rozrządu w Warszawie Włochy — pasek, łańcuch, pompa wody… |
| /wymiana-sprzegla-warszawa | Wymiana sprzęgła Warszawa | Wymiana sprzęgła w Warszawie — diagnostyka, komplet… |
| /mechanik-warszawa-wlochy | Mechanik Warszawa Włochy | Mechanik samochodowy Warszawa Włochy — BESS MOTORS… |
| /diagnostyka-komputerowa-warszawa | Diagnostyka komputerowa Warszawa | Diagnostyka komputerowa samochodu w Warszawie… |
| /wymiana-oleju-warszawa | Wymiana oleju Warszawa \| 80 zł robocizna | Wymiana oleju Warszawa Włochy — robocizna 80 zł… |
| /serwis-klimatyzacji-warszawa | Serwis klimatyzacji Warszawa | Serwis klimatyzacji samochodowej Warszawa… |
| /hamulce-warszawa | Hamulce Warszawa — klocki i tarcze | Wymiana klocków i tarcz hamulcowych Warszawa… |
| /naprawa-zawieszenia-warszawa | Naprawa zawieszenia Warszawa | Naprawa zawieszenia Warszawa — diagnostyka… |
| /wymiana-oleju-skrzynia-automatyczna-warszawa | Wymiana oleju skrzyni automatycznej Warszawa | Wymiana oleju w automatycznej skrzyni biegów… |

## QA (local `npm run start`)
- All 9 URLs: HTTP 200
- Exactly one `<h1>` each
- Canonical: `https://www.bess-motors.com/{slug}`
- All 9 in `/sitemap.xml`
- `/robots.txt` allows `/` (does not block these URLs)
