import type { Database, User, WorkOrder } from "@/lib/store";

/** Qualified invite: referred client has a paid, delivered (closed) work order. */
export const REFERRAL_QUALIFIED_REQUIRED = 5;
export const REFERRAL_REWARD_DISCOUNT_PERCENT = 15;
export const REFERRAL_INVITEE_DISCOUNT_PERCENT = 5;
export const REFERRAL_DISCOUNT_VALID_DAYS = 90;

export type ReferralInviteStatus = "registered" | "pending_visit" | "qualified";

export type ReferredClientDetail = {
  userId: string;
  name: string;
  phone: string;
  referredAt?: string;
  status: ReferralInviteStatus;
  qualifyingOrderNumber?: string;
  qualifyingOrderDate?: string;
  totalOrders: number;
  paidDeliveredOrders: number;
  inviteeDiscountAvailable: boolean;
  inviteeDiscountUsed: boolean;
};

export type ReferrerSummary = {
  referrerId: string;
  code: string;
  name: string;
  phone: string;
  registeredCount: number;
  qualifiedCount: number;
  required: number;
  rewardPercent: number;
  discountAvailable: boolean;
  discountUsed: boolean;
  discountExpiresAt?: string;
  discountUsedOnOrderId?: string;
  discountUsedOnOrderNumber?: string;
  rewardUnlockedAt?: string;
  referred: ReferredClientDetail[];
};

export function isReferralQualifiedWorkOrder(order: WorkOrder): boolean {
  return order.paymentStatus === "paid" && order.status === "delivered";
}

export function getQualifyingWorkOrders(db: Database, userId: string): WorkOrder[] {
  return db.workOrders
    .filter((o) => o.userId === userId && isReferralQualifiedWorkOrder(o))
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
}

export function hasReferralQualifiedVisit(db: Database, userId: string): boolean {
  return getQualifyingWorkOrders(db, userId).length > 0;
}

function isReferrerDiscountExpired(user: User): boolean {
  if (!user.referralDiscountExpiresAt) return false;
  return new Date(user.referralDiscountExpiresAt).getTime() < Date.now();
}

export function setReferralDiscountExpiry(user: User, fromDate = new Date()): void {
  const until = new Date(fromDate);
  until.setDate(until.getDate() + REFERRAL_DISCOUNT_VALID_DAYS);
  user.referralDiscountExpiresAt = until.toISOString();
}

function describeReferredClient(db: Database, client: User): ReferredClientDetail {
  const paidDelivered = getQualifyingWorkOrders(db, client.id);
  const allOrders = db.workOrders.filter((o) => o.userId === client.id);
  const firstQualified = paidDelivered[0];

  let status: ReferralInviteStatus = "registered";
  if (paidDelivered.length > 0) status = "qualified";
  else if (allOrders.length > 0) status = "pending_visit";

  const inviteeDiscountUsed = Boolean(client.referredFriendDiscountUsedAt);
  const inviteeDiscountAvailable =
    Boolean(client.referredFriendRewardUnlockedAt) && !inviteeDiscountUsed;

  return {
    userId: client.id,
    name: client.name,
    phone: client.phone,
    referredAt: client.referredAt,
    status,
    qualifyingOrderNumber: firstQualified?.number,
    qualifyingOrderDate: firstQualified?.updatedAt?.slice(0, 10),
    totalOrders: allOrders.length,
    paidDeliveredOrders: paidDelivered.length,
    inviteeDiscountAvailable,
    inviteeDiscountUsed,
  };
}

export function buildReferrerSummary(db: Database, referrerId: string): ReferrerSummary | null {
  const referrer = db.users.find((u) => u.id === referrerId && u.role === "client");
  if (!referrer) return null;

  const referredUsers = db.users.filter(
    (u) => u.role === "client" && u.referredByUserId === referrerId
  );
  const referred = referredUsers.map((c) => describeReferredClient(db, c));
  const qualifiedCount = referred.filter((r) => r.status === "qualified").length;

  const discountUsed = Boolean(referrer.referralDiscountUsedAt);
  const expired = isReferrerDiscountExpired(referrer);
  const discountAvailable =
    qualifiedCount >= REFERRAL_QUALIFIED_REQUIRED &&
    !discountUsed &&
    Boolean(referrer.referralRewardUnlockedAt) &&
    !expired;

  const usedOrder = referrer.referralDiscountUsedOnOrderId
    ? db.workOrders.find((o) => o.id === referrer.referralDiscountUsedOnOrderId)
    : undefined;

  return {
    referrerId: referrer.id,
    code: referrer.referralCode ?? referrer.id.slice(0, 8),
    name: referrer.name,
    phone: referrer.phone,
    registeredCount: referred.length,
    qualifiedCount,
    required: REFERRAL_QUALIFIED_REQUIRED,
    rewardPercent: REFERRAL_REWARD_DISCOUNT_PERCENT,
    discountAvailable,
    discountUsed,
    discountExpiresAt: referrer.referralDiscountExpiresAt,
    discountUsedOnOrderId: referrer.referralDiscountUsedOnOrderId,
    discountUsedOnOrderNumber: usedOrder?.number,
    rewardUnlockedAt: referrer.referralRewardUnlockedAt,
    referred,
  };
}

