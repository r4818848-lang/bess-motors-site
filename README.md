# BESS MOTORS — Premium Automotive Ecosystem

Luxury performance garage web platform with CRM, client portal, mechanic panel, and multilingual support.

## Stack

- **Next.js 15** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS** — premium dark UI, neon red accents
- **Framer Motion** — animations
- **jsPDF** — work order PDF generation
- **localStorage** — demo database (ready for Supabase/Firebase/PostgreSQL)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, stats, services, reviews, before/after |
| `/services` | All service categories + custom request |
| `/booking` | Interactive calendar booking |
| `/cabinet` | Client portal — login by phone, cars, VIN, live status, PDF |
| `/gallery` | Before/after project gallery |
| `/about` | Company info |
| `/contacts` | Contact form |
| `/crm` | Admin ERP — clients, orders, warehouse, finance, analytics |
| `/mechanic` | Mechanic task panel |

## Languages

Polish (default), Russian, English, Ukrainian — switch via header.

## Getting Started

```bash
cd bess-motors
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Login (Client Cabinet)

Phone: `+48555111222`

## Production Integration

Replace `src/lib/store.ts` localStorage with:

- **Supabase** / **Firebase** — auth + realtime sync with mobile app
- **PostgreSQL** — CRM data
- **JWT** — role-based access (admin sees purchase prices, clients do not)

## Features

- ✅ Multilingual (PL/RU/EN/UK)
- ✅ Online booking with calendar
- ✅ VIN decode (demo database)
- ✅ Live repair status timeline
- ✅ PDF work orders
- ✅ CRM with service/parts tables, margin/profit (admin only)
- ✅ Warehouse + QR codes
- ✅ Analytics charts
- ✅ AI modules (diagnostic, VIN OCR, plate scan — UI ready)
- ✅ Telegram / WhatsApp links
- ✅ Mechanic status updates

## Design

Black background, graphite cards, neon red (#e10600) glow, glassmorphism, Orbitron + Inter fonts — BMW M / AMG / Porsche Service aesthetic.
