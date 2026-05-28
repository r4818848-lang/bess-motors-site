import type { Database, User } from "@/lib/store";
import { saveDb } from "@/lib/store";

/** Ensure client has a referral code (browser CRM/cabinet). */
export function ensureReferralCode(user: User, db?: Database): string {
  if (user.referralCode) return user.referralCode;
  const code = `r${user.id.replace(/\W/g, "").slice(-6)}${Math.random().toString(36).slice(2, 5)}`;
  user.referralCode = code;
  if (db && typeof window !== "undefined") {
    const idx = db.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      db.users[idx]!.referralCode = code;
      saveDb(db);
    }
  }
  return code;
}
