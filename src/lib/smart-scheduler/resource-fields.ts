/** Old rows may have only resourceId. New rows may have resourceIds. Occupancy uses every id from both. */
export function resourceIdsForOccupancy(doc: { resourceId?: string; resourceIds?: string[] }): string[] {
  const list = Array.isArray(doc.resourceIds) ? doc.resourceIds.filter((id) => Boolean(id)) : [];
  const ids = new Set(list);
  if (doc.resourceId) ids.add(doc.resourceId);
  return [...ids];
}

/** Keep resourceId readable by the old CRM and resourceIds readable by the planner. */
export function compatibleResourceFields(
  resourceId?: string,
  resourceIds?: string[]
): { resourceId?: string; resourceIds?: string[] } {
  const list = [...new Set((resourceIds ?? []).filter((id) => Boolean(id)))];
  const single = resourceId?.trim() || "";
  if (!list.length && !single) return {};
  if (!list.length) return { resourceId: single, resourceIds: [single] };
  if (!single) return { resourceId: list[0], resourceIds: list };
  if (!list.includes(single)) return { resourceId: single, resourceIds: [single, ...list] };
  return { resourceId: single, resourceIds: list };
}

