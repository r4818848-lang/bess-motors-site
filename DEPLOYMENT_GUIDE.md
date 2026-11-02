# DEPLOYMENT GUIDE — ERP updates

**Do not merge to production `main` without explicit owner confirmation.**

---

## 1. Preview (safe)

1. Push branch `cursor/erp-audit-integrations-37fb`.
2. Open Vercel Preview URL for the branch.
3. Login CRM `/crm/login`.
4. Settings → verify Suppliers / Parts search / AI / Payroll panels load.
5. Without credentials, suppliers stay `not_configured` / `user_action_required` — this is expected.

## 2. Supabase (once)

SQL Editor → run:

- `supabase/supplier_connections.sql`

(If table creation fails, adapters fall back to `crm_store` rows `supplier:<id>`.)

## 3. Vercel env (Production + Preview)

```
JWT_SECRET=...
SUPPLIER_SECRETS_KEY=...
ADMIN_PHONE=...
ADMIN_PASSWORD=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
# optional:
ERP_AI_API_KEY=...
ERP_AI_BASE_URL=https://api.openai.com/v1
```

Redeploy after env changes.

## 4. Owner credential entry

CRM → Settings → Поставщики → Подключения:

- Hart: username/password (+ sandbox if testing)
- Inter Cars: kh_kod+token **or** WebAPI fields in Extra JSON
- Auto Partner: webserviceUrl + searchPath in Extra JSON

Click **Подключить**, then **Проверить**. Status **Подключено** only after real HTTP success.

## 5. Production cutover (after confirmation)

1. Merge PR to `main` (or approve agent to merge).
2. Confirm Vercel Production deployment for the merge commit.
3. Note: GitHub Action “Deploy to Vercel” may fail without `vercel-token`; Git integration deploy is the source of truth.
4. Smoke: `/api/health`, CRM login, create order `BESS/…`, supplier test.

## 6. Rollback

Revert the merge commit on `main` or redeploy previous Production deployment in Vercel. Encrypted supplier rows remain in Supabase until deleted.

## 7. Local

```bash
npm ci
npm run dev
node --test scripts/tests/erp-unit.test.mjs
npx tsc --noEmit
```
