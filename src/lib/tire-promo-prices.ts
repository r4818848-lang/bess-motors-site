/**
 * Seasonal tyre-change promo (komplet 4 kół + wyważanie).
 * Matches owner flyer: crossed-out → promo zł.
 */
export const TIRE_PROMO_LADDER = [
  { label: "R13–R15", nowZl: 140, wasZl: 160 },
  { label: "R16", nowZl: 170, wasZl: 200 },
  { label: "R17", nowZl: 190, wasZl: 220 },
  { label: "R18", nowZl: 220, wasZl: 250 },
  { label: "R19", nowZl: 280, wasZl: 350 },
  { label: "R20", nowZl: 350, wasZl: 400 },
  { label: "R21", nowZl: 390, wasZl: 450 },
  { label: "R22", nowZl: 400, wasZl: 500 },
  { label: "R23", nowZl: 450, wasZl: 550 },
] as const;

export const TIRE_PROMO_FROM_ZL = TIRE_PROMO_LADDER[0].nowZl;

/** Short ladder for home / banners (most common sizes) */
export const TIRE_PROMO_LADDER_HOME = TIRE_PROMO_LADDER.slice(0, 6);

export const TIRE_PROMO_EXTRAS = {
  runFlatPerWheelZl: 25,
  disposalPerWheelZl: 15,
  tpmsPerWheelZl: 25,
  valveReplaceZl: 20,
  balanceAssembledFromZl: 100,
} as const;

/** One-line PL summary for meta / SEO */
export const TIRE_PROMO_SUMMARY_PL =
  `R13–R15 ${TIRE_PROMO_LADDER[0].nowZl} zł, R16 ${TIRE_PROMO_LADDER[1].nowZl}, R17 ${TIRE_PROMO_LADDER[2].nowZl}, R18 ${TIRE_PROMO_LADDER[3].nowZl}, R19 ${TIRE_PROMO_LADDER[4].nowZl}, R20 ${TIRE_PROMO_LADDER[5].nowZl}, R21 ${TIRE_PROMO_LADDER[6].nowZl}, R22 ${TIRE_PROMO_LADDER[7].nowZl}, R23 ${TIRE_PROMO_LADDER[8].nowZl}`;

export const TIRE_PROMO_SUMMARY_SHORT_PL =
  `od ${TIRE_PROMO_FROM_ZL} zł (R13–R15), R16 ${TIRE_PROMO_LADDER[1].nowZl}, R17 ${TIRE_PROMO_LADDER[2].nowZl}, R18 ${TIRE_PROMO_LADDER[3].nowZl}, R19 ${TIRE_PROMO_LADDER[4].nowZl}, R20 ${TIRE_PROMO_LADDER[5].nowZl}`;
