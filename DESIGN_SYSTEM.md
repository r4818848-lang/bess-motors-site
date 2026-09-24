# DESIGN_SYSTEM — BESS MOTORS

**Purpose:** Serious automotive service look — dark, calm, premium. Red ≈ 5% of UI.

---

## Colors

| Token | Value | Use |
|-------|--------|-----|
| `--bm-bg` / `bm.black` | `#080808` | Page background |
| `--bm-surface` | `#111111` | Secondary sections |
| `--bm-card` / `bm.card` | `#141414` | Cards |
| `--bm-card-2` | `#171717` | Elevated cards |
| `--bm-text` | `#FFFFFF` | Primary text |
| `--bm-text-2` / `bm.silver` | `#A8A8A8` | Secondary text |
| `--bm-muted` | `#888888` | Muted |
| `--bm-border` | `rgba(255,255,255,0.08)` | Borders |
| `--bm-red` | `#E10600` | CTA, promo price, active only |

**Do not** use red for: all borders, all icons, all headings, backgrounds, neon glows.

---

## Typography

- Family: Inter (display + body) — Cyrillic-safe  
- H1 desktop: ~52–68px / mobile: ~34–42px  
- H2 desktop: ~36–48px / mobile: ~28–34px  
- Body: 16–18px, line-height 1.5–1.7  
- Text measure: max-width 650–800px  
- Prefer sentence case; avoid full-CAPS walls

---

## Layout

- Container: `max-w-7xl` (1280)  
- Desktop padding: 24–40px  
- Mobile padding: 16–20px  

---

## Buttons

| Type | Style |
|------|--------|
| Primary | `bg-bm-red text-white`, radius 10px, min-height 48px |
| Secondary | transparent + `border border-white/15`, white text |
| Hover | slight brightness / border soften — **no neon pulse** |

---

## Cards

- Background `#141414`  
- Border `1px solid rgba(255,255,255,0.08)`  
- Radius 12–16px  
- Hover: `translateY(-2px)` + slightly brighter border  
- **No** `shadow-neon` on cards  

---

## Motion

- Duration 150–300ms  
- Allowed: fade, soft slide, hover lift  
- Forbidden: continuous pulse-glow, scan-line, spinning, blinking badges  

---

## Icons

- Lucide only  
- Default color: muted/silver; red only for emphasis  

---

## Breakpoints (QA)

375 · 390 · 430 · 768 · 1024 · 1440 · 1920  

---

## CSS mapping

Implemented in `src/app/globals.css` + `tailwind.config.ts` (`bm.*` palette update).
