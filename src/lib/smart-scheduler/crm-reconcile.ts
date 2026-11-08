import { createHash } from "node:crypto";

/** One comparable CRM interval. Date and workStart are civil Europe/Warsaw values. */
export type CrmAppointmentDoc = {
  id?: string;
  mechanicId?: string;
  date?: string;
  workStart?: string;
  workMinutes?: number | string;
  resourceId?: string;
  resourceIds?: string[];
  appointmentStatus?: string;
  visitState?: string;
  calendarHidden?: boolean;
};

function resourcesOf(doc: CrmAppointmentDoc): string[] {
  if (Array.isArray(doc.resourceIds) && doc.resourceIds.length > 0) return [...new Set(doc.resourceIds.map((id) => id ?? ""))];
  return [doc.resourceId ?? ""];
}

function activeBit(doc: CrmAppointmentDoc): "0" | "1" {
  if (doc.appointmentStatus === "cancelled" || doc.appointmentStatus === "completed") return "0";
  if (doc.visitState === "no_show") return "0";
  if (doc.calendarHidden === true) return "0";
  return "1";
}

function minutesOf(doc: CrmAppointmentDoc): string {
  if (doc.workMinutes == null || doc.workMinutes === "") return "0";
  return String(doc.workMinutes);
}

/** Canonical lines: id, mechanic, date, work start, minutes, resource, status, activity. Sorted. */
export function canonicalCrmLines(docs: CrmAppointmentDoc[]): string[] {
  const lines: string[] = [];
  for (const doc of docs) {
    for (const resourceId of resourcesOf(doc)) {
      lines.push([
        doc.id ?? "",
        doc.mechanicId ?? "",
        doc.date ?? "",
        doc.workStart ?? "",
        minutesOf(doc),
        resourceId,
        doc.appointmentStatus ?? "",
        activeBit(doc),
      ].join("|"));
    }
  }
  lines.sort();
  return lines;
}

export function canonicalCrmDigest(docs: CrmAppointmentDoc[]): string {
  const lines = canonicalCrmLines(docs);
  return createHash("md5").update(lines.length ? lines.join(",") : "empty").digest("hex");
}

export function crmSurfacesMatch(storeDocs: CrmAppointmentDoc[], rowDocs: CrmAppointmentDoc[]): boolean {
  const left = canonicalCrmLines(storeDocs);
  const right = canonicalCrmLines(rowDocs);
  if (left.length !== right.length) return false;
  return left.every((line, index) => line === right[index]);
}
