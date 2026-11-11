import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  canTransition,
  caseText,
  findPersonalData,
  isPublicCase,
  publishBlockers,
  type CaseServiceId,
  type WorkCase,
  type WorkCaseStatus,
} from "@/lib/seo-growth/work-cases";
import { inspectImage, type SafeImage } from "@/lib/seo-growth/image-safety";

export type SeoAction = {
  at: string;
  actor: "admin";
  action: string;
  caseId: string | null;
  note: string;
};

type PhotoRecord = { caseId: string; mime: SafeImage["mime"]; bytes: string };

type StoreFile = {
  cases: WorkCase[];
  photos: Record<string, PhotoRecord>;
  actions: SeoAction[];
};

function emptyStore(): StoreFile {
  return { cases: [], photos: {}, actions: [] };
}

export function seoStoreDirectory(): string {
  const custom = process.env.SEO_CASE_STORE_DIR?.trim();
  return custom || path.join(process.cwd(), "data", "seo-private");
}

function storeFile(): string {
  return path.join(seoStoreDirectory(), "store.json");
}

function readStore(): StoreFile {
  try {
    const parsed = JSON.parse(readFileSync(storeFile(), "utf8")) as StoreFile;
    if (!parsed || !Array.isArray(parsed.cases) || !parsed.photos || !Array.isArray(parsed.actions)) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: StoreFile): void {
  const dir = seoStoreDirectory();
  mkdirSync(dir, { recursive: true });
  writeFileSync(storeFile(), JSON.stringify(store));
}

export type CaseInput = {
  make: string;
  model: string;
  generation?: string;
  year?: string;
  engine?: string;
  problemPl: string;
  diagnosisPl: string;
  workPl: string;
  notesPl?: string;
  serviceId: CaseServiceId;
};

function clean(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 2000);
}

export function listCases(): WorkCase[] {
  return readStore().cases;
}

export function listPublishedCases(): WorkCase[] {
  return listCases().filter(isPublicCase);
}

export function getCase(id: string): WorkCase | null {
  return listCases().find((item) => item.id === id) ?? null;
}

export function listActions(): SeoAction[] {
  return readStore().actions;
}

function log(store: StoreFile, action: string, caseId: string | null, note: string): void {
  store.actions.push({ at: new Date().toISOString(), actor: "admin", action, caseId, note });
}

export function createCase(input: CaseInput): { ok: true; story: WorkCase } | { ok: false; reason: string } {
  const story: WorkCase = {
    id: randomUUID(),
    status: "draft",
    make: clean(input.make),
    model: clean(input.model),
    generation: clean(input.generation),
    year: clean(input.year),
    engine: clean(input.engine),
    problemPl: clean(input.problemPl),
    diagnosisPl: clean(input.diagnosisPl),
    workPl: clean(input.workPl),
    notesPl: clean(input.notesPl),
    serviceId: input.serviceId,
    photoIds: [],
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [{ at: new Date().toISOString(), action: "create", from: null, to: "draft" }],
  };
  const personal = findPersonalData(caseText(story));
  if (personal) return { ok: false, reason: personal };
  const store = readStore();
  store.cases.push(story);
  log(store, "create_case", story.id, "draft");
  writeStore(store);
  return { ok: true, story };
}

export function updateCase(id: string, input: Partial<CaseInput>): { ok: true; story: WorkCase } | { ok: false; reason: string } {
  const store = readStore();
  const story = store.cases.find((item) => item.id === id);
  if (!story) return { ok: false, reason: "not_found" };
  if (story.status === "archived") return { ok: false, reason: "archived" };
  const next = { ...story };
  for (const key of ["make", "model", "generation", "year", "engine", "problemPl", "diagnosisPl", "workPl", "notesPl"] as const) {
    if (input[key] !== undefined) next[key] = clean(input[key]);
  }
  if (input.serviceId) next.serviceId = input.serviceId;
  const personal = findPersonalData(caseText(next));
  if (personal) return { ok: false, reason: personal };
  if (next.status === "published" && publishBlockers({ ...next, status: "approved" }).length > 0) {
    return { ok: false, reason: "would_unpublish" };
  }
  next.updatedAt = new Date().toISOString();
  next.history = [...story.history, { at: next.updatedAt, action: "edit", from: story.status, to: story.status }];
  Object.assign(story, next);
  log(store, "edit_case", id, story.status);
  writeStore(store);
  return { ok: true, story };
}

export function transitionCase(id: string, to: WorkCaseStatus): { ok: true; story: WorkCase } | { ok: false; reason: string } {
  const store = readStore();
  const story = store.cases.find((item) => item.id === id);
  if (!story) return { ok: false, reason: "not_found" };
  if (!canTransition(story.status, to)) return { ok: false, reason: "forbidden_transition" };
  if (to === "published") {
    const blockers = publishBlockers(story);
    if (blockers.length > 0) return { ok: false, reason: blockers.join(",") };
    story.publishedAt = new Date().toISOString();
  }
  if (to === "archived") story.publishedAt = story.publishedAt;
  const from = story.status;
  story.status = to;
  story.updatedAt = new Date().toISOString();
  story.history = [...story.history, { at: story.updatedAt, action: "transition", from, to }];
  log(store, "transition_case", id, `${from}->${to}`);
  writeStore(store);
  return { ok: true, story };
}

export function attachPhoto(caseId: string, bytes: Uint8Array): { ok: true; photoId: string } | { ok: false; reason: string } {
  const checked = inspectImage(bytes);
  if (!checked.ok) return checked;
  const store = readStore();
  const story = store.cases.find((item) => item.id === caseId);
  if (!story) return { ok: false, reason: "not_found" };
  if (story.status === "archived") return { ok: false, reason: "archived" };
  const photoId = randomUUID();
  store.photos[photoId] = {
    caseId,
    mime: checked.image.mime,
    bytes: Buffer.from(checked.image.bytes).toString("base64"),
  };
  story.photoIds = [...story.photoIds, photoId];
  story.updatedAt = new Date().toISOString();
  story.history = [...story.history, { at: story.updatedAt, action: "edit", from: story.status, to: story.status }];
  log(store, "attach_photo", caseId, checked.image.mime);
  writeStore(store);
  return { ok: true, photoId };
}

export function publicPhoto(caseId: string, photoId: string): { mime: string; bytes: Buffer } | null {
  const story = getCase(caseId);
  if (!story || !isPublicCase(story) || !story.photoIds.includes(photoId)) return null;
  const photo = readStore().photos[photoId];
  if (!photo || photo.caseId !== caseId) return null;
  return { mime: photo.mime, bytes: Buffer.from(photo.bytes, "base64") };
}

export function recordOwnerDecision(action: string, note: string, caseId: string | null = null): SeoAction {
  const store = readStore();
  const entry: SeoAction = { at: new Date().toISOString(), actor: "admin", action, caseId, note: note.slice(0, 300) };
  store.actions.push(entry);
  writeStore(store);
  return entry;
}
