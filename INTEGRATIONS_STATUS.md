# INTEGRATIONS STATUS — BESS MOTORS ERP

Updated: 2026-11-02 (Europe/Warsaw)

---

## Inter Cars

| Field | Value |
|---|---|
| **Method** | (A) IC WebAPI OAuth client credentials — URLs from IC Postman after contract; (B) Legacy katalog External `GetInvoices`/`GetInvoice` with `kh_kod` + token; (C) Existing monthly XLSX import (already in CRM) |
| **Status** | Adapter ready · **credentials required** · live search only if `productSearchUrl` provided |
| **Available now** | Document token validation; monthly import parsers; credential storage/test |
| **Not supported without IC pack** | Invented product-search endpoints; VIN catalog shopping |
| **Owner actions** | Email IC for API agreement / ClientId+Secret; or generate katalog token in IC_Katalog ONLINE; paste into CRM → Settings → Suppliers (`mode: katalog` or `mode: webapi` + `authUrl`) |

Official docs: https://docs.webapi.intercars.eu/

---

## Auto Partner

| Field | Value |
|---|---|
| **Method** | Customer WebService URL + customer code/passwords (as used by cairo/ZYNQ/Base Connect) |
| **Status** | Adapter ready · **user_action_required** until `webserviceUrl` (+ optional `searchPath`) provided |
| **Available now** | Encrypted credential save; HTTPS ping; search **only** via owner `searchPath` template |
| **Not supported** | Public universal OpenAPI (not published for arbitrary integrators); browser CAPTCHA bypass |
| **Owner actions** | Request WebService access from Auto Partner sales; paste URL/paths into Extra JSON |

---

## Hart

| Field | Value |
|---|---|
| **Method** | Official REST API v1 — `POST /v1/auth`, `GET /v1/products`, availability, basket |
| **Status** | Adapter implemented against published customer docs · **needs Hart account** |
| **Available now** | authenticate, checkSession (basket), searchByArticle (HartCodes), getProductDetails, getAvailability, getBasket, addToBasket |
| **Not supported in public docs** | Free-text name search / VIN search without Hart codes |
| **Owner actions** | Ask Hart for sandbox+prod username/password; set environment sandbox/production in CRM; run SQL table |

Docs: https://www.hartphp.com.pl/api  
Sandbox: `https://sandbox.restapi.hartphp.com.pl`  
Prod: `https://restapi.hartphp.com.pl`

---

## MOTOwarsztat

| Field | Value |
|---|---|
| **Method** | One-way **import** of PDFs/screenshots (existing parsers) |
| **Status** | `not_supported` for live SupplierAdapter session |
| **Available now** | `/api/crm/import-work-order*`, OCR enrich, screenshot known maps |
| **Not supported** | Public API for third-party ERP to drive MW catalog/orders |
| **Owner actions** | Continue exporting/importing documents; do not expect login/password “connect” to MW |

---

## CRM UI

**Настройки → Поставщики → Подключения** (`SuppliersSettingsPanel` in CRM Settings): login, password, connect, test, reconnect, disconnect, status, last success, error text.

Passwords: AES-256-GCM via `SUPPLIER_SECRETS_KEY`; never returned to frontend.
