/**
 * Public tyre tariffs. Numbers come only from `price-list.ts`.
 * basePrice is the current promo; listPrice is the regular price shown crossed out.
 */
import { getPriceItem, type PriceListItem } from "@/lib/price-list";

function requireItem(id: string): PriceListItem {
  const item = getPriceItem(id);
  if (!item) throw new Error(`missing tyre price: ${id}`);
  return item;
}

function promoPair(id: string): { nowZl: number; wasZl: number } {
  const item = requireItem(id);
  if (item.listPrice == null) throw new Error(`missing regular tyre price: ${id}`);
  return { nowZl: item.basePrice, wasZl: item.listPrice };
}

const r13 = promoPair("tire_change_r13");
const r14 = promoPair("tire_change_r14");
const r15 = promoPair("tire_change_r15");
if (r13.nowZl !== r14.nowZl || r13.nowZl !== r15.nowZl || r13.wasZl !== r14.wasZl || r13.wasZl !== r15.wasZl) {
  throw new Error("R13–R15 tyre prices diverged in the price list");
}

export const TIRE_PROMO_LADDER = [
  { label: "R13–R15", ...r13 },
  { label: "R16", ...promoPair("tire_change_r16") },
  { label: "R17", ...promoPair("tire_change_r17") },
  { label: "R18", ...promoPair("tire_change_r18") },
  { label: "R19", ...promoPair("tire_change_r19") },
  { label: "R20", ...promoPair("tire_change_r20") },
  { label: "R21", ...promoPair("tire_change_r21") },
  { label: "R22", ...promoPair("tire_change_r22") },
  { label: "R23", ...promoPair("tire_change_r23") },
] as const;

export const TIRE_PROMO_FROM_ZL = TIRE_PROMO_LADDER[0].nowZl;

/** Short ladder for home / banners (most common sizes) */
export const TIRE_PROMO_LADDER_HOME = TIRE_PROMO_LADDER.slice(0, 6);

const runFlat = requireItem("runflat_surcharge");
const disposal = requireItem("tire_disposal");
const tpms = requireItem("tpms_sensor_service");
const valve = requireItem("valve_replace");
const puncture = requireItem("puncture_repair");
const storageLoose = requireItem("tire_storage");
const storageRims = requireItem("tire_storage_rims");
const rotateSmall = requireItem("wheel_rotate_13_17");

export const TIRE_PROMO_EXTRAS = {
  runFlatPerWheelZl: runFlat.basePrice,
  disposalPerWheelZl: disposal.basePrice,
  tpmsPerWheelZl: tpms.basePrice,
  valveReplaceZl: valve.basePrice,
  punctureRepairZl: puncture.basePrice,
  /** Wheel rotation of an already assembled set, R13–R17. Not a balancing price. */
  rotateAssembledFromZl: rotateSmall.basePrice,
  balanceAssembledFromZl: rotateSmall.basePrice,
  storageLooseSeasonZl: storageLoose.basePrice,
  storageRimsSeasonZl: storageRims.basePrice,
} as const;

/** One-line PL summary for meta / SEO */
export const TIRE_PROMO_SUMMARY_PL = TIRE_PROMO_LADDER.map((row) => `${row.label} ${row.nowZl} zł`).join(", ");

export const TIRE_PROMO_SUMMARY_SHORT_PL =
  `od ${TIRE_PROMO_FROM_ZL} zł (R13–R15), R16 ${TIRE_PROMO_LADDER[1].nowZl}, R17 ${TIRE_PROMO_LADDER[2].nowZl}, R18 ${TIRE_PROMO_LADDER[3].nowZl}, R19 ${TIRE_PROMO_LADDER[4].nowZl}, R20 ${TIRE_PROMO_LADDER[5].nowZl}`;

export const TIRE_PROMO_NOTE_PL =
  `Cena promocyjna kompletu 4 kół z wyważaniem: ${TIRE_PROMO_SUMMARY_SHORT_PL}. Przekreślona kwota w cenniku to cena regularna. R21–R23 są w tej samej tabeli. R24 nie jest w ofercie publicznej. RunFlat +${TIRE_PROMO_EXTRAS.runFlatPerWheelZl} zł/koło. Przechowywanie opon bez felg ${TIRE_PROMO_EXTRAS.storageLooseSeasonZl} zł/sezon, kół na felgach ${TIRE_PROMO_EXTRAS.storageRimsSeasonZl} zł/sezon. Pełny cennik: /cennik#price-cat-tires.`;
