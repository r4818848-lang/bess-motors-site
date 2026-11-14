# BESS MOTORS — design system

Source of truth for the public site. CRM screens keep their own theme variables and are out of scope.

Generated with UI UX Pro Max (`python3 .cursor/skills/ui-ux-pro-max/scripts/search.py`) on 13 Nov 2026, then corrected against the brand. The first `--design-system` pass returned a light stone background and a gold accent. That palette was not persisted: the owner locked a dark graphite field and the existing red `#e10600`.

## Verified inputs

- Product query: `premium automotive service dark minimal graphite` with variance 3, motion 3, density 3.
- Style match: Minimalism & Swiss Style. Dark mode is supported. Motion stays at 200–250 ms. No decorative shadow.
- Color retry: `dark graphite red luxury automotive`. The automotive row is a light page with red `#DC2626`. The closest dark row is cinema black plus a red accent. Fills stay on the brand red already in the product.
- Type retry: Classic Elegant (Playfair Display + Inter) and Luxury Serif (Cormorant + Montserrat). Both heading faces are Latin-only. The site is Polish, Russian, English, and Ukrainian, and Next.js guidance is to self-host fonts. Body and headings stay on the existing self-hosted Inter.
- UX: visible keyboard focus, including inside forms. Focus must not sit under the sticky header or the mobile contact bar.
- Stack: `next/font` or the current local `@font-face`. No Google Fonts stylesheet.

## Color

| Role | Value | Use |
|---|---|---|
| Background | `#080808` | Page field |
| Surface / card | `#141414` | Cards, inputs |
| Text | `#ffffff` | Headings and body on graphite |
| Muted | `#a8a8a8` | Secondary copy |
| Border | `rgba(255,255,255,0.08)` | Hairline |
| Brand fill | `#e10600` | Primary button only. White on this red clears 4.5:1 |
| Button hover | `#c50500` | Primary hover. No movement |
| Small red text | `#ff4d3a` (`text-bm-ink`) | Labels and text links on graphite. `#e10600` at 11 px does not clear 4.5:1 on `#080808` |
| Focus ring | `#ff4d3a` | 2 px outline, 3 px offset |

Do not introduce gold, a light stone page, or a second accent.

## Type

- Family: self-hosted Inter for Latin and Polish. Cyrillic uses the local system face already declared in `globals.css`.
- Hero title: existing scale, tight tracking, no uppercase on the H1.
- Eyebrow: 12 px, semibold, tracking 0.28 em, `text-bm-ink`.
- Section title: 24 / 30 px, semibold, tight tracking. One H1 per page.
- Body: 16 px, line-height about 1.6, max width about 40 rem.

## Space and shape

- Page gutter: 16 px, 32 px from the large breakpoint.
- Section padding: 48 px, 64 px from the small breakpoint.
- Cards and buttons: 12 px and 10 px radius, already in the shared classes.
- Touch target: 48 px on buttons and inputs. Text links that sit in a card get at least 44 px of block size.

## Controls

- `.btn-primary` — brand fill, white label, 48 px tall, pointer cursor. Hover changes the fill only.
- `.btn-outline` — white 15% hairline, transparent fill, same size.
- `.card-premium` and `.bm-service-card` — graphite card, hairline border. Hover lightens the border and the fill. No vertical shift.
- `.input-premium` — 48 px, graphite fill. Focus adds the red border and a 3 px red ring, not color alone.

## Motion

- 200 ms, ease `cubic-bezier(0.22, 1, 0.36, 1)`.
- `prefers-reduced-motion: reduce` removes those transitions.
- Do not add GSAP. The site already has a small amount of motion; new motion has to be optional and must not hide SEO text.

## Homepage

One studio composition. No separate car cards and no primitive car SVG. The three-BMW film stays out of `Hero.tsx` until a quality render is accepted, and then only on a test branch.

Prices stay on the existing price helpers. Do not hard-code a new amount in a component.

## Checklist

- Keyboard focus visible on links, buttons, and fields.
- Reduced motion leaves content in its final readable state.
- 375 px layout does not overflow.
- Hero image or video, when one exists, is the only `priority` media.
- CRM, Supabase, SQL, and secrets are not restyled from this file.
