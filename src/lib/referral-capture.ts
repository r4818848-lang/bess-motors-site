import { notifyReferralFriendJoined } from "@/lib/client-notifications";
import { applyReferralToUser } from "@/lib/referral-system";
import type { Database } from "@/lib/store";

const REF_KEY = "bess-pending-referral";

export function captureReferralFromUrl(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref")?.trim();
  if (!ref) return;
  localStorage.setItem(REF_KEY, ref);
}

export function getPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REF_KEY);
}

export function clearPendingReferralCode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REF_KEY);
}

export function applyPendingReferralForUser(db: Database, userId: string): boolean {
  const code = getPendingReferralCode();
  if (!code) return false;
  const res = applyReferralToUser(db, userId, code);
  if (res.ok) {
    clearPendingReferralCode();
    if (res.referrerId) notifyReferralFriendJoined(db, res.referrerId);
    return true;
  }
  return false;
}