export function recomputeReferrerFromDb(db: Database, referrerId: string): {
  referrer: User;
  summary: ReferrerSummary;
  justUnlocked: boolean;
} | null {
  const referrer = db.users.find((u) => u.id === referrerId && u.role === "client");
  if (!referrer) return null;

  const referredUsers = db.users.filter(
    (u) => u.role === "client" && u.referredByUserId === referrerId
  );
  const qualifiedCount = referredUsers.filter((c) =>
    hasReferralQualifiedVisit(db, c.id)
  ).length;

  referrer.referralQualifiedCount = qualifiedCount;

  let justUnlocked = false;
  if (
    qualifiedCount >= REFERRAL_QUALIFIED_REQUIRED &&
    !referrer.referralRewardUnlockedAt
  ) {
    referrer.referralRewardUnlockedAt = new Date().toISOString();
    setReferralDiscountExpiry(referrer);
    justUnlocked = true;
  } else if (
    referrer.referralRewardUnlockedAt &&
    !referrer.referralDiscountExpiresAt &&
    !referrer.referralDiscountUsedAt
  ) {
    setReferralDiscountExpiry(referrer, new Date(referrer.referralRewardUnlockedAt));
  }

  const summary = buildReferrerSummary(db, referrerId)!;
  return { referrer, summary, justUnlocked };
}

/** Unlock 5% for referred client on first qualified visit. */
export function unlockInviteeRewardIfEligible(
  db: Database,
  client: User
): boolean {
  if (!client.referredByUserId) return false;
  if (client.referredFriendRewardUnlockedAt) return false;
  if (!hasReferralQualifiedVisit(db, client.id)) return false;
  client.referredFriendRewardUnlockedAt = new Date().toISOString();
  return true;
}

export function recomputeAllReferrals(db: Database): {
  referrersUpdated: number;
  newlyUnlocked: string[];
  inviteesRewarded: number;
} {
  const referrerIds = new Set<string>();
  for (const u of db.users) {
    if (u.role === "client" && u.referredByUserId) referrerIds.add(u.referredByUserId);
  }
  for (const u of db.users) {
    if (u.role === "client" && (u.referralCode || (u.referralQualifiedCount ?? 0) > 0)) {
      referrerIds.add(u.id);
    }
  }

  const newlyUnlocked: string[] = [];
  for (const id of referrerIds) {
    const before = db.users.find((u) => u.id === id)?.referralRewardUnlockedAt;
    const result = recomputeReferrerFromDb(db, id);
    if (result?.justUnlocked && !before) newlyUnlocked.push(id);
  }

  let inviteesRewarded = 0;
  for (const u of db.users) {
    if (u.role !== "client" || !u.referredByUserId) continue;
    if (unlockInviteeRewardIfEligible(db, u)) inviteesRewarded++;
  }

  return { referrersUpdated: referrerIds.size, newlyUnlocked, inviteesRewarded };
}

export function exportReferralsCsv(db: Database): string {
  const header =
    "referrer_name,referrer_phone,referrer_code,qualified_count,required,discount_available,referred_name,referred_phone,referred_at,status,qualifying_wo";
  const lines: string[] = [header];
  for (const s of listAllReferrers(db)) {
    if (!s.referred.length) {
      lines.push(
        [
          `"${s.name.replace(/"/g, '""')}"`,
          s.phone,
          s.code,
          s.qualifiedCount,
          s.required,
          s.discountAvailable ? "yes" : "no",
          "",
          "",
          "",
          "",
          "",
        ].join(",")
      );
      continue;
    }
    for (const r of s.referred) {
      lines.push(
        [
          `"${s.name.replace(/"/g, '""')}"`,
          s.phone,
          s.code,
          s.qualifiedCount,
          s.required,
          s.discountAvailable ? "yes" : "no",
          `"${r.name.replace(/"/g, '""')}"`,
          r.phone,
          r.referredAt?.slice(0, 10) ?? "",
          r.status,
          r.qualifyingOrderNumber ?? "",
        ].join(",")
      );
    }
  }
  return lines.join("\n");
}

