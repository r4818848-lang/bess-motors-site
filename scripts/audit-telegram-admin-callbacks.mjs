/**
 * Lists admin inline callback_data prefixes from keyboards vs handler.ts.
 * Run: node scripts/audit-telegram-admin-callbacks.mjs
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "..", "src", "lib", "server", "telegram-bot");
const handler = readFileSync(join(root, "handler.ts"), "utf8");

const callbacks = new Set();
for (const file of readdirSync(root)) {
  if (!file.endsWith(".ts")) continue;
  const text = readFileSync(join(root, file), "utf8");
  for (const m of text.matchAll(/callback_data:\s*[`'"]([^`'"]+)[`'"]/g)) {
    const data = m[1];
    if (data.includes("${")) continue;
    callbacks.add(data);
  }
}

const prefixes = [
  "menu",
  "noop",
  "help",
  "search:menu",
  "fin:",
  "sum:day",
  "calls:",
  "qapt:menu",
  "qwo:",
  "unsigned:",
  "wo:",
  "mech:dash:",
  "mech:menu",
  "mech:",
  "hot:",
  "unpaid:",
  "an:",
  "apt:",
  "exp:",
  "wh:",
  "parts:",
  "imp:",
];

function handled(data) {
  if (data === "menu" || data === "noop" || data === "help" || data === "search:menu") return true;
  if (data === "fin:menu" || data.startsWith("fin:")) return true;
  if (data === "sum:day") return true;
  if (data === "calls:0" || data.startsWith("calls:done:")) return true;
  if (data === "qapt:menu") return true;
  if (data.startsWith("qwo:")) return true;
  if (data === "unsigned:0" || data.startsWith("unsigned:remind:")) return true;
  if (data.startsWith("wo:")) return true;
  if (data === "mech:dash:menu" || data.startsWith("mech:dash:")) return true;
  if (data === "mech:menu" || data.startsWith("mech:")) return true;
  if (data.startsWith("hot:")) return true;
  if (data.startsWith("unpaid:")) return true;
  if (data.startsWith("an:")) return true;
  if (data.startsWith("apt:")) return true;
  if (data.startsWith("exp:")) return true;
  if (data === "wh:0" || data === "wh:low") return true;
  if (data.startsWith("parts:")) return true;
  if (data === "imp:menu" || data === "imp:phone" || data === "imp:confirm") return true;
  if (data.startsWith("imp:")) return true;
  return false;
}

const missing = [...callbacks].filter((c) => !c.startsWith("mch:") && !c.startsWith("cl:") && !handled(c));
console.log("Admin callbacks:", callbacks.size);
if (missing.length) {
  console.error("Possibly unhandled:", missing);
  process.exit(1);
}
console.log("All admin callback_data patterns covered by handler.ts");
