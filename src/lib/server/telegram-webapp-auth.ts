import { createHmac, timingSafeEqual } from "crypto";
import { cleanEnvValue } from "@/lib/server/supabase-config";

export type TelegramWebAppUser = {
  id: number;
  username?: string;
  languageCode?: string;
};

export type WebAppAuthResult =
  | { ok: true; user: TelegramWebAppUser }
  | { ok: false; error: "missing" | "bad_signature" | "stale" | "no_user" };

const MAX_AGE_SEC = 24 * 60 * 60;

export function verifyTelegramWebAppInitData(
  initData: string | null | undefined,
  nowSec = Math.floor(Date.now() / 1000)
): WebAppAuthResult {
  const token = cleanEnvValue(process.env.TELEGRAM_BOT_TOKEN);
  if (!token || !initData?.trim()) return { ok: false, error: "missing" };

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { ok: false, error: "bad_signature" };
  }

  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]+$/i.test(hash)) return { ok: false, error: "bad_signature" };

  const pairs: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();

  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hmac = createHmac("sha256", secret).update(pairs.join("\n")).digest("hex");
  const left = Buffer.from(hmac, "utf8");
  const right = Buffer.from(hash, "utf8");
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false, error: "bad_signature" };
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate)) return { ok: false, error: "stale" };
  const age = nowSec - authDate;
  if (age < -60 || age > MAX_AGE_SEC) return { ok: false, error: "stale" };

  const rawUser = params.get("user");
  if (!rawUser) return { ok: false, error: "no_user" };
  try {
    const user = JSON.parse(rawUser) as {
      id?: number;
      username?: string;
      language_code?: string;
    };
    if (!user?.id || !Number.isFinite(Number(user.id))) return { ok: false, error: "no_user" };
    return {
      ok: true,
      user: {
        id: Number(user.id),
        username: user.username,
        languageCode: user.language_code,
      },
    };
  } catch {
    return { ok: false, error: "no_user" };
  }
}
