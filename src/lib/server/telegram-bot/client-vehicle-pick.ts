import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import type { BotLocale } from "./client-i18n";
import { getClientBotLabels } from "./client-i18n";
import type { ClientPortalSlice } from "@/lib/client-sign";
import type { Database } from "@/lib/store";

export function vehiclePickKeyboard(
  locale: BotLocale,
  slice: ClientPortalSlice
): InlineKeyboardMarkup | null {
  if (slice.vehicles.length < 2) return null;
  const L = getClientBotLabels(locale);
  const rows = slice.vehicles.map((v) => [
    {
      text: `${v.plate || "—"} · ${v.make} ${v.model}`,
      callback_data: `cl:veh:${v.id}`,
    },
  ]);
  rows.push([{ text: L.menu, callback_data: "cl:menu" }]);
  return { inline_keyboard: rows };
}

export async function setActiveVehicle(
  chatKey: string,
  vehicleId: string
): Promise<boolean> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return false;
  const db = structuredClone(snap.doc) as Database;
  const user = db.users.find((u) => u.telegramChatId === chatKey && u.role === "client");
  if (!user) return false;
  const owned = db.vehicles.some((v) => v.id === vehicleId && v.userId === user.id);
  if (!owned) return false;
  user.telegramActiveVehicleId = vehicleId;
  await cloudPutCrmStore(db);
  return true;
}

export function resolveActiveVehicleId(
  slice: ClientPortalSlice
): string | undefined {
  const pref = slice.user.telegramActiveVehicleId;
  if (pref && slice.vehicles.some((v) => v.id === pref)) return pref;
  return slice.vehicles[0]?.id;
}
