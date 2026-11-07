import { searchAllSuppliers } from "@/lib/suppliers/search";
import { compareSupplierOffers } from "@/lib/suppliers/compare";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { buildAllMechanicsPayroll, getWarsawWeekRange } from "@/lib/payroll";
import {
  calcOrderBreakdown,
  calcPartsPurchaseCost,
  calcPartsProfit,
  calcServicesSubtotal,
} from "@/lib/workorder-calc";
import type { PartsSearchQuery } from "@/lib/suppliers/types";

export type AiToolName =
  | "search_parts"
  | "compare_prices"
  | "find_order"
  | "payroll_week"
  | "finance_summary"
  | "list_services"
  | "draft_client_message";

export type AiToolDef = {
  name: AiToolName;
  description: string;
  requiresConfirmation: boolean;
  parameters: Record<string, string>;
};

export const AI_TOOLS: AiToolDef[] = [
  {
    name: "search_parts",
    description: "Search connected suppliers by VIN/OEM/article/name. Returns real offers only.",
    requiresConfirmation: false,
    parameters: { article: "string?", oem: "string?", vin: "string?", name: "string?", brand: "string?" },
  },
  {
    name: "compare_prices",
    description: "Compare the same part across suppliers with explanation.",
    requiresConfirmation: false,
    parameters: { article: "string?", oem: "string?", name: "string?", brand: "string?" },
  },
  {
    name: "find_order",
    description: "Find work order by number (BESS/... or BM-...) and summarize lines.",
    requiresConfirmation: false,
    parameters: { orderNumber: "string" },
  },
  {
    name: "payroll_week",
    description: "Mechanic payroll for current Warsaw week (labor netto basis).",
    requiresConfirmation: false,
    parameters: {},
  },
  {
    name: "finance_summary",
    description: "Revenue / parts cost / labor / profit for recent delivered orders (last 7 days).",
    requiresConfirmation: false,
    parameters: {},
  },
  {
    name: "list_services",
    description: "List active services from price list / recent order service names.",
    requiresConfirmation: false,
    parameters: { query: "string?" },
  },
  {
    name: "draft_client_message",
    description: "Prepare a Polish client message draft — does NOT send.",
    requiresConfirmation: false,
    parameters: { orderNumber: "string?", topic: "string", language: "pl|ru|en?" },
  },
];

/** Actions that always need human confirmation before side effects */
export const AI_CONFIRM_ACTIONS = [
  "send_client_message",
  "place_supplier_order",
  "modify_approved_estimate",
  "delete_data",
  "change_finance",
  "create_refund",
] as const;

