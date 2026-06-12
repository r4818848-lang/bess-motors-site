import { DB_CHANGED_EVENT } from "./db-events";
import type { Appointment, Database } from "./store";
import { pushAppointmentToCloud } from "./cloud-appointments";
import { isCrmDraftLockActive } from "./crm-draft-lock";
import { pullCrmFromCloud, pushCrmSave } from "./cloud-crm-db";

/** Sync one appointment row + full CRM snapshot (calendar, hot orders). */
export async function syncAppointmentToCloud(
  db: Database,
  apt: Appointment
): Promise<boolean> {
  const [aptPush, crmOk] = await Promise.all([
    pushAppointmentToCloud(apt),
    pushCrmSave(db),
  ]);
  const aptOk = aptPush.ok;
  if (!aptOk) console.warn("[cloud] appointment row sync failed", apt.id);
  if (!crmOk) console.warn("[cloud] crm snapshot sync failed");
  if (!aptOk || !crmOk) {
    if (!isCrmDraftLockActive()) await pullCrmFromCloud({ force: true });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
    }
  }
  return aptOk && crmOk;
}
