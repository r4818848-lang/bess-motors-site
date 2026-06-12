import { getSupabaseConfig } from "@/lib/server/supabase-config";

const ROW_ID = "telegram_bot";

export type TelegramSessionStep =
  | "expense_input"
  | "report_custom_from"
  | "report_custom_to"
  | "search_input"
  | "client_name"
  | "client_phone"
  | "client_comment"
  | "client_my_phone"
  | "client_link_phone"
  | "client_link_plate"
  | "client_link_confirm"
  | "client_link_name"
  | "client_vin_input"
  | "client_vin_plate"
  | "client_vin_confirm"
  | "client_photo_upload"
  | "client_symptom"
  | "admin_quick_apt"
  | "admin_custom_msg"
  | "admin_extra_work"
  | "admin_import_file"
  | "admin_import_review"
  | "admin_import_phone"
  | "admin_quick_wo"
  | "admin_parts_wizard"
  | "admin_cons_wizard";

export type TelegramSession = {
  step?: TelegramSessionStep;
  data?: Record<string, string>;
};

type TelegramBotDoc = {
  sessions: Record<string, TelegramSession>;
};

const emptyDoc = (): TelegramBotDoc => ({ sessions: {} });

async function readDoc(): Promise<TelegramBotDoc | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/crm_store?id=eq.${ROW_ID}&select=doc`,
      {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { doc?: TelegramBotDoc }[];
    const doc = rows[0]?.doc;
    if (!doc?.sessions) return emptyDoc();
    return doc;
  } catch {
    return null;
  }
}

async function writeDoc(doc: TelegramBotDoc): Promise<boolean> {
  const cfg = getSupabaseConfig();
  if (!cfg) return false;

  const row = {
    id: ROW_ID,
    doc,
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${cfg.url}/rest/v1/crm_store`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      console.warn("[telegram] session write failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[telegram] session write error", e);
    return false;
  }
}

export async function getTelegramSession(chatId: string): Promise<TelegramSession> {
  const doc = await readDoc();
  if (!doc) return {};
  return doc.sessions[chatId] ?? {};
}

function applySessionChange(
  sessions: Record<string, TelegramSession>,
  chatId: string,
  session: TelegramSession | null
): void {
  if (!session || (!session.step && !session.data)) {
    delete sessions[chatId];
  } else {
    sessions[chatId] = session;
  }
}

/** Merge session updates — avoids losing other chats on concurrent webhook calls. */
export async function setTelegramSession(
  chatId: string,
  session: TelegramSession | null
): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const latest = (await readDoc()) ?? emptyDoc();
    const sessions = { ...latest.sessions };
    applySessionChange(sessions, chatId, session);
    const written = await writeDoc({ sessions });
    if (!written) continue;

    const after = await readDoc();
    if (!after) continue;

    const expected = sessions[chatId];
    const actual = after.sessions[chatId];
    const oursOk =
      JSON.stringify(expected ?? null) === JSON.stringify(actual ?? null);
    if (oursOk) return;

    if (attempt === 5) {
      console.warn("[telegram] session write conflict after retries", chatId);
    }
  }
}

export async function clearTelegramSession(chatId: string): Promise<void> {
  await setTelegramSession(chatId, null);
}
