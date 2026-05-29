/**
 * Purge Supabase crm_store: remove all client accounts, clear warehouse.
 * Usage: node scripts/purge-cloud.mjs
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnvFile(name) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ROW_ID = "main";

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

function purgeAllClientsFromDb(db) {
  const clientIds = new Set(db.users.filter((u) => u.role === "client").map((u) => u.id));
  return {
    ...db,
    users: db.users.filter((u) => u.role !== "client"),
    vehicles: db.vehicles.filter((v) => !clientIds.has(v.userId)),
    workOrders: db.workOrders.filter((w) => !clientIds.has(w.userId)),
    appointments: db.appointments.filter((a) => !clientIds.has(a.userId)),
    callRequests: db.callRequests.filter((c) => !clientIds.has(c.userId)),
    vehicleHistory: db.vehicleHistory.filter((h) => !clientIds.has(h.userId)),
    passwordResets: [],
    currentUserId: db.currentUserId && clientIds.has(db.currentUserId) ? null : db.currentUserId,
    notifications: (db.notifications ?? []).filter((n) => !clientIds.has(n.userId)),
    clientRatings: (db.clientRatings ?? []).filter((r) => !clientIds.has(r.userId)),
    settings: { ...db.settings, abandonedBookingDrafts: [] },
    warehouse: [],
  };
}

async function main() {
  const getRes = await fetch(`${url}/rest/v1/crm_store?id=eq.${ROW_ID}&select=doc,updated_at`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!getRes.ok) {
    console.error("GET crm_store failed:", getRes.status, await getRes.text());
    process.exit(1);
  }
  const rows = await getRes.json();
  const row = rows[0];
  if (!row?.doc) {
    console.error("No crm_store row found");
    process.exit(1);
  }

  const before = row.doc;
  const clientsBefore = before.users.filter((u) => u.role === "client").length;
  const whBefore = (before.warehouse ?? []).length;

  const next = purgeAllClientsFromDb(before);
  next.currentUserId = null;

  const putRes = await fetch(`${url}/rest/v1/crm_store`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify({ id: ROW_ID, doc: next, updated_at: new Date().toISOString() }),
  });

  if (!putRes.ok) {
    console.error("PUT crm_store failed:", putRes.status, await putRes.text());
    process.exit(1);
  }

  const admins = next.users.filter((u) => u.role === "admin").map((u) => u.phone);
  console.log("OK — production CRM sanitized");
  console.log(`  Clients removed: ${clientsBefore}`);
  console.log(`  Warehouse items cleared: ${whBefore}`);
  console.log(`  Users left: ${next.users.length} (admin phones: ${admins.join(", ") || "—"})`);
  console.log(`  Work orders: ${next.workOrders.length}, appointments: ${next.appointments.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