export function formatTopReferrersLines(db: Database, limit = 5): string[] {
  const top = listAllReferrers(db).slice(0, limit);
  if (!top.length) return [];
  return [
    "🏆 <b>Топ рефералов</b>",
    ...top.map(
      (r, i) =>
        `${i + 1}. ${r.name} — <b>${r.qualifiedCount}</b>/${r.required}${r.discountAvailable ? " 🎁15%" : ""}`
    ),
  ];
}

export function applyReferralToUser(
  db: Database,
  clientId: string,
  refCode: string
): { ok: boolean; reason?: string; referrerId?: string } {
  const client = db.users.find((u) => u.id === clientId && u.role === "client");
  if (!client) return { ok: false, reason: "no_client" };
  if (client.referredByUserId) return { ok: false, reason: "already_referred" };

  const referrer = db.users.find(
    (u) => u.role === "client" && (u.referralCode === refCode || u.id === refCode)
  );
  if (!referrer) return { ok: false, reason: "bad_code" };
  if (referrer.id === client.id) return { ok: false, reason: "self" };

  client.referredByUserId = referrer.id;
  client.referredAt = new Date().toISOString();
  return { ok: true, referrerId: referrer.id };
}

export function canUseReferralDiscount(user: User, db: Database): boolean {
  return buildReferrerSummary(db, user.id)?.discountAvailable ?? false;
}

export function canUseInviteeDiscount(user: User): boolean {
  return (
    Boolean(user.referredByUserId) &&
    Boolean(user.referredFriendRewardUnlockedAt) &&
    !user.referredFriendDiscountUsedAt
  );
}

export function applyReferralDiscountToOrder(order: WorkOrder): WorkOrder {
  const note = `[Referral -${REFERRAL_REWARD_DISCOUNT_PERCENT}%]`;
  return {
    ...order,
    orderDiscount: REFERRAL_REWARD_DISCOUNT_PERCENT,
    referralDiscountApplied: true,
    internalNotes: order.internalNotes?.includes(note)
      ? order.internalNotes
      : order.internalNotes
        ? `${order.internalNotes}\n${note}`
        : note,
  };
}

export function applyInviteeDiscountToOrder(order: WorkOrder): WorkOrder {
  const note = `[Invitee -${REFERRAL_INVITEE_DISCOUNT_PERCENT}%]`;
  return {
    ...order,
    orderDiscount: REFERRAL_INVITEE_DISCOUNT_PERCENT,
    referralInviteeDiscountApplied: true,
    internalNotes: order.internalNotes?.includes(note)
      ? order.internalNotes
      : order.internalNotes
        ? `${order.internalNotes}\n${note}`
        : note,
  };
}

export function markReferralDiscountUsed(
  db: Database,
  userId: string,
  order: WorkOrder
): void {
  if (!order.referralDiscountApplied) return;
  const user = db.users.find((u) => u.id === userId && u.role === "client");
  if (!user || user.referralDiscountUsedAt) return;
  user.referralDiscountUsedAt = new Date().toISOString();
  user.referralDiscountUsedOnOrderId = order.id;
}

export function markInviteeDiscountUsed(
  db: Database,
  userId: string,
  order: WorkOrder
): void {
  if (!order.referralInviteeDiscountApplied) return;
  const user = db.users.find((u) => u.id === userId && u.role === "client");
  if (!user || user.referredFriendDiscountUsedAt) return;
  user.referredFriendDiscountUsedAt = new Date().toISOString();
}

export function listAllReferrers(db: Database): ReferrerSummary[] {
  const referrerIds = new Set<string>();
  for (const u of db.users) {
    if (u.role === "client" && u.referredByUserId) referrerIds.add(u.referredByUserId);
  }
  for (const u of db.users) {
    if (u.role === "client" && (u.referralCode || u.referralQualifiedCount)) {
      referrerIds.add(u.id);
    }
  }
  return [...referrerIds]
    .map((id) => buildReferrerSummary(db, id))
    .filter((s): s is ReferrerSummary => !!s)
    .sort((a, b) => b.qualifiedCount - a.qualifiedCount);
}
