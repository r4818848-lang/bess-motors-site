import { normalizePhone } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { isAuthorizedChat } from "@/lib/server/telegram-api";
import type { Database, User } from "@/lib/store";
import { loadCrmFromCloud, mutateCrm } from "./crm-actions";

export type MechanicActor = {
  mechanicId: string;
  userId: string;
  name: string;
};

function mechanicBindingsFromEnv(): Map<string, string> {
  const map = new Map<string, string>();
  const raw = cleanEnvValue(process.env.TELEGRAM_MECHANIC_BINDINGS);
  if (!raw) return map;
  for (const part of raw.split(",")) {
    const [chatId, mechId] = part.split(":").map((s) => s.trim());
    if (chatId && mechId) map.set(chatId, mechId);
  }
  return map;
}

function mechanicChatIdsFromEnv(): Set<string> {
  const set = new Set<string>();
  const raw = cleanEnvValue(process.env.TELEGRAM_MECHANIC_CHAT_IDS);
  if (!raw) return set;
  for (const id of raw.split(",")) {
    const trimmed = id.trim();
    if (trimmed) set.add(trimmed);
  }
  return set;
}

export function findMechanicInDb(db: Database, chatId: number | string): MechanicActor | null {
  const key = String(chatId);
  const user = db.users.find(
    (u) => u.role === "mechanic" && u.telegramChatId === key
  );
  if (!user) return null;
  const profile = db.mechanics.find((m) => m.id === user.id);
  return {
    mechanicId: user.id,
    userId: user.id,
    name: profile?.name ?? user.name,
  };
}

export async function resolveMechanicActor(
  chatId: number
): Promise<MechanicActor | null> {
  const key = String(chatId);
  const bindings = mechanicBindingsFromEnv();
  const boundMechId = bindings.get(key);

  const db = await loadCrmFromCloud();
  if (db) {
    const linked = findMechanicInDb(db, chatId);
    if (linked) return linked;
    if (boundMechId) {
      const user = db.users.find((u) => u.id === boundMechId && u.role === "mechanic");
      const profile = db.mechanics.find((m) => m.id === boundMechId);
      if (user) {
        return {
          mechanicId: boundMechId,
          userId: user.id,
          name: profile?.name ?? user.name,
        };
      }
    }
    if (mechanicChatIdsFromEnv().has(key)) {
      const first = db.users.find((u) => u.role === "mechanic");
      if (first) {
        const profile = db.mechanics.find((m) => m.id === first.id);
        return {
          mechanicId: first.id,
          userId: first.id,
          name: profile?.name ?? first.name,
        };
      }
    }
  }

  return null;
}

export function isAdminTelegramChat(chatId: number): boolean {
  return isAuthorizedChat(chatId);
}

export async function linkMechanicTelegram(
  chatId: number,
  phone: string,
  password: string
): Promise<{ ok: boolean; message: string; actor?: MechanicActor }> {
  const db = await loadCrmFromCloud();
  if (!db) {
    return { ok: false, message: "☁️ CRM недоступна. Проверьте Supabase." };
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { ok: false, message: "❌ Неверный номер телефона." };
  }

  const user = db.users.find(
    (u) => u.role === "mechanic" && normalizePhone(u.phone) === normalized
  );
  if (!user) {
    return { ok: false, message: "❌ Механик с таким телефоном не найден в CRM." };
  }

  const passOk =
    (user.passwordHash && verifyPassword(password, user.passwordHash)) ||
    user.password === password;
  if (!passOk) {
    return { ok: false, message: "❌ Неверный пароль." };
  }

  const result = await mutateCrm((fresh) => {
    const u = fresh.users.find((x) => x.id === user.id) as User | undefined;
    if (!u) return false;
    u.telegramChatId = String(chatId);
    u.telegramLinkedAt = new Date().toISOString();
    return u.id;
  });

  if (!result.ok) {
    return { ok: false, message: "❌ Не удалось сохранить привязку в облако." };
  }

  const profile = db.mechanics.find((m) => m.id === user.id);
  return {
    ok: true,
    message: `✅ Telegram привязан к механику <b>${profile?.name ?? user.name}</b>.`,
    actor: {
      mechanicId: user.id,
      userId: user.id,
      name: profile?.name ?? user.name,
    },
  };
}
