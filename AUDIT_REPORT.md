# BESS MOTORS ERP — AUDIT REPORT

**Date:** 2026-11-02 (Europe/Warsaw)  
**Repository:** `r4818848-lang/bess-motors-site`  
**Branch:** `cursor/erp-audit-integrations-37fb`  
**Scope:** Full technical/functional audit of the embedded workshop CRM/ERP inside the Next.js site.

---

## Architecture reality check (TZ vs code)

| TZ assumption | Actual state |
|---|---|
| Fastify API (`apps/api`) | **Absent** — Next.js App Router Route Handlers only |
| PostgreSQL normalized schema | **Absent** — Supabase `crm_store` + `appointments` as **jsonb documents** |
| Docker / docker-compose | **Absent** — Vercel + Supabase |
| `apps/api/src/modules/secrets/crypto.ts` | **Absent** — PBKDF2 helpers in `src/lib/crypto.ts` + `src/lib/server/password-crypto.ts` |
| Separate ERP monorepo | **No** — CRM lives in this marketing site repo |

**Conclusion:** Do **not** rewrite as a new Fastify/Postgres project. Extend the existing Next.js + Supabase JSON CRM, add server-only supplier/AI modules, and keep working Motowarsztat import, Telegram, booking, and work-order flows.

---

## 1. What is fully implemented

| Area | Evidence | Notes |
|---|---|---|
| Staff login (admin/mechanic) | `src/app/api/auth/staff-login/route.ts`, `/crm/login` | Admin via env; mechanic via cloud JSON users |
| Work orders CRUD | `WorkOrderForm.tsx`, `store.ts`, `/api/crm-db` | LocalStorage + cloud merge |
| Order PDF / signature | `work-order-document.ts`, `/sign/[orderId]`, `/api/sign-order` | Electronic + physical modes |
| Calendar / appointments | `/crm/calendar`, `/api/appointments` | Day schedule + booking slots |
| Motowarsztat PDF/OCR import | `motowarsztat-import-parser.ts`, `/api/crm/import-work-order*` | Real import path |
| Inter Cars monthly sheet import | `inter-cars-import.ts`, `/api/crm/import-inter-cars` | Cost import, not live catalog |
| Telegram admin/mechanic bot | `src/lib/server/telegram-bot/**` | Substantial operational CRM |
| WhatsApp notifications | `whatsapp` API routes | Template-based |
| VIN decode | `/api/vin/decode` + TecDoc/etc providers | Real multi-provider |
| NIP lookup | `/api/nip/lookup` (bir1) | Real |
| Finance aggregations | `FinanceReports.tsx`, `crm-analytics.ts` | Client-side over JSON DB |
| Mechanic % earnings | `workorder-calc.ts` | Configurable %, not full payroll lock |
| Warehouse manual stock | `WarehousePanel.tsx` | Local JSON |
| Multilingual UI | `i18n/translations.ts` (pl/ru/en/uk) | Broad coverage; gaps remain |

---

## 2. Visual-only / incomplete / stubbed

| Item | File / area | Issue | Severity | Fix plan | Status |
|---|---|---|---|---|---|
| Live supplier search (IC/AP/Hart) | Warehouse + partners UI | No live multi-supplier search UI/API | **Critical** | Adapter layer + CRM panels | Implemented (credentials may be pending) |
| Auto Partner integration | `store.ts` seed `supplier: "Auto Partner"` | Label only | **High** | Adapter + credentials gate | Implemented (credentials may be pending) |
| Hart integration | — | Not present in code | **High** | Official REST adapter | Implemented (credentials may be pending) |
| Inter Cars live API | Import only | Sheet/OCR, not IC WebAPI session | **High** | Official IC API adapter (needs ClientId/Secret) | Implemented (credentials may be pending) |
| MOTOwarsztat “API” | Import parsers | No public MW outbound API for our ERP | **Medium** | Document as import-only; keep OCR | Documented |
| Client cabinet portal | `/cabinet` → redirect `/booking` | Components/API exist, route shelved | **Medium** | Keep CRM path; restore portal only if owner wants | Open |
| README “AI diagnostic” | README / marketing copy | No LLM agent; OCR ≠ AI assistant | **High** | Real tool-using AI module | Implemented (credentials may be pending) |
| AZTEC / plate scan | i18n `aztecSoon` | Coming soon | **Low** | Leave until hardware/API | Open |
| Demo SMS OTP | `password-reset.ts` | Returns demo code when SMS unset | **High** | Never return OTP in prod responses | Partially addressed |
| Seed mechanic passwords | `store.ts` defaultDb | Plaintext `11788245` / `1234` | **Critical** | Hash-only; strip seeds from cloud | Implemented (credentials may be pending) |

