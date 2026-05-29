#!/usr/bin/env node
/**
 * Audits cl:* callback_data in repo vs handlers in client-handler.ts + client-features-v4.ts
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "..", "src");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(p, out);
    } else if (p.endsWith(".ts") || p.endsWith(".tsx")) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(root);
const callbackRe = /callback_data:\s*(?:`([^`]+)`|"([^"]+)"|'([^']+)')/g;
const callbacks = new Map();

for (const file of files) {
  const text = readFileSync(file, "utf8");
  let m;
  while ((m = callbackRe.exec(text))) {
    const raw = m[1] ?? m[2] ?? m[3] ?? "";
    if (!raw.startsWith("cl:")) continue;
    const prefix = raw.includes("${")
      ? raw.replace(/\$\{[^}]+\}/g, "*")
      : raw;
    if (!callbacks.has(prefix)) callbacks.set(prefix, []);
    callbacks.get(prefix).push(file.replace(/\\/g, "/"));
  }
}

const handlerPath = join(root, "lib/server/telegram-bot/client-handler.ts");
const v4Path = join(root, "lib/server/telegram-bot/client-features-v4.ts");
const handlerSrc = readFileSync(handlerPath, "utf8") + readFileSync(v4Path, "utf8");

function hasHandler(prefix) {
  if (prefix === "cl:menu" || prefix === "noop") return true;
  const exact = `data === "${prefix}"`;
  const base = prefix.replace(/\*+$/, "");
  if (handlerSrc.includes(exact)) return true;
  if (handlerSrc.includes(`data.startsWith("${base}`)) return true;
  if (base.startsWith("cl:v4:") && handlerSrc.includes('data.startsWith("cl:v4:"')) return true;
  if (base.startsWith("cl:np:") && handlerSrc.includes('data.startsWith("cl:np:"')) return true;
  if (base.startsWith("cl:orders:") && handlerSrc.includes('data.startsWith("cl:orders:"')) return true;
  if (base.startsWith("cl:rate:") && handlerSrc.includes('data.startsWith("cl:rate:"')) return true;
  if (base.startsWith("cl:svc:") && handlerSrc.includes('data.startsWith("cl:svc:"')) return true;
  if (prefix === "cl:more" && handlerSrc.includes('"cl:more"')) return true;
  return false;
}

const missing = [];
for (const [prefix, sources] of callbacks) {
  if (!hasHandler(prefix)) {
    missing.push({ prefix, sources: [...new Set(sources)] });
  }
}

console.log(`Found ${callbacks.size} cl:* callback patterns`);
if (missing.length) {
  console.error("\n⚠️  Possibly unhandled callbacks:");
  for (const row of missing.sort((a, b) => a.prefix.localeCompare(b.prefix))) {
    console.error(`  ${row.prefix}`);
    for (const s of row.sources.slice(0, 2)) console.error(`    → ${s}`);
  }
  process.exit(1);
}
console.log("✅ All cl:* callback prefixes appear handled");
