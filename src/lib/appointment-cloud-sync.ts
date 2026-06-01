import type { Appointment, Database } from "./store";
import { pushAppointmentToCloud } from "./cloud-appointments";
import { pushCrmToCloud } from "./cloud-crm-db";

/** Sync one appointment row + full CRM snapshot (calendar, hot orders). */
export async function syncAppointmentToCloud(
  db: Database,
  apt: Appointment
): Promise<boolean> {
  const [aptOk, crmOk] = await Promise.all([
    pushAppointmentToCloud(apt),
    pushCrmToCloud(db),
  ]);
  if (!aptOk) console.warn("[cloud] appointment row sync failed", apt.id);
  if (!crmOk) console.warn("[cloud] crm snapshot sync failed");
  return aptOk && crmOk;
}
