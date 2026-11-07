# BESS MOTORS ERP — IMPLEMENTATION REPORT

**Branch:** `cursor/erp-audit-integrations-37fb`  
**Date:** 2026-11-02 (Europe/Warsaw)  
**Deploy:** **not** pushed to production (awaiting owner confirmation).

---

## Architecture note

The TZ described Fastify + normalized PostgreSQL + Docker. The live repo is **Next.js 15 CRM** with a **Supabase jsonb** document (`crm_store`). Implementation extends that stack instead of rewriting from scratch.

---

## Problems found → fixed

| Problem | Fix |
|---|---|
| No live supplier framework | `SupplierAdapter` + Hart / Inter Cars / Auto Partner / MOTOwarsztat adapters |
| Passwords would land in CRM JSON | AES-256-GCM server store (`supplier_connections` + crm_store fallback) |
| Fake “connected” on save | Connect/test call real supplier endpoints; status from response |
| No multi-supplier search UI | `/api/crm/suppliers/search` + `PartsSearchPanel` |
| No price compare | `/api/crm/suppliers/compare` + explanations PL/RU |
| No AI tools | `/api/crm/ai` + allowlisted ERP tools + confirmation gates |
| JWT insecure default in prod | Fail-closed if `JWT_SECRET` missing in production |
| Password hashes in staff GET | Stripped from `/api/crm-db` GET; restored on PUT from cloud |
| Mechanic could overwrite settings | PUT preserves cloud settings/mechanics/expenses for mechanics |
| Order numbers `BM-…` vs `BESS/…` | New numbers `BESS/YYYY/NNNNNN`, legacy accepted |
| Incomplete statuses | Added awaitingApproval, partsOrdered, cancelled + transitions |
| Payroll unclear vs VAT/cash | `payroll.ts` — labor **netto**, payment method independent |
| Weak seed passwords | No more default `1234` plaintext on new mechanics |
| Sparse order audit | `appendOrderAudit` on work-order save |
| Dashboard gaps | Today KPIs: waiting parts, revenue today, tomorrow bookings, supplier statuses, AI + parts search |

---

## New / changed files (high level)

- `AUDIT_REPORT.md`, `IMPLEMENTATION_REPORT.md`, `INTEGRATIONS_STATUS.md`, `SECURITY_REPORT.md`, `DEPLOYMENT_GUIDE.md`
- `supabase/supplier_connections.sql`
- `src/lib/server/secrets-crypto.ts`
- `src/lib/suppliers/**` (types, registry, search, compare, adapters)
- `src/lib/server/suppliers/**`
- `src/app/api/crm/suppliers/**`, `src/app/api/crm/ai`, `src/app/api/crm/payroll`
- `src/lib/ai/**`, `src/lib/payroll.ts`, `src/lib/order-status.ts`, `src/lib/order-audit.ts`
- CRM UI: `SuppliersSettingsPanel`, `PartsSearchPanel`, `AiAssistantPanel`, `PayrollPanel`
- Hardening: `jwt-secret.ts`, `crm-db/route.ts`, settings/dashboard

---

## What works now (without owner credentials)

- Full audit documentation
- Encrypted credential vault plumbing
- Adapter contracts + honest capability flags
- Search/compare/AI/payroll **APIs and UI**
- Unit tests for order numbers, VAT wage example, AES, payment≠VAT
- Typecheck (`tsc --noEmit`) clean

## What needs owner credentials to become “live green”

1. Run `supabase/supplier_connections.sql`
2. Set `SUPPLIER_SECRETS_KEY` + ensure `JWT_SECRET` on Vercel
3. Hart username/password (sandbox or prod)
4. Inter Cars: katalog `kh_kod`+token **or** WebAPI ClientId/Secret + auth/product URLs from IC Postman
5. Auto Partner: WebService URL + codes/passwords from sales
6. Optional `ERP_AI_API_KEY` for natural-language narration (tools work without it)

---

## Tests

| Suite | Result |
|---|---|
| `node --test scripts/tests/erp-unit.test.mjs` | **PASS** (5/5) |
| `npx tsc --noEmit` | **PASS** |
| Playwright E2E | Not re-run in this pass (no production deploy) |
| Live Hart/IC/AP HTTP | **Blocked** — no customer credentials in environment |

---

## Remaining risks

- Single jsonb CRM document concurrency (merge helps, not ACID rows)
- JWT still in localStorage (XSS risk)
- Supplier search for IC/AP requires owner-provided endpoint templates (we refuse to invent APIs)
- Normalized Postgres ERP still a future migration
- Client cabinet route remains redirected to booking

---

## How to run locally

```bash
npm ci
cp .env.example .env.local   # fill JWT_SECRET, SUPABASE_*, SUPPLIER_SECRETS_KEY
npm run dev
# CRM: http://localhost:3000/crm/login
node --test scripts/tests/erp-unit.test.mjs
```

Preview deploy via Vercel Git on this branch is OK; **Production main merge — only after your confirmation.**
