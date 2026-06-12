import { mergeServerCloudMutation } from "@/lib/crm-db-merge";
import { runCrmAutomation } from "@/lib/crm-automation";
import type { Database } from "@/lib/store";
import { applyWorkOrderCompletedAt } from "@/lib/work-order-dates";
import { applyWorkOrderClosure } from "@/lib/work-order-lifecycle";
import { cloudGetCrmStore, cloudPutCrmStore } from "./crm-cloud";

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
  mutator: (db: Database) => void | string | false | Promise<void | string | false>
): Promise<CloudMutateResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const snap = await cloudGetCrmStore();
    if (!snap?.doc) return { ok: false, error: "cloud_empty" };

    const prevDb = structuredClone(snap.doc) as Database;
    const working = structuredClone(snap.doc) as Database;
    const extra = await mutator(working);
    if (extra === false) return { ok: false, error: "not_found" };

    const incoming = prepareIncoming(working);
    let payload = mergeServerCloudMutation(snap.doc, incoming);

    const fresh = await cloudGetCrmStore();
    if (fresh?.doc && fresh.updatedAt !== snap.updatedAt) {
      payload = mergeServerCloudMutation(fresh.doc, incoming);
      runCrmAutomation(payload, fresh.doc as Database);
    } else {
      runCrmAutomation(payload, prevDb);
    }

    const put = await cloudPutCrmStore(payload);
    if (put.ok) {
      return { ok: true, result: typeof extra === "string" ? extra : undefined };
    }
    if (attempt === 2) return { ok: false, error: put.error };
  }

  return { ok: false, error: "put_failed" };
}
