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
  | "admin_import_phone";

export type TelegramSession = {
  step?: TelegramSessionStep;
  data?: Record<string, string>;
};

type TelegramBotDoc = {
  sessions: Record<string, TelegramSession>;
};

const emptyDoc = (): TelegramBotDoc => ({ sessions: {} });

async function readDoc(): Promise<TelegramBotDoc> {
  const cfg = getSupabaseConfig();
  if (!cfg) return emptyDoc();

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
    if (!res.ok) return emptyDoc();
    const rows = (await res.json()) as { doc?: TelegramBotDoc }[];
    return rows[0]?.doc?.sessions ? rows[0].doc! : emptyDoc();
  } catch {
    return emptyDoc();
  }
}

async function writeDoc(doc: TelegramBotDoc): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg) return;

  const row = {
    id: ROW_ID,
    doc,
    updated_at: new Date().toISOString(),
  };

  await fetch(`${cfg.url}/rest/v1/crm_store`, {
    method: "POST",
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(row),
  }).catch(() => null);
}

export async function getTelegramSession(chatId: string): Promise<TelegramSession> {
  const doc = await readDoc();
  return doc.sessions[chatId] ?? {};
}

export async function setTelegramSession(
  chatId: string,
  session: TelegramSession | null
): Promise<void> {
  const doc = await readDoc();
  if (!session || (!session.step && !session.data)) {
    delete doc.sessions[chatId];
  } else {
    doc.sessions[chatId] = session;
  }
  await writeDoc(doc);
}

export async function clearTelegramSession(chatId: string): Promise<void> {
  await setTelegramSession(chatId, null);
}
