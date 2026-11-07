# SECURITY REPORT — BESS MOTORS ERP

Date: 2026-11-02 (Europe/Warsaw)

---

## Fixed in this branch

1. **Production JWT fail-closed** — missing `JWT_SECRET` throws instead of signing with a public default.
2. **Staff GET `/api/crm-db` strips `password` / `passwordHash`** from users before browser sync.
3. **PUT restores hashes from cloud** so stripping does not wipe credentials on save.
4. **Mechanics cannot overwrite** `settings`, `mechanics`, `expenses` via full-document PUT.
5. **Supplier secrets** encrypted AES-256-GCM; never logged (`redactForLog`); never in localStorage.
6. **Supplier connect/test/disconnect** admin-only.
7. **No plaintext default mechanic password** on create.
8. **AI** uses allowlisted tools; irreversible actions require confirmation; prompt-injection sanitization on untrusted context; audit ring buffer.

---

## Remaining / accepted risks

| Risk | Severity | Mitigation |
|---|---|---|
| JWT in `localStorage` | High | HttpOnly cookie migration later; strict CSP |
| Service role key in Vercel | High | Rotate; never expose to client |
| Single jsonb document ACL | High | Gradual field-level APIs |
| Setup-key GETs | Medium | Rotate `TELEGRAM_SETUP_KEY` / sanitize keys |
| Demo OTP when SMS unset | Medium | Ensure SMS provider in prod |
| Browser XSS → session theft | High | Keep deps updated; avoid `dangerouslySetInnerHTML` with supplier text |

---

## Secrets checklist (owner)

- [ ] `JWT_SECRET` set (unique, long)
- [ ] `SUPPLIER_SECRETS_KEY` set (independent of DB)
- [ ] `ADMIN_PASSWORD` rotated
- [ ] Supabase service role not in frontend
- [ ] `.env*` not committed (`.gitignore` present)
- [ ] Run `supplier_connections.sql`; RLS on, no anon policies

**Never paste real supplier passwords into chat, commits, or AUDIT reports.**
