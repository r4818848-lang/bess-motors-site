export const CASE_STATUSES = ["draft", "review", "approved", "published", "archived"] as const;
export type WorkCaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_SERVICES = [
  { id: "tires", href: "/wulkanizacja-warszawa", labelPl: "Wulkanizacja" },
  { id: "mechanic", href: "/mechanik-warszawa-wlochy", labelPl: "Mechanik" },
  { id: "oil", href: "/wymiana-oleju-warszawa", labelPl: "Wymiana oleju" },
  { id: "diagnostics", href: "/diagnostyka-komputerowa-warszawa", labelPl: "Diagnostyka" },
  { id: "brakes", href: "/hamulce-warszawa", labelPl: "Hamulce" },
  { id: "suspension", href: "/zawieszenie", labelPl: "Zawieszenie" },
  { id: "ac", href: "/serwis-klimatyzacji-warszawa", labelPl: "Klimatyzacja" },
  { id: "timing", href: "/wymiana-rozrzadu-warszawa", labelPl: "Rozrząd" },
  { id: "engine", href: "/silnik", labelPl: "Naprawa silnika" },
  { id: "gearbox", href: "/serwis-skrzyni-automatycznej-warszawa", labelPl: "Skrzynia biegów" },
] as const;

export type CaseServiceId = (typeof CASE_SERVICES)[number]["id"];

export type WorkCaseHistory = {
  at: string;
  action: "create" | "edit" | "transition";
  from: WorkCaseStatus | null;
  to: WorkCaseStatus;
};

export type WorkCase = {
  id: string;
  status: WorkCaseStatus;
  make: string;
  model: string;
  generation: string;
  year: string;
  engine: string;
  problemPl: string;
  diagnosisPl: string;
  workPl: string;
  notesPl: string;
  serviceId: CaseServiceId;
  photoIds: string[];
  /** Owner confirmed this frame hides plates, faces and other identifiers. A text scan does not. */
  reviewedPhotoIds: string[];
  version: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  history: WorkCaseHistory[];
};

const TRANSITIONS: Record<WorkCaseStatus, WorkCaseStatus[]> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["published", "draft"],
  published: ["archived"],
  archived: ["draft"],
};

export function canTransition(from: WorkCaseStatus, to: WorkCaseStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function findPersonalData(text: string): string | null {
  if (/@/.test(text)) return "email";
  if (/(?:\+?\d[\d\s()-]{7,}\d)/.test(text)) return "phone";
  if (/\b[A-HJ-NPR-Z0-9]{17}\b/i.test(text)) return "vin";
  if (/\b[A-Z]{2,3}\s?[0-9][A-Z0-9]{3,5}\b/.test(text)) return "plate";
  return null;
}

export function caseText(story: Pick<WorkCase, "make" | "model" | "generation" | "year" | "engine" | "problemPl" | "diagnosisPl" | "workPl" | "notesPl">): string {
  return [story.make, story.model, story.generation, story.year, story.engine, story.problemPl, story.diagnosisPl, story.workPl, story.notesPl].join("\n");
}

export function serviceHref(serviceId: string): string | null {
  return CASE_SERVICES.find((service) => service.id === serviceId)?.href ?? null;
}

export function caseTitle(story: Pick<WorkCase, "make" | "model" | "workPl">): string {
  const work = story.workPl.trim().replace(/\s+/g, " ");
  const short = work.length > 80 ? `${work.slice(0, 77)}…` : work;
  return `${story.make.trim()} ${story.model.trim()}: ${short}`.trim();
}

export function publishBlockers(story: WorkCase): string[] {
  const blockers: string[] = [];
  if (story.status !== "approved" && story.status !== "published") blockers.push("not_approved");
  if (!story.make.trim() || !story.model.trim()) blockers.push("missing_vehicle");
  if (!story.problemPl.trim() || !story.diagnosisPl.trim() || !story.workPl.trim()) blockers.push("missing_work");
  if (story.photoIds.length === 0) blockers.push("missing_photo");
  if (story.photoIds.some((id) => !story.reviewedPhotoIds.includes(id))) blockers.push("photo_not_reviewed");
  if (!serviceHref(story.serviceId)) blockers.push("unknown_service");
  const personal = findPersonalData(caseText(story));
  if (personal) blockers.push(personal);
  if (story.year.trim() && !/^\d{4}$/.test(story.year.trim())) blockers.push("unconfirmed_year");
  return blockers;
}

export function isPublicCase(story: WorkCase): boolean {
  return story.status === "published" && publishBlockers({ ...story, status: "approved" }).length === 0;
}
