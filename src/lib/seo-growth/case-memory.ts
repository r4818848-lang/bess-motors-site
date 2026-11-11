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
import type { SafeImage } from "@/lib/seo-growth/image-safety";

export type SeoAction = {
  at: string;
  actor: "admin";
  action: string;
  caseId: string | null;
  note: string;
};

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

export type StoreFailure = { ok: false; error: string };
export type StoreSuccess<T> = { ok: true; value: T; replayed?: boolean };

type PhotoRecord = { caseId: string; mime: SafeImage["mime"]; bytes: Buffer; reviewed: boolean };

export type CaseSnapshot = {
  cases: WorkCase[];
  photos: { id: string; caseId: string; mime: SafeImage["mime"]; bytes: string; reviewed: boolean }[];
  actions: SeoAction[];
  idempotency: { key: string; response: unknown }[];
};

const MAX_PHOTOS = 8;

function clean(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 2000);
}

function storyOf(row: WorkCase): WorkCase {
  return {
    ...row,
    photoIds: [...row.photoIds],
    reviewedPhotoIds: [...row.reviewedPhotoIds],
    history: row.history.map((entry) => ({ ...entry })),
  };
}

export type CaseRepository = {
  kind: "memory" | "supabase" | "unconfigured";
  snapshot(): CaseSnapshot;
  listCases(): Promise<StoreSuccess<WorkCase[]> | StoreFailure>;
  listPublished(): Promise<StoreSuccess<WorkCase[]> | StoreFailure>;
  getCase(id: string): Promise<StoreSuccess<WorkCase> | StoreFailure>;
  listActions(): Promise<StoreSuccess<SeoAction[]> | StoreFailure>;
  createCase(input: CaseInput, idempotencyKey: string | null): Promise<StoreSuccess<WorkCase> | StoreFailure>;
  updateCase(id: string, version: number, input: Partial<CaseInput>): Promise<StoreSuccess<WorkCase> | StoreFailure>;
  transitionCase(id: string, version: number, to: WorkCaseStatus): Promise<StoreSuccess<WorkCase> | StoreFailure>;
  attachPhoto(caseId: string, version: number, image: SafeImage, idempotencyKey: string | null): Promise<StoreSuccess<{ photoId: string; story: WorkCase }> | StoreFailure>;
  reviewPhoto(caseId: string, photoId: string, version: number): Promise<StoreSuccess<WorkCase> | StoreFailure>;
  publicPhoto(caseId: string, photoId: string): Promise<StoreSuccess<{ mime: string; bytes: Buffer }> | StoreFailure>;
  record(action: string, note: string, caseId: string | null): Promise<StoreSuccess<SeoAction> | StoreFailure>;
  failNext(error?: string): void;
};