---

## 3. Critical findings (priority order)

### C1. Entire CRM as one writable JSON blob
- **File:** `src/app/api/crm-db/route.ts`
- **Issue:** Any staff JWT (`admin` **or** `mechanic`) can PUT the full database.
- **Impact:** Privilege escalation, data wipe, payroll/settings tampering, PII exfiltration.
- **Severity:** Critical
- **Plan:** Restrict PUT of settings/mechanics/expenses to `admin`; mechanic write scope to assigned orders; audit writes.
- **Status:** In progress

### C2. Secrets in same document as operational data
- **File:** `store.ts` User.password / passwordHash inside `crm_store.doc`
- **Issue:** Full DB GET exposes password hashes (and legacy plaintext) to every staff session.
- **Impact:** Credential stuffing offline attacks.
- **Severity:** Critical
- **Plan:** Stop returning password fields to non-admin; migrate plaintext → PBKDF2; supplier secrets in separate encrypted store.
- **Status:** In progress

### C3. JWT fallback secret in client-reachable site config
- **File:** `src/lib/site.ts`, `src/lib/server/jwt-secret.ts`
- **Issue:** Production can fall back to `dev-local-jwt-only-not-for-production` with only a console warning.
- **Impact:** Token forgery if `JWT_SECRET` missing on Vercel.
- **Severity:** Critical
- **Plan:** Fail closed in production when `JWT_SECRET` unset; health check flag.
- **Status:** In progress

### C4. Plaintext password verify fallback
- **File:** `password-crypto.ts`, `crypto.ts` — `if (!stored.startsWith("pbkdf2:")) return secret === stored`
- **Issue:** Legacy plaintext still accepted forever.
- **Impact:** Weak storage remains usable.
- **Severity:** High
- **Plan:** Allow verify once + force rehash; reject new plaintext saves; admin migration tool.
- **Status:** In progress

### C5. No live supplier sessions
- **Issue:** ERP cannot show real purchase prices/availability from IC/AP/Hart.
- **Impact:** Manual quoting, margin errors, Motowarsztat dependency.
- **Severity:** Critical (business)
- **Plan:** `SupplierAdapter` + encrypted credentials + real connect/test + unified search.
- **Status:** In progress

### C6. No AI with ERP tools
- **Issue:** TZ requires tool-using assistant; only OCR/VIN exist.
- **Severity:** High
- **Plan:** Server AI router with allowlisted tools + confirmation for irreversible actions.
- **Status:** In progress

### C7. Single-document concurrency
- **File:** `crm-db-merge.ts` + full-doc PUT
- **Issue:** Two staff editing can lose fields despite merge heuristics.
- **Severity:** High
- **Plan:** Keep merge; add order-level optimistic versioning / draft locks already partial (`crm-draft-lock.ts`).
- **Status:** Partial / improve

### C8. Order number format mismatch
- **File:** `workorder-calc.ts` `generateOrderNumber` → `BM-YYYY-NNNN`
- **Issue:** TZ / Motowarsztat examples use `BESS/2026/000153` or `ZL …`.
- **Severity:** Medium
- **Plan:** New default `BESS/YYYY/NNNNNN`; accept legacy BM-/ZL- as valid.
- **Status:** In progress

### C9. Order statuses incomplete vs TZ
- **File:** `RepairStatus` in `store.ts`
- **Missing:** awaiting approval, parts ordered, cancelled; configurable transitions.
- **Severity:** Medium
- **Plan:** Extend enum + transition map + UI labels; migrate safely.
- **Status:** In progress

### C10. Payroll vs VAT / payment coupling risk
- **File:** `workorder-calc.ts` — labor % of services subtotal (net)
- **Good:** VAT is a separate `vatEnabled` flag from `paymentMethod`.
- **Gap:** No week lock Mon–Sun, no documented adjustments, no per-mechanic printable week report matching TZ example; parts % can inflate base contrary to “parts not in wage unless configured”.
- **Severity:** High
- **Plan:** Explicit payroll module (netto labor base, settings, week reports, period lock).
- **Status:** In progress

