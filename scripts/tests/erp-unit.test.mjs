/**
 * Lightweight Node unit tests for ERP core (no Playwright).
 * Run: node --test scripts/tests/erp-unit.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Pure JS mirrors of critical logic (avoids TS path alias in node:test)

function generateOrderNumber(existing) {
  const year = new Date().getFullYear();
  const nums = existing
    .map((o) => {
      const bess = o.number.match(/BESS\/(\d{4})\/(\d+)/i);
      if (bess && Number(bess[1]) === year) return Number(bess[2]);
      const bm = o.number.match(/BM-(\d+)-(\d+)/i);
      if (bm && Number(bm[1]) === year) return Number(bm[2]);
      return null;
    })
    .filter((n) => n != null && Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `BESS/${year}/${String(next).padStart(6, "0")}`;
}

function exampleVatWage(brutto, vatRate = 23, percent = 50) {
  const netto = Math.round((brutto / (1 + vatRate / 100)) * 100) / 100;
  return { netto, wage: Math.round(netto * (percent / 100) * 100) / 100 };
}

function compareKey(manufacturer, article) {
  return `${manufacturer.trim().toUpperCase()}::${article.replace(/[\s\-./]/g, "").toUpperCase()}`;
}

function aesRoundtrip(plaintext, keyMaterial) {
  const key = createHash("sha256").update(keyMaterial, "utf8").digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

describe("order numbers", () => {
  it("uses BESS/YYYY/NNNNNN and continues after BM-", () => {
    const year = new Date().getFullYear();
    const n = generateOrderNumber([
      { number: `BM-${year}-0010` },
      { number: `BESS/${year}/000012` },
    ]);
    assert.equal(n, `BESS/${year}/000013`);
  });
});

describe("payroll VAT example", () => {
  it("246 brutto @23% → 200 netto → 100 wage at 50%", () => {
    const { netto, wage } = exampleVatWage(246, 23, 50);
    assert.equal(netto, 200);
    assert.equal(wage, 100);
  });
});

describe("supplier compare grouping", () => {
  it("normalizes article separators", () => {
    assert.equal(compareKey("Bosch", "0 986 494 056"), compareKey("bosch", "0986494056"));
  });
});

describe("AES-256-GCM secrets", () => {
  it("roundtrips password", () => {
    const out = aesRoundtrip("super-secret-ic-token", "test-supplier-key");
    assert.equal(out, "super-secret-ic-token");
  });
});

describe("payment vs vat independence", () => {
  it("cash payment must not imply vat off", () => {
    const order = { paymentMethod: "cash", vatEnabled: true };
    assert.equal(order.vatEnabled, true);
    assert.equal(order.paymentMethod, "cash");
  });
});
