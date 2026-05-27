import { NextResponse } from "next/server";
import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import { ensureClientForSign } from "@/lib/client-sign";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { issueClientToken } from "@/lib/server/issue-client-token";
import {
  verifyTelegramWidgetAuth,
  type TelegramWidgetUser,
} from "@/lib/server/verify-telegram-auth";
import type { Database, User } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = TelegramWidgetUser & {
  plate?: string;
  phone?: string;
};

function findByTelegramId(db: Database, telegramUserId: number): User | undefined {
  return db.users.find(
    (u) => u.role === "client" && u.telegramUserId === telegramUserId
  );
}

function findByPhone(db: Database, phone: string): User | undefined {
  const normalized = normalizePhone(phone);
  return db.users.find(
    (u) => u.role === "client" && normalizePhone(u.phone) === normalized
  );
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (!verifyTelegramWidgetAuth(body)) {
    return NextResponse.json({ ok: false, error: "invalid_telegram" }, { status: 401 });
  }

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });
  }

  const db = structuredClone(snap.doc) as Database;
  const telegramUserId = body.id;
  const phone = body.phone ? normalizePhone(body.phone) : "";
  const plate = body.plate?.trim() ?? "";
  const plateKey = normalizePlateKey(plate);

  let user =
    findByTelegramId(db, telegramUserId) ?? (phone ? findByPhone(db, phone) : undefined);

  if (!user) {
    if (plateKey.length >= 2 && phone) {
      try {
        const ensured = await ensureClientForSign(db, phone, plate);
        user = ensured.user;
      } catch {
        return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
      }
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: "need_plate",
          telegramId: telegramUserId,
          firstName: body.first_name,
          username: body.username,
        },
        { status: 422 }
      );
    }
  } else if (plateKey.length >= 2) {
    try {
      await ensureClientForSign(db, user.phone, plate);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    }
  }

  user.telegramUserId = telegramUserId;
  user.telegramUsername = body.username;
  user.telegramLinkedAt = new Date().toISOString();
  const displayName = [body.first_name, body.last_name].filter(Boolean).join(" ").trim();
  if (displayName && (!user.name || user.name.startsWith("Client "))) {
    user.name = displayName;
  }

  const put = await cloudPutCrmStore(db);
  if (!put.ok) {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
  }

  const token = await issueClientToken(user.id, user.phone);
  return NextResponse.json({
    ok: true,
    token,
    user: { id: user.id, name: user.name, phone: user.phone },
  });
}