---

## 4. Security findings

| ID | Finding | Severity | Status |
|---|---|---|---|
| S1 | Mechanic full-DB write | Critical | Fixing |
| S2 | JWT default in production | Critical | Fixing |
| S3 | Password hashes in staff GET body | Critical | Fixing |
| S4 | Plaintext password fallback | High | Fixing |
| S5 | JWT in localStorage (XSS → session theft) | High | Document + harden CSP later |
| S6 | Setup-key powerful GETs (`crm-db/sanitize`, telegram setup) | High | Keep key-gated; document rotation |
| S7 | Service role key for all Supabase access | High | Expected; protect env |
| S8 | Demo OTP in API responses | High | Fixing |
| S9 | Supplier passwords must never enter CRM JSON / localStorage | Critical | New encrypted store |
| S10 | No CSRF tokens (Bearer auth — lower risk) | Low | OK for Bearer |

---

## 5. Integrations status (pre-implementation)

| Supplier | Existing | Live search | Live order | Notes |
|---|---|---|---|---|
| Inter Cars | Monthly XLSX/JSON import | No | No | Official **IC WebAPI** exists (`docs.webapi.intercars.eu`) — needs contract + ClientId/ClientSecret. Legacy katalog External GetInvoice needs `kh_kod`+token. |
| Auto Partner | Warehouse label | No | No | B2B WebService credentials issued by AP sales; no public OpenAPI for us to invent. |
| Hart | None | No | No | **Public customer REST docs** (auth, products, availability, basket, orders). Sandbox + prod URLs documented. Needs Hart username/password from sales. |
| MOTOwarsztat | PDF/OCR/screenshot import | N/A | N/A | MW integrates *outbound* to wholesalers; **no public API for third-party ERP to drive MW**. Keep import path. |

Browser automation of supplier portals is **not** implemented: CAPTCHA/MFA/ToS risk. Prefer official APIs only.

---

## 6. Data model / UI ↔ server mismatches

| Topic | Detail | Severity |
|---|---|---|
| Client portal orphaned | `/cabinet` redirects; APIs still present | Medium |
| Docs say `/cabinet?crm=1` | Now `/crm/login` | Low (docs drift) |
| Finance has no API | Aggregations only in browser | Medium |
| `auditLog` on WorkOrder | Field exists; sparse writes | Medium |
| Seed warehouse demo SKUs | Can confuse real stock | Medium |

---

## 7. Performance

| Issue | Severity | Plan |
|---|---|---|
| Full DB download on every CRM sync | High | Later: incremental endpoints; short-term: keep merge + trim files |
| Large base64 files in JSON | High | Prefer Supabase Storage (partially done) |
| No supplier request isolation yet | High | Parallel search with per-supplier timeout/error isolation |
| No indexes (jsonb blob) | Medium | Accept until normalized migration |

---

## 8. Testing gaps

- Playwright covers booking/crm smoke partially.
- No unit tests for VAT/payroll/supplier adapters/AI confirmations.
- No integration tests against real Hart/IC (credentials required).

---

## 9. Implementation order for this branch

1. Audit (this file)  
2. Secrets crypto + JWT fail-closed + staff write scope + strip secrets from responses  
3. Supplier adapters + connections UI/API (Hart real protocol; IC/AP credential-gated; MW import-only)  
4. Unified search + compare  
5. Estimates / norm-hour settings / order audit + status expansion  
6. Payroll week reports  
7. AI tools + confirmations + spend limits  
8. Dashboard supplier/AI widgets  
9. Tests + IMPLEMENTATION / INTEGRATIONS / SECURITY / DEPLOYMENT reports  

**Deploy:** No production deploy without owner confirmation (per TZ §19).

---

## 10. Owner actions required (cannot be coded around)

1. Set `JWT_SECRET`, strong `ADMIN_PASSWORD`, `SUPPLIER_SECRETS_KEY` (32+ byte) on Vercel.  
2. Request **Hart** API sandbox credentials.  
3. Request **Inter Cars** IC WebAPI ClientId/ClientSecret (email process via IC).  
4. Request **Auto Partner** WebService login from sales rep.  
5. Run Supabase SQL for `supplier_connections` (provided in `supabase/supplier_connections.sql`).  
6. Optional: OpenAI/compatible API key for AI assistant (`ERP_AI_API_KEY`).  
7. Confirm production deploy after preview verification.
