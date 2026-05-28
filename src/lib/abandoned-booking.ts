import type { AbandonedBookingDraft, AppSettings } from "./store";

export type { AbandonedBookingDraft };

export function getAbandonedDrafts(settings: AppSettings): AbandonedBookingDraft[] {
  return settings.abandonedBookingDrafts ?? [];
}

export function upsertAbandonedDraft(
  settings: AppSettings,
  draft: Omit<AbandonedBookingDraft, "id" | "updatedAt"> & { id?: string }
): AbandonedBookingDraft {
  const list = getAbandonedDrafts(settings);
  const id = draft.id ?? `abd-${Date.now()}`;
  const entry: AbandonedBookingDraft = {
    ...draft,
    id,
    updatedAt: new Date().toISOString(),
  };
  const idx = list.findIndex((d) => d.phone === draft.phone);
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  settings.abandonedBookingDrafts = list.slice(-200);
  return entry;
}
