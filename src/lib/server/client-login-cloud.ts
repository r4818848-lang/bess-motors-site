import { verifyPassword } from "@/lib/crypto";
import { ensureClientForSign, sliceForClient } from "@/lib/client-sign";
import { normalizePhone, normalizePlateKey } from "@/lib/server/normalize-phone";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";
import { issueClientToken } from "@/lib/server/issue-client-token";
import type { ClientPortalSlice } from "@/lib/client-sign";
import type { User } from "@/lib/store";

export type CloudClientLoginResult = {
  token: string;
  portal: ClientPortalSlice;
  user: User;
};

function phoneHasWebsiteBooking(
  db: import("@/lib/store").Database,
  normalizedPhone: string
): boolean {
  return db.appointments.some(
    (a) =>
      a.source === "website" &&
      normalizePhone(a.clientPhone ?? "") === normalizedPhone
  );
}

/** Authenticate client against cloud CRM (phone + registration plate). */
export async function cloudClientCabinetLogin(
  phone: string,
  plate: string
): Promise<CloudClientLoginResult | null> {
  if (!isSupabaseConfigured()) return null;

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return null;

  const db = snap.doc;
  const normalized = normalizePhone(phone);
  const plateKey = normalizePlateKey(plate);
  if (!normalized || plateKey.length < 2) return null;

  let user = db.users.find(
    (u) => u.role === "client" && normalizePhone(u.phone) === normalized
  );

  const hasBooking = phoneHasWebsiteBooking(db, normalized);

  if (user?.passwordHash) {
    const ok = await verifyPassword(plateKey, user.passwordHash);
    if (!ok) return null;
  } else if (user) {
    const plateOnFile = db.vehicles.some(
      (v) => v.userId === user!.id && normalizePlateKey(v.plate) === plateKey
    );
    if (!hasBooking && !plateOnFile) return null;
    try {
      ({ user } = await ensureClientForSign(db, phone, plate, null));
    } catch {
      return null;
    }
  } else if (hasBooking) {
    try {
      ({ user } = await ensureClientForSign(db, phone, plate, null));
    } catch {
      return null;
    }
  } else {
    return null;
  }

  for (const apt of db.appointments) {
    if (normalizePhone(apt.clientPhone ?? "") === normalized) {
      apt.userId = user.id;
      const veh = db.vehicles.find((v) => v.id === apt.vehicleId);
      if (veh && (!veh.plate?.trim() || veh.plate === "—")) {
        veh.plate = plate.trim();
      }
    }
  }

  const put = await cloudPutCrmStore(db);
  if (!put.ok) return null;

  const portal = sliceForClient(db, user.id);
  if (!portal) return null;

  const token = await issueClientToken(user.id, user.phone);
  return { token, portal, user };
}
