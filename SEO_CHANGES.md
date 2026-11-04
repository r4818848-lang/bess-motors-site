# SEO CHANGES — this branch

Branch: `cursor/seo-local-maps-37fb`  
Base: `main`  
Production deploy: **not done** (awaiting owner confirmation)

---

## Code changes

1. **`src/lib/businessConfig.ts`** — single NAP / hours / Maps / social source + pending 9:00 note.
2. **`site.ts` / `site-nap.ts` / `google-business-facts.ts` / `seo-local.ts` / `maps.ts` / `data.ts`** — consume `businessConfig`.
3. **`next.config.ts`** — 301 `/wymiana-hamulcow-warszawa` → `/hamulce-warszawa`.
4. **`gallery/page.tsx`** — SSR H1 + intro for crawlers.
5. **Banner** — chip → hamulce; remove “Geometria” from tires copy (PL/RU).
6. **Sticky mobile bar** — Call / WhatsApp / **Trasa** / Book + GA4 `get_directions_click`.
7. **Home meta** — title/description closer to TZ examples.
8. **Home SEO links** — Okęcie + skrzynia automatyczna featured.

---

## Pages created
- None new (priority landings already existed). Brake alias via **redirect**.

## Pages optimized
- Home meta, gallery crawlability, homepage service tiles, sticky CRO.

## Redirects added
| From | To | Type |
|---|---|---|
| `/wymiana-hamulcow-warszawa` | `/hamulce-warszawa` | 301 |
| `/wymiana-hamulcow` | `/hamulce-warszawa` | 301 |

## Not changed (needs confirmation)
- Opening hour **08:00 → 09:00**
- Price amounts
- GBP categories (checklist only)

## Tests
- `npx tsc --noEmit` — pass
- Live audit script — documented in `SEO_AUDIT.md`
- PageSpeed / GSC — owner tools (see `SEO_MONITORING.md`)
