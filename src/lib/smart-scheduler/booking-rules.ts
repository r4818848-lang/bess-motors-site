import type { Operation } from "@/lib/smart-scheduler/catalog";
import { resourceReady, type ResourceSetting } from "@/lib/smart-scheduler/settings";

export type BookingActor = {
  role: string;
  mechanicId?: string;
  canEdit: boolean;
  id: string;
  staffId?: string;
  sessionId?: string;
};

export function mayChangeExistingReservation(actor: BookingActor, currentMechanicId: string, nextMechanicId: string): boolean {
  if (actor.role === "owner" || actor.role === "admin") return true;
  if (actor.role !== "mechanic" || !actor.canEdit || !actor.mechanicId) return false;
  return actor.mechanicId === currentMechanicId && actor.mechanicId === nextMechanicId;
}

export function bookingFingerprint(input: {
  operationCode: string;
  mechanicId: string;
  date: string;
  start: string;
  minutes: number;
  resourceIds: string[];
  parts: string;
  requestId?: string;
}): string {
  return [
    input.operationCode,
    input.mechanicId,
    input.date,
    input.start,
    String(input.minutes),
    [...input.resourceIds].sort().join(","),
    input.parts,
    input.requestId ?? "",
  ].join("|");
}

/** Catalog decides which equipment is mandatory. Extra ids are ignored. */
export function selectRequiredResources(
  operation: Pick<Operation, "requiredResources">,
  requestedIds: string[],
  resources: ResourceSetting[]
): { ok: true; resourceIds: string[] } | { ok: false; error: "equipment" } {
  const ids: string[] = [];
  for (const kind of operation.requiredResources) {
    if (kind === "mechanic") continue;
    const ready = requestedIds.find((id) => {
      const resource = resources.find((item) => item.id === id);
      return resource?.kind === kind && resourceReady(resources, id);
    });
    if (!ready) return { ok: false, error: "equipment" };
    ids.push(ready);
  }
  return { ok: true, resourceIds: ids };
}
