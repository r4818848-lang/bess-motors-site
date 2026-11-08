import { mergeServerCloudMutation } from "@/lib/crm-db-merge";
import { runCrmAutomation } from "@/lib/crm-automation";
import type { Database } from "@/lib/store";
import { applyWorkOrderCompletedAt } from "@/lib/work-order-dates";
import { applyWorkOrderClosure } from "@/lib/work-order-lifecycle";
import { cloudGetCrmStore, patchCrmIfUnchanged } from "./crm-cloud";

function docForCloud(db: Database): Database {
  return { ...db, currentUserId: null };
}

function prepareIncoming(db: Database): Database {
  return docForCloud({
    ...db,
    workOrders: db.workOrders.map((o) =>
      applyWorkOrderCompletedAt(applyWorkOrderClosure(o))
    ),
  });
}

export type CloudMutateResult = { ok: boolean; error?: string; result?: string };

/**
 * Read cloud CRM → mutate → merge with latest snapshot → PUT.
 * Same merge path as web PUT /api/crm-db (without browser lastCloudSyncedAt).
 */
export async function cloudMutateCrmStore(
  mutator: (db: Database) => void | string | false | Promise<void | string | false>,
  options?: { skipAutomation?: boolean }
): Promise<CloudMutateResult> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const snap = await cloudGetCrmStore();
    if (!snap?.doc) return { ok: false, error: "cloud_empty" };

    const prevDb = structuredClone(snap.doc) as Database;
    const working = structuredClone(snap.doc) as Database;
    const extra = await mutator(working);
    if (extra === false) return { ok: false, error: "not_found" };

    const incoming = prepareIncoming(working);
    const payload = mergeServerCloudMutation(snap.doc, incoming);
    if (!options?.skipAutomation) runCrmAutomation(payload, prevDb);

    const put = await patchCrmIfUnchanged(payload, snap.updatedAt);
    if (put === "stale") continue;
    if (put === "ok") {
      const { notifyAfterCrmCloudSave } = await import("./crm-cloud-notify");
      void notifyAfterCrmCloudSave(prevDb, payload);
      return { ok: true, result: typeof extra === "string" ? extra : undefined };
    }
  }

  return { ok: false, error: "conflict" };
}

/** One shared CRM lease. A second Vercel project sees the hold and does not send. */
export async function tryClaimCronJob(job: string, holdMs: number, now = new Date()): Promise<boolean> {
  const until = new Date(now.getTime() + holdMs).toISOString();
  const result = await cloudMutateCrmStore((db) => {
    const current = db.settings.cronHoldUntil?.[job];
    if (current && Date.parse(current) > now.getTime()) return "held";
    db.settings.cronHoldUntil = { ...(db.settings.cronHoldUntil ?? {}), [job]: until };
    return "claimed";
  }, { skipAutomation: true });
  return result.ok && result.result === "claimed";
}

export function cronHoldActive(untilIso: string | undefined, now: Date): boolean {
  if (!untilIso) return false;
  const until = Date.parse(untilIso);
  return Number.isFinite(until) && until > now.getTime();
}
