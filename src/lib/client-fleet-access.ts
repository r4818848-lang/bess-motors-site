import type { ClientPortalSlice } from "@/lib/client-sign";
import type { User } from "@/lib/store";

/** CRM tag: client sees fleet billing reports in Telegram (not admin, not default for everyone). */
export const FLEET_CLIENT_TAG = "fleet";

export function isFleetPortalClient(slice: ClientPortalSlice | null | undefined): boolean {
  if (!slice?.user || slice.user.role !== "client") return false;
  return slice.user.clientTags?.includes(FLEET_CLIENT_TAG) ?? false;
}

export function isFleetPortalUser(user: User | null | undefined): boolean {
  if (!user || user.role !== "client") return false;
  return user.clientTags?.includes(FLEET_CLIENT_TAG) ?? false;
}

export function setFleetClientTag(user: User, enabled: boolean): void {
  const tags = new Set(user.clientTags ?? []);
  if (enabled) tags.add(FLEET_CLIENT_TAG);
  else tags.delete(FLEET_CLIENT_TAG);
  user.clientTags = tags.size > 0 ? [...tags] : undefined;
}
