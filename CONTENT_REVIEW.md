# CONTENT_REVIEW — requires owner confirmation

Do **not** invent these values. Confirm before publishing as hard facts.

| Topic | Current in code | Question for owner | Code location |
|-------|-----------------|--------------------|---------------|
| Opening hours | Pn–Sb 8:00–18:00 | Match Google Business Profile exactly? Sunday closed? | `src/lib/site.ts`, NAP, JSON-LD |
| Legal entity / NIP | Not hard-coded as verified company | Official company name + NIP for privacy/footer | `privacy`, footer |
| Hourly rate 250 zł/h | `HOURLY_RATE_PLN = 250` | Still valid? | `src/lib/price-list.ts` |
| Urgent +30% / premium +20% | In price-list footer notes | Still official and clear to clients? | `priceListFooterNotes` |
| Tire R21–R24 / SUV surcharge | Shown as “od” from 350 zł | Confirm exact SUV / RunFlat / R21+ tariffs | `tire_change_r21`…`r24`, runflat |
| Free car wash on large repairs | Not promoted | Still offered? Minimum order amount? | — |
| Chip tuning / Stage / dyno | **Hidden from public cennik**; `/chip-tuning-warszawa` **noindex** | Available without Launch X431? Partner only? Restore when confirmed | `PUBLIC_HIDDEN_CATEGORY_IDS`, `seo.ts` |
| Detailing / PPF / polish / paint / Webasto / multimedia | **Hidden from /services grid** | Offered in-house or partner? | `PENDING_EQUIPMENT_SERVICE_IDS` |
| Parking | Claimed at workshop | Confirm always available | `homeLead.mapLandmark` |
| Oil promo end | Until 2026-12-31 | Confirm end date / conditions | `oil-brake-promo.ts` |
| Site −15% code BessMotors | Active on non-AC/non-tire labour | Confirm still official for 2026 | `promo-codes.ts` |
| Google review count | Live from Places API | Do not hardcode | `/api/google-reviews` |
| Diagnostic equipment | Softened OBD “all modules / free OBD” claims | Confirm current scanner and which ECUs can be read | `service-landing-content.ts` |

## Confirmed by TZ (safe to use)

- Phone +48 791 257 229
- Address Aleja Krakowska 48/52, 02-284 Warszawa
- Oil labour 80 zł (materials separate)
- Tires R13–R17 200 / R18 260 / R19 300 / R20 350 (komplet)
- Puncture repair labour 60 zł
- AC hookup 80 zł; R134a 50 zł/100g; R1234yf 100 zł/100g
- Google rating ~4.9 (display from live API only)
- No DPF/EGR/AdBlue OFF advertising