export async function runAiTool(
  name: AiToolName,
  args: Record<string, unknown>
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    switch (name) {
      case "search_parts": {
        const q: PartsSearchQuery = {
          article: str(args.article),
          oem: str(args.oem),
          vin: str(args.vin),
          name: str(args.name),
          brand: str(args.brand),
        };
        const { results, offers } = await searchAllSuppliers(q);
        return { ok: true, data: { results, offers, count: offers.length } };
      }
      case "compare_prices": {
        const q: PartsSearchQuery = {
          article: str(args.article),
          oem: str(args.oem),
          name: str(args.name),
          brand: str(args.brand),
        };
        const { offers, results } = await searchAllSuppliers(q);
        const groups = compareSupplierOffers(offers);
        return { ok: true, data: { groups, results } };
      }
      case "find_order": {
        const snap = await cloudGetCrmStore();
        if (!snap) return { ok: false, error: "cloud_unavailable" };
        const num = str(args.orderNumber)?.toUpperCase();
        if (!num) return { ok: false, error: "orderNumber_required" };
        const order = snap.doc.workOrders.find(
          (o) => o.number.toUpperCase() === num || o.number.toUpperCase().includes(num)
        );
        if (!order) return { ok: false, error: "not_found" };
        const vehicle = snap.doc.vehicles.find((v) => v.id === order.vehicleId);
        const client = snap.doc.users.find((u) => u.id === order.userId);
        const vat = snap.doc.settings.vatRate ?? 23;
        const breakdown = calcOrderBreakdown(order, vat);
        return {
          ok: true,
          data: {
            number: order.number,
            status: order.status,
            client: client?.name,
            phone: client?.phone,
            vehicle: vehicle
              ? `${vehicle.make} ${vehicle.model} ${vehicle.plate} VIN:${vehicle.vin}`
              : null,
            services: order.services.map((s) => ({
              name: s.name,
              qty: s.qty,
              priceNet: s.price,
            })),
            parts: order.parts.map((p) => ({
              name: p.name,
              article: p.partNumber || p.name,
              purchase: p.purchasePrice,
              sell: p.sellPrice,
              qty: p.qty,
            })),
            breakdown,
            // Never expose mechanic wage internals to client-facing drafts
          },
        };
      }
      case "payroll_week": {
        const snap = await cloudGetCrmStore();
        if (!snap) return { ok: false, error: "cloud_unavailable" };
        const reports = buildAllMechanicsPayroll(snap.doc);
        const week = getWarsawWeekRange();
        return { ok: true, data: { week: week.label, reports } };
      }
      case "finance_summary": {
        const snap = await cloudGetCrmStore();
        if (!snap) return { ok: false, error: "cloud_unavailable" };
        const since = Date.now() - 7 * 86400000;
        const orders = snap.doc.workOrders.filter((o) => {
          const t = Date.parse(o.completedAt || o.updatedAt || o.createdAt);
          return t >= since && o.status === "delivered";
        });
        let labor = 0;
        let partsSell = 0;
        let partsCost = 0;
        for (const o of orders) {
          labor += calcServicesSubtotal(o);
          partsSell += o.parts.reduce((s, p) => s + p.qty * p.sellPrice * (1 - p.discount / 100), 0);
          partsCost += calcPartsPurchaseCost(o);
        }
        return {
          ok: true,
          data: {
            period: "last_7_days",
            orders: orders.length,
            laborRevenueNet: round2(labor),
            partsRevenueNet: round2(partsSell),
            partsCostNet: round2(partsCost),
            partsMarginNet: round2(partsSell - partsCost),
            note: "Netto figures; VAT not mixed into profit here.",
          },
        };
      }
      case "list_services": {
        const snap = await cloudGetCrmStore();
        if (!snap) return { ok: false, error: "cloud_unavailable" };
        const q = (str(args.query) || "").toLowerCase();
        const names = new Map<string, number>();
        for (const o of snap.doc.workOrders) {
          for (const s of o.services) {
            const n = s.name.trim();
            if (!n) continue;
            if (q && !n.toLowerCase().includes(q)) continue;
            names.set(n, (names.get(n) || 0) + 1);
          }
        }
        const list = [...names.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 40)
          .map(([name, count]) => ({ name, count }));
        return { ok: true, data: { services: list } };
      }
      case "draft_client_message": {
        const lang = str(args.language) || "pl";
        const topic = str(args.topic) || "oferta";
        const orderNumber = str(args.orderNumber);
        let vehicleBit = "";
        if (orderNumber) {
          const found = await runAiTool("find_order", { orderNumber });
          if (found.ok && found.data) {
            const d = found.data as { vehicle?: string; number?: string };
            vehicleBit = d.vehicle ? ` (${d.vehicle})` : "";
          }
        }
        const drafts: Record<string, string> = {
          pl: `Dzień dobry, tu BESS MOTORS. W sprawie naprawy${vehicleBit}${orderNumber ? ` — zlecenie ${orderNumber}` : ""}: przygotowaliśmy wycenę (${topic}). Prosimy o potwierdzenie, czy możemy przystąpić do realizacji. Pozdrawiamy, BESS MOTORS, Al. Krakowska 48/52.`,
          ru: `Добрый день, это BESS MOTORS. По ремонту${vehicleBit}${orderNumber ? `, заказ ${orderNumber}` : ""}: подготовили смету (${topic}). Подтвердите, пожалуйста, можно ли приступать. С уважением, BESS MOTORS.`,
          en: `Hello, this is BESS MOTORS. Regarding the repair${vehicleBit}${orderNumber ? ` (order ${orderNumber})` : ""}: we prepared an estimate (${topic}). Please confirm if we may proceed. Best regards, BESS MOTORS.`,
        };
        return {
          ok: true,
          data: {
            draft: drafts[lang] || drafts.pl,
            sent: false,
            requiresConfirmationToSend: true,
            action: "send_client_message",
          },
        };
      }
      default:
        return { ok: false, error: "unknown_tool" };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function str(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t || undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Sanitize untrusted text from suppliers/clients before sending to the model */
export function sanitizeUntrustedContext(text: string): string {
  return text
    .replace(/```/g, "'''")
    .replace(/\bsystem\s*:/gi, "sys:")
    .replace(/\bignore\s+(all\s+)?previous\s+instructions\b/gi, "[filtered]")
    .slice(0, 8000);
}
