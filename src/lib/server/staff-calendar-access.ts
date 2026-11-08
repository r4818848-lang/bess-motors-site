import { cleanEnvValue } from "@/lib/server/supabase-config";
import { getTelegramConfig } from "@/lib/server/telegram-api";
import { resolveMechanicActor } from "@/lib/server/telegram-bot/telegram-actor";
import type { StaffCalendarRole } from "@/lib/staff-calendar";

export type StaffCalendarActor = {
  role: StaffCalendarRole;
  telegramUserId: number;
  mechanicId?: string;
  name?: string;
  seeAll: boolean;
  canEdit: boolean;
};

function ownerIds(): Set<string> {
  const set = new Set<string>();
  const explicit = cleanEnvValue(process.env.TELEGRAM_OWNER_CHAT_ID);
  if (explicit) {
    for (const id of explicit.split(",")) {
      const trimmed = id.trim();
      if (trimmed) set.add(trimmed);
    }
    return set;
  }
  const primary = cleanEnvValue(process.env.TELEGRAM_CHAT_ID);
  if (primary) set.add(primary);
  return set;
}

export function staffRoleFromIds(
  telegramUserId: string,
  owners: ReadonlySet<string>,
  admins: ReadonlySet<string>
): "owner" | "admin" | null {
  if (owners.has(telegramUserId)) return "owner";
  if (admins.has(telegramUserId)) return "admin";
  return null;
}

export async function resolveStaffCalendarActor(
  telegramUserId: number
): Promise<StaffCalendarActor | null> {
  const key = String(telegramUserId);
  const cfg = getTelegramConfig();
  const role = staffRoleFromIds(key, ownerIds(), cfg?.adminChatIds ?? new Set());
  if (role === "owner") {
    return { role: "owner", telegramUserId, seeAll: true, canEdit: true };
  }
  if (role === "admin") {
    return { role: "admin", telegramUserId, seeAll: true, canEdit: true };
  }

  const mechanic = await resolveMechanicActor(telegramUserId);
  if (!mechanic) return null;
  const scope = cleanEnvValue(process.env.TELEGRAM_MECHANIC_CALENDAR);
  return {
    role: "mechanic",
    telegramUserId,
    mechanicId: mechanic.mechanicId,
    name: mechanic.name,
    seeAll: scope === "all",
    canEdit: cleanEnvValue(process.env.TELEGRAM_MECHANIC_CAN_EDIT) === "true",
  };
}
