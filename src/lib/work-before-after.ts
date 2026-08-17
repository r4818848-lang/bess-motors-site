import type { ServiceId } from "@/lib/services-catalog";

export type LocalizedLine = { pl: string; ru: string; en: string };

export type WorkBeforeAfterCase = {
  id: string;
  serviceIds: ServiceId[];
  slugs: string[];
  make?: string;
  job: LocalizedLine;
  /** Labour shown on caption (PLN) */
  laborPriceZl?: number;
  laborFrom?: boolean;
  laborUnit?: LocalizedLine;
  before: string[];
  after: string[];
  /** Photos of the job in progress (no before/after split), e.g. A/C recharge */
  workPhotos?: string[];
};

const brakes = "/images/works/before-after/brakes-discs-pads";
const audi = "/images/works/before-after/audi-a6-suspension";
const ac = "/images/works/before-after/ac-recharge";

function seq(dir: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${dir}/${String(i + 1).padStart(2, "0")}.jpg`);
}

/** Static workshop cases — real photos, before left / after right */
export const WORK_BEFORE_AFTER_CASES: WorkBeforeAfterCase[] = [
  {
    id: "brakes-discs-pads",
    serviceIds: ["brakePads", "brakesFull"],
    slugs: ["hamulce", "klocki-hamulcowe"],
    job: {
      pl: "Wymiana tarcz i klocków hamulcowych",
      ru: "Замена тормозных дисков и колодок",
      en: "Brake discs and pads replacement",
    },
    laborPriceZl: 150,
    laborFrom: true,
    before: seq(`${brakes}/before`, 9),
    after: seq(`${brakes}/after`, 6),
  },
  {
    id: "audi-a6-suspension",
    serviceIds: ["suspension"],
    slugs: ["zawieszenie", "serwis-audi", "vag"],
    make: "Audi A6",
    job: {
      pl: "Wymiana wahaczy / naprawa zawieszenia",
      ru: "Замена рычагов / ремонт подвески",
      en: "Control arms / suspension repair",
    },
    laborPriceZl: 250,
    laborFrom: true,
    laborUnit: {
      pl: " / wahacz",
      ru: " / рычаг",
      en: " / arm",
    },
    before: seq(`${audi}/before`, 3),
    after: seq(`${audi}/after`, 2),
  },
  {
    id: "ac-recharge-ram",
    serviceIds: ["acRefill", "acRepair"],
    slugs: ["klimatyzacja", "naprawa-klimatyzacji"],
    make: "RAM",
    job: {
      pl: "Nabijanie klimatyzacji",
      ru: "Заправка кондиционера",
      en: "A/C recharge",
    },
    laborPriceZl: 130,
    laborFrom: true,
    before: [],
    after: [],
    workPhotos: seq(ac, 1),
  },
];

export function workCasesForLanding(slug: string, serviceId?: ServiceId): WorkBeforeAfterCase[] {
  return WORK_BEFORE_AFTER_CASES.filter(
    (c) => c.slugs.includes(slug) || (serviceId ? c.serviceIds.includes(serviceId) : false)
  );
}

export function formatWorkCaseCaption(
  item: WorkBeforeAfterCase,
  lang: "pl" | "ru" | "en",
  labels: { labor: string; from: string }
): string {
  const parts = [item.make, item.job[lang]].filter(Boolean);
  if (item.laborPriceZl) {
    const from = item.laborFrom ? `${labels.from} ` : "";
    const unit = item.laborUnit?.[lang] ?? "";
    parts.push(`${labels.labor} ${from}${item.laborPriceZl} zł${unit}`);
  }
  return parts.join(" · ");
}
