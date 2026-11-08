/**
 * Dry-run only. Reads a local CRM JSON file and prints how many calendar rows
 * would be hidden. It never connects to Supabase and never writes the file.
 *
 * Usage: npx tsx scripts/archive-calendar-history.ts path/to/crm.json
 */
import { readFileSync } from "node:fs";
import { planCalendarArchive } from "../src/lib/calendar-history";
import type { Database } from "../src/lib/store";
import { warsawParts } from "../src/lib/workshop-schedule";

const file = process.argv[2];
if (!file || process.argv.includes("--apply")) {
  console.error("Dry-run only. Pass a local CRM JSON file. --apply is refused.");
  process.exit(1);
}

const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<Database>;
const appointments = parsed.appointments ?? [];
const today = warsawParts(new Date()).dateKey;
const plan = planCalendarArchive(appointments, today);
console.log(
  JSON.stringify(
    {
      mode: "dry-run",
      today,
      appointments: appointments.length,
      hideFromCalendar: plan.hide,
      keepFutureActive: plan.keepFuture,
      keepTodayActive: plan.keepToday,
      clients: parsed.users?.length ?? 0,
      workOrders: parsed.workOrders?.length ?? 0,
      leads: parsed.leads?.length ?? 0,
    },
    null,
    2
  )
);
