import type { WorkOrder } from "./store";

/**
 * Mechanics may save work orders and payments, but the acquisition proof is
 * a financial reporting approval restricted to administrators. This normalizes
 * generic CRM PUT writes without changing other order details.
 */
export function preserveVerifiedAcquisitionForStaff(
  incoming: WorkOrder[],
  existing: WorkOrder[]
): WorkOrder[] {
  const trusted = new Map(existing.map(o => [o.id, o.verifiedAcquisition]));
  return incoming.map(order => ({
    ...order,
    verifiedAcquisition: trusted.get(order.id),
  }));
}
