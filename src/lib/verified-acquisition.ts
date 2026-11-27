import { calcClientTotal } from "./workorder-calc";
import type { Database, WorkOrder } from "./store";

export type VerifiedAcquisition = NonNullable<WorkOrder["verifiedAcquisition"]>;
export type VerifiedChannel = VerifiedAcquisition["channel"];
export type VerifiedNature = VerifiedAcquisition["nature"];
export type VerifiedEvidence = VerifiedAcquisition["evidence"];

export const ACQUISITION_CHANNELS: readonly VerifiedChannel[] = [
  "instagram_direct", "facebook_messenger", "whatsapp", "phone", "website", "meta_instant_form", "google_maps", "google_search",
];
export const ACQUISITION_NATURES: readonly VerifiedNature[] = ["meta_paid", "organic", "unknown"];
export const ACQUISITION_EVIDENCES: readonly VerifiedEvidence[] = [
  "client_confirmed", "conversation", "meta_form", "tagged_link",
];

/** Server-authorized mutation payload: no guesses based on a customer's phone or name. */
export function parseVerifiedAcquisition(
  value: unknown,
  db: Pick<Database, "leads">,
  at: string
): VerifiedAcquisition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (!ACQUISITION_CHANNELS.includes(v.channel as VerifiedChannel)) return null;
  if (!ACQUISITION_NATURES.includes(v.nature as VerifiedNature)) return null;
  if ((v.channel === "google_maps" || v.channel === "google_search") && v.nature === "meta_paid") return null;
  if (!ACQUISITION_EVIDENCES.includes(v.evidence as VerifiedEvidence)) return null;
  if (v.manuallyConfirmed !== true) return null;

  // Campaign id must be exact Meta ad account campaign id (numeric), not a guessed label.
  const campaignId = v.campaignId === undefined || v.campaignId === ""
    ? undefined : typeof v.campaignId === "string" && /^\d{12,25}$/.test(v.campaignId)
      ? v.campaignId : null;
  if (campaignId === null) return null;
  // No paid-ad claim from an unverified natural channel label.
  if (v.nature !== "meta_paid" && campaignId) return null;

  const leadId = v.leadId === undefined || v.leadId === ""
    ? undefined : typeof v.leadId === "string" && v.leadId.length <= 128
      ? v.leadId : null;
  if (leadId === null || (leadId && !db.leads.some((x) => x.id === leadId))) return null;
  // Confirmation is required even when lead id was selected in a dropdown.
  if (leadId && v.confirmLeadMatch !== true) return null;

  return {
    channel: v.channel as VerifiedChannel,
    nature: v.nature as VerifiedNature,
    evidence: v.evidence as VerifiedEvidence,
    ...(campaignId ? { campaignId } : {}),
    ...(leadId ? { leadId } : {}),
    confirmedAt: at,
    confirmedBy: "admin",
  };
}

export interface VerifiedOrderSummary {
  channel: VerifiedChannel;
  nature: VerifiedNature;
  paidOrders: number;
  paidRevenue: number;
  confirmedOrders: number;
}
export interface VerifiedCampaignSummary {
  campaignId: string;
  paidOrders: number;
  paidRevenue: number;
}
export interface VerifiedAcquisitionSummary {
  matchedPaidOrders: number;
  matchedPaidRevenue: number;
  metaPaidOrders: number;
  metaPaidRevenue: number;
  byChannel: VerifiedOrderSummary[];
  byMetaCampaign: VerifiedCampaignSummary[];
  missingCampaignPaidOrders: number;
}

/**
 * Counts distinct, explicitly operator-confirmed WORK ORDERS, once per order ID.
 * Cohort date = explicitly linked service lead creation if available,
 * otherwise order creation. No implicit matching by phone, name or VIN.
 */
export function summarizeVerifiedAcquisition(
  db: Pick<Database, "workOrders" | "leads">,
  dateFrom: string,
  dateTo: string
): VerifiedAcquisitionSummary {
  const leads = new Map(db.leads.map(x => [x.id, x]));
  const seen = new Set<string>();
  const byChannel = new Map<string, VerifiedOrderSummary>();
  const byCampaign = new Map<string, VerifiedCampaignSummary>();
  let matchedPaidOrders = 0;
  let matchedPaidRevenue = 0;
  let metaPaidOrders = 0;
  let metaPaidRevenue = 0;
  let missingCampaignPaidOrders = 0;
  for (const order of db.workOrders) {
    if (seen.has(order.id)) continue;
    seen.add(order.id);
    const a = order.verifiedAcquisition;
    if (!a || !ACQUISITION_CHANNELS.includes(a.channel) ||
        !ACQUISITION_NATURES.includes(a.nature) || a.confirmedBy !== "admin") continue;
    const linkedLead = a.leadId ? leads.get(a.leadId) : undefined;
    // If a lead was removed, do not count an orphaned manual linkage.
    if (a.leadId && !linkedLead) continue;
    const cohortDate = (linkedLead?.createdAt ?? order.createdAt).slice(0, 10);
    if (cohortDate < dateFrom || cohortDate > dateTo) continue;
    const key = a.channel + ":" + a.nature;
    const row = byChannel.get(key) ?? {
      channel: a.channel, nature: a.nature,
      confirmedOrders: 0, paidOrders: 0, paidRevenue: 0,
    };
    row.confirmedOrders++;
    if (order.paymentStatus === "paid") {
      const revenue = calcClientTotal(order);
      row.paidOrders++;
      row.paidRevenue += revenue;
      matchedPaidOrders++;
      matchedPaidRevenue += revenue;
      if (a.nature === "meta_paid") {
        metaPaidOrders++;
        metaPaidRevenue += revenue;
        if (a.campaignId && /^\d{12,25}$/.test(a.campaignId)) {
          const campaign = byCampaign.get(a.campaignId) ?? {
            campaignId: a.campaignId, paidOrders: 0, paidRevenue: 0,
          };
          campaign.paidOrders++;
          campaign.paidRevenue += revenue;
          byCampaign.set(a.campaignId, campaign);
        } else {
          missingCampaignPaidOrders++;
        }
      }
    }
    byChannel.set(key, row);
  }
  const round = (v: number) => Math.round(v * 100) / 100;
  return {
    matchedPaidOrders, matchedPaidRevenue: round(matchedPaidRevenue),
    metaPaidOrders, metaPaidRevenue: round(metaPaidRevenue),
    byChannel: [...byChannel.values()]
      .map(r => ({ ...r, paidRevenue: round(r.paidRevenue) }))
      .sort((a, b) => b.paidRevenue - a.paidRevenue),
    byMetaCampaign: [...byCampaign.values()]
      .map(r => ({ ...r, paidRevenue: round(r.paidRevenue) }))
      .sort((a, b) => b.paidRevenue - a.paidRevenue),
    missingCampaignPaidOrders,
  };
}