export function createMemoryCaseStore(initial?: CaseSnapshot): CaseRepository {
  const cases = new Map<string, WorkCase>();
  const photos = new Map<string, PhotoRecord>();
  const actions: SeoAction[] = [];
  const idempotency = new Map<string, unknown>();
  let chain: Promise<void> = Promise.resolve();
  let forced: string | null = null;

  if (initial) {
    for (const story of initial.cases) cases.set(story.id, storyOf(story));
    for (const photo of initial.photos) {
      photos.set(photo.id, { caseId: photo.caseId, mime: photo.mime, bytes: Buffer.from(photo.bytes, "base64"), reviewed: photo.reviewed });
    }
    actions.push(...initial.actions.map((entry) => ({ ...entry })));
    for (const row of initial.idempotency) idempotency.set(row.key, row.response);
  }

  function log(action: string, caseId: string | null, note: string): SeoAction {
    const entry = { at: new Date().toISOString(), actor: "admin" as const, action, caseId, note: note.slice(0, 300) };
    actions.push(entry);
    return entry;
  }

  function locked<T>(fn: () => T): Promise<T> {
    const run = chain.then(() => {
      if (forced) {
        const error = forced;
        forced = null;
        return Promise.reject(Object.assign(new Error(error), { storeError: error }));
      }
      return fn();
    });
    chain = run.then(
      () => undefined,
      () => undefined
    );
    return run.catch((error: { storeError?: string }) => {
      throw error;
    }) as Promise<T>;
  }

  async function guard<T>(fn: () => T): Promise<StoreSuccess<T> | StoreFailure> {
    try {
      return { ok: true, value: await locked(fn) };
    } catch (error) {
      const storeError = error && typeof error === "object" && "storeError" in error ? String(error.storeError) : "";
      if (storeError) return { ok: false, error: storeError };
      throw error;
    }
  }

  return {
    kind: "memory",
    snapshot() {
      return {
        cases: [...cases.values()].map(storyOf),
        photos: [...photos.entries()].map(([id, photo]) => ({
          id,
          caseId: photo.caseId,
          mime: photo.mime,
          bytes: photo.bytes.toString("base64"),
          reviewed: photo.reviewed,
        })),
        actions: actions.map((entry) => ({ ...entry })),
        idempotency: [...idempotency.entries()].map(([key, response]) => ({ key, response })),
      };
    },
    failNext(error = "STORAGE_UNAVAILABLE") {
      forced = error;
    },
    listCases: () => guard(() => [...cases.values()].map(storyOf)),
    listPublished: () => guard(() => [...cases.values()].filter(isPublicCase).map(storyOf)),
    getCase: (id) =>
      guard(() => {
        const story = cases.get(id);
        if (!story) throw Object.assign(new Error("not_found"), { storeError: "not_found" });
        return storyOf(story);
      }),
    listActions: () => guard(() => actions.map((entry) => ({ ...entry }))),
    async createCase(input, idempotencyKey) {
      const result = await guard(() => {
        if (idempotencyKey && idempotency.has(idempotencyKey)) {
          return { replayed: true, story: idempotency.get(idempotencyKey) as WorkCase };
        }
        const now = new Date().toISOString();
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
          reviewedPhotoIds: [],
          version: 1,
          publishedAt: null,
          createdAt: now,
          updatedAt: now,
          history: [{ at: now, action: "create", from: null, to: "draft" }],
        };
        const personal = findPersonalData(caseText(story));
        if (personal) throw Object.assign(new Error(personal), { storeError: personal });
        cases.set(story.id, story);
        log("create_case", story.id, "draft");
        const saved = storyOf(story);
        if (idempotencyKey) idempotency.set(idempotencyKey, saved);
        return { replayed: false, story: saved };
      });
      if (!result.ok) return result;
      return { ok: true, value: result.value.story, replayed: result.value.replayed };
    },
    updateCase: (id, version, input) =>
      guard(() => {
        const story = cases.get(id);
        if (!story) throw Object.assign(new Error("not_found"), { storeError: "not_found" });
        if (story.version !== version) throw Object.assign(new Error("conflict"), { storeError: "conflict" });
        if (story.status === "archived") throw Object.assign(new Error("archived"), { storeError: "archived" });
        const next = storyOf(story);
        for (const key of ["make", "model", "generation", "year", "engine", "problemPl", "diagnosisPl", "workPl", "notesPl"] as const) {
          if (input[key] !== undefined) next[key] = clean(input[key]);
        }
        if (input.serviceId) next.serviceId = input.serviceId;
        const personal = findPersonalData(caseText(next));
        if (personal) throw Object.assign(new Error(personal), { storeError: personal });
        if (next.status === "published" && publishBlockers({ ...next, status: "approved" }).length > 0) {
          throw Object.assign(new Error("would_unpublish"), { storeError: "would_unpublish" });
        }
        next.version += 1;
        next.updatedAt = new Date().toISOString();
        next.history.push({ at: next.updatedAt, action: "edit", from: story.status, to: story.status });
        cases.set(id, next);
        log("edit_case", id, story.status);
        return storyOf(next);
      }),
    transitionCase: (id, version, to) =>
      guard(() => {
        const story = cases.get(id);
        if (!story) throw Object.assign(new Error("not_found"), { storeError: "not_found" });
        if (story.version !== version) throw Object.assign(new Error("conflict"), { storeError: "conflict" });
        if (!canTransition(story.status, to)) throw Object.assign(new Error("forbidden_transition"), { storeError: "forbidden_transition" });
        if (to === "published") {
          const blockers = publishBlockers(story);
          if (blockers.length > 0) throw Object.assign(new Error(blockers.join(",")), { storeError: blockers.join(",") });
        }
        const next = storyOf(story);
        if (to === "published") next.publishedAt = new Date().toISOString();
        const from = next.status;
        next.status = to;
        next.version += 1;
        next.updatedAt = new Date().toISOString();
        next.history.push({ at: next.updatedAt, action: "transition", from, to });
        cases.set(id, next);
        log("transition_case", id, `${from}->${to}`);
        return storyOf(next);
      }),
    async attachPhoto(caseId, version, image, idempotencyKey) {
      const result = await guard(() => {
        if (idempotencyKey && idempotency.has(idempotencyKey)) {
          return { replayed: true, body: idempotency.get(idempotencyKey) as { photoId: string; story: WorkCase } };
        }
        const story = cases.get(caseId);
        if (!story) throw Object.assign(new Error("not_found"), { storeError: "not_found" });
        if (story.version !== version) throw Object.assign(new Error("conflict"), { storeError: "conflict" });
        if (story.status === "archived") throw Object.assign(new Error("archived"), { storeError: "archived" });
        if (story.photoIds.length >= MAX_PHOTOS) throw Object.assign(new Error("too_many_photos"), { storeError: "too_many_photos" });
        const photoId = randomUUID();
        photos.set(photoId, { caseId, mime: image.mime, bytes: Buffer.from(image.bytes), reviewed: false });
        const next = storyOf(story);
        next.photoIds.push(photoId);
        next.version += 1;
        next.updatedAt = new Date().toISOString();
        next.history.push({ at: next.updatedAt, action: "edit", from: story.status, to: story.status });
        cases.set(caseId, next);
        log("attach_photo", caseId, image.mime);
        const body = { photoId, story: storyOf(next) };
        if (idempotencyKey) idempotency.set(idempotencyKey, body);
        return { replayed: false, body };
      });
      if (!result.ok) return result;
      return { ok: true, value: result.value.body, replayed: result.value.replayed };
    },
    reviewPhoto: (caseId, photoId, version) =>
      guard(() => {
        const story = cases.get(caseId);
        const photo = photos.get(photoId);
        if (!story || !photo || photo.caseId !== caseId) throw Object.assign(new Error("not_found"), { storeError: "not_found" });
        if (story.version !== version) throw Object.assign(new Error("conflict"), { storeError: "conflict" });
        photo.reviewed = true;
        const next = storyOf(story);
        if (!next.reviewedPhotoIds.includes(photoId)) next.reviewedPhotoIds.push(photoId);
        next.version += 1;
        next.updatedAt = new Date().toISOString();
        next.history.push({ at: next.updatedAt, action: "edit", from: story.status, to: story.status });
        cases.set(caseId, next);
        log("review_photo", caseId, "owner_confirmed_no_plate_face_or_vin");
        return storyOf(next);
      }),
    publicPhoto: (caseId, photoId) =>
      guard(() => {
        const story = cases.get(caseId);
        const photo = photos.get(photoId);
        if (!story || !isPublicCase(story) || !photo || photo.caseId !== caseId || !photo.reviewed || !story.photoIds.includes(photoId)) {
          throw Object.assign(new Error("not_found"), { storeError: "not_found" });
        }
        return { mime: photo.mime, bytes: Buffer.from(photo.bytes) };
      }),
    record: (action, note, caseId) => guard(() => log(action, caseId, note)),
  };
}

export function unconfiguredCaseStore(): CaseRepository {
  const fail = async (): Promise<StoreFailure> => ({ ok: false, error: "STORAGE_NOT_CONFIGURED" });
  return {
    kind: "unconfigured",
    snapshot: () => ({ cases: [], photos: [], actions: [], idempotency: [] }),
    listCases: fail,
    listPublished: fail,
    getCase: async () => fail(),
    listActions: fail,
    createCase: async () => fail(),
    updateCase: async () => fail(),
    transitionCase: async () => fail(),
    attachPhoto: async () => fail(),
    reviewPhoto: async () => fail(),
    publicPhoto: async () => fail(),
    record: async () => fail(),
    failNext() {},
  };
}
