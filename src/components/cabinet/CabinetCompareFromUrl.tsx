"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { loadDb } from "@/lib/store";
import { WorkOrderCompare } from "@/components/cabinet/WorkOrderCompare";

export function CabinetCompareFromUrl({ userId }: { userId: string }) {
  const params = useSearchParams();
  const compare = params.get("compare");

  const pair = useMemo(() => {
    if (!compare) return null;
    const ids = compare.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length < 2) return null;
    const db = loadDb();
    const orders = ids
      .map((id) => db.workOrders.find((o) => o.id === id || o.number === id))
      .filter((o): o is NonNullable<typeof o> => !!o && o.userId === userId);
    return orders.length >= 2 ? [orders[0]!, orders[1]!] : null;
  }, [compare, userId]);

  if (!pair) return null;
  const db = loadDb();
  return <WorkOrderCompare orders={pair} db={db} />;
}
