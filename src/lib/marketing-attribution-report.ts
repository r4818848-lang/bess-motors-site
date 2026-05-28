import type { Appointment, CallRequest, Database, WorkOrder } from "@/lib/store";

export type AttributionRow = {
  source: string;
  calls: number;
  appointments: number;
  orders: number;
  revenue: number;
};

function sourceLabel(
  row:
    | { marketing?: { utmSource?: string; utmMedium?: string }; source?: string; orderSource?: string }
    | undefined
): string {
  if (!row) return "—";
  const m = row.marketing;
  if (m?.utmSource) return [m.utmSource, m.utmMedium].filter(Boolean).join(" / ");
  if ("source" in row && row.source) return row.source;
  if ("orderSource" in row && row.orderSource) return row.orderSource;
  return "direct";
}

export function buildAttributionReport(db: Database): AttributionRow[] {
  const map = new Map<string, AttributionRow>();

  const bump = (src: string, patch: Partial<AttributionRow>) => {
    const cur = map.get(src) ?? { source: src, calls: 0, appointments: 0, orders: 0, revenue: 0 };
    map.set(src, { ...cur, ...patch });
  };

  for (const c of db.callRequests) {
    const s = sourceLabel(c);
    bump(s, { calls: (map.get(s)?.calls ?? 0) + 1 });
  }
  for (const a of db.appointments) {
    const s = sourceLabel(a);
    bump(s, { appointments: (map.get(s)?.appointments ?? 0) + 1 });
  }
  for (const o of db.workOrders) {
    const s = "work_order";
    const rev =
      o.services.reduce((sum, l) => sum + l.price * l.qty * (1 - l.discount / 100), 0) +
      o.parts.reduce((sum, p) => sum + p.sellPrice * p.qty * (1 - p.discount / 100), 0);
    bump(s, {
      orders: (map.get(s)?.orders ?? 0) + 1,
      revenue: (map.get(s)?.revenue ?? 0) + rev,
    });
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export type ReferralStat = {
  userId: string;
  name: string;
  code: string;
  referredCount: number;
  referredWithOrders: number;
};

export function buildReferralStats(db: Database): ReferralStat[] {
  const clients = db.users.filter((u) => u.role === "client");
  return clients
    .map((u) => {
      const referred = clients.filter((c) => c.referredByUserId === u.id);
      const withOrders = referred.filter((c) =>
        db.workOrders.some((o) => o.userId === c.id)
      ).length;
      return {
        userId: u.id,
        name: u.name,
        code: u.referralCode ?? u.id.slice(0, 8),
        referredCount: referred.length,
        referredWithOrders: withOrders,
      };
    })
    .filter((r) => r.referredCount > 0 || r.code)
    .sort((a, b) => b.referredCount - a.referredCount);
}

export function exportClientsCsv(db: Database): string {
  const header = "name,phone,email,telegram,orders,createdAt,referredBy";
  const lines = db.users
    .filter((u) => u.role === "client")
    .map((u) => {
      const orders = db.workOrders.filter((o) => o.userId === u.id).length;
      const ref = u.referredByUserId
        ? db.users.find((x) => x.id === u.referredByUserId)?.name ?? u.referredByUserId
        : "";
      return [
        `"${u.name.replace(/"/g, '""')}"`,
        u.phone,
        u.email ?? "",
        u.telegramUsername ? `@${u.telegramUsername}` : u.telegramChatId ? "yes" : "",
        orders,
        u.createdAt,
        `"${ref.replace(/"/g, '""')}"`,
      ].join(",");
    });
  return [header, ...lines].join("\n");
}

export type FunnelStats = {
  calls: number;
  appointments: number;
  workOrders: number;
  conversionCallToApt: number;
  conversionAptToOrder: number;
};

export function buildFunnelStats(db: Database): FunnelStats {
  const calls = db.callRequests.length;
  const appointments = db.appointments.filter((a) => a.appointmentStatus !== "cancelled").length;
  const workOrders = db.workOrders.length;
  return {
    calls,
    appointments,
    workOrders,
    conversionCallToApt: calls ? Math.round((appointments / calls) * 100) : 0,
    conversionAptToOrder: appointments ? Math.round((workOrders / appointments) * 100) : 0,
  };
}
