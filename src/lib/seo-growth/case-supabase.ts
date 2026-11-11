import { getSupabaseConfig } from "@/lib/server/supabase-config";
import type { WorkCase, WorkCaseStatus } from "@/lib/seo-growth/work-cases";
import type { CaseInput, CaseRepository, SeoAction, StoreFailure, StoreSuccess } from "@/lib/seo-growth/case-memory";
import type { SafeImage } from "@/lib/seo-growth/image-safety";

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const BUCKET = "seo-case-photos";
const PHOTO_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i;

const KNOWN_ERRORS = new Set([
  "STORAGE_NOT_CONFIGURED",
  "STORAGE_UNAVAILABLE",
  "conflict",
  "not_found",
  "forbidden",
  "forbidden_transition",
  "invalid",
  "unknown_service",
  "too_many_photos",
  "too_large",
  "not_stored",
  "missing_photo",
  "missing_vehicle",
  "missing_work",
  "photo_not_reviewed",
  "unconfirmed_year",
]);

export function isPrivateCasePhotoPath(path: string): boolean {
  return PHOTO_PATH.test(path) && !path.includes("..") && !path.includes("\\") && !path.includes("//");
}

function storyFromRow(row: { id: string; version: number; status: WorkCase["status"]; body: Omit<WorkCase, "id" | "version" | "status"> }): WorkCase {
  return { ...row.body, id: row.id, version: row.version, status: row.status };
}

function knownError(value: unknown): string {
  return typeof value === "string" && KNOWN_ERRORS.has(value) ? value : "STORAGE_UNAVAILABLE";
}

export function createSupabaseCaseRepository(options?: {
  fetchImpl?: FetchLike;
  config?: { url: string; key: string } | null;
}): CaseRepository {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const config = options?.config === undefined ? getSupabaseConfig() : options.config;

  async function call(
    op: string,
    payload: unknown,
    expectedVersion: number | null,
    idempotencyKey: string | null
  ): Promise<StoreSuccess<Record<string, unknown>> | StoreFailure> {
    if (!config) return { ok: false, error: "STORAGE_NOT_CONFIGURED" };
    let response: Response;
    try {
      response = await fetchImpl(`${config.url}/rest/v1/rpc/seo_case_apply`, {
        method: "POST",
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          op,
          payload: payload ?? {},
          expected_version: expectedVersion,
          idempotency_key: idempotencyKey,
        }),
        redirect: "manual",
      });
    } catch {
      return { ok: false, error: "STORAGE_UNAVAILABLE" };
    }
    if (response.status >= 300 && response.status < 400) return { ok: false, error: "STORAGE_UNAVAILABLE" };
    const text = await response.text();
    if (response.status === 404 || text.includes("PGRST202") || text.includes("Could not find the function")) {
      return { ok: false, error: "STORAGE_NOT_CONFIGURED" };
    }
    if (!response.ok) return { ok: false, error: "STORAGE_UNAVAILABLE" };
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { ok: false, error: "STORAGE_UNAVAILABLE" };
    }
    if (body.ok !== true) return { ok: false, error: knownError(body.error) };
    return { ok: true, value: body, replayed: body.replayed === true };
  }

  function objectUrl(path: string): string | null {
    if (!config || !isPrivateCasePhotoPath(path)) return null;
    const [caseId, file] = path.split("/");
    return `${config.url}/storage/v1/object/${BUCKET}/${caseId}/${file}`;
  }

  async function upload(path: string, bytes: Uint8Array): Promise<StoreFailure | { ok: true }> {
    const url = objectUrl(path);
    if (!config || !url) return { ok: false, error: "invalid" };
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: "POST",
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          "Content-Type": "image/jpeg",
          "x-upsert": "true",
        },
        body: Buffer.from(bytes),
        redirect: "manual",
      });
    } catch {
      return { ok: false, error: "STORAGE_UNAVAILABLE" };
    }
    if (response.status === 404) return { ok: false, error: "STORAGE_NOT_CONFIGURED" };
    if (response.status >= 300 && response.status < 400) return { ok: false, error: "STORAGE_UNAVAILABLE" };
    if (!response.ok) return { ok: false, error: "STORAGE_UNAVAILABLE" };
    return { ok: true };
  }

  async function download(path: string): Promise<StoreSuccess<Buffer> | StoreFailure> {
    const url = objectUrl(path);
    if (!config || !url) return { ok: false, error: "not_found" };
    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
        },
        redirect: "manual",
      });
    } catch {
      return { ok: false, error: "STORAGE_UNAVAILABLE" };
    }
    if (response.status === 404) return { ok: false, error: "not_found" };
    if (!response.ok || (response.status >= 300 && response.status < 400)) return { ok: false, error: "STORAGE_UNAVAILABLE" };
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1 || bytes.length > 4 * 1024 * 1024) return { ok: false, error: "STORAGE_UNAVAILABLE" };
    return { ok: true, value: bytes };
  }

  return {
    kind: "supabase",
    snapshot: () => ({ cases: [], photos: [], actions: [], idempotency: [] }),
    async listCases() {
      const result = await call("list", {}, null, null);
      if (!result.ok) return result;
      const rows = Array.isArray(result.value.cases) ? result.value.cases : null;
      if (!rows) return { ok: false, error: "STORAGE_UNAVAILABLE" };
      return { ok: true, value: rows.map((row) => storyFromRow(row as never)) };
    },
    async listPublished() {
      const result = await call("list_published", {}, null, null);
      if (!result.ok) return result;
      const rows = Array.isArray(result.value.cases) ? result.value.cases : null;
      if (!rows) return { ok: false, error: "STORAGE_UNAVAILABLE" };
      const { isPublicCase } = await import("@/lib/seo-growth/work-cases");
      return { ok: true, value: rows.map((row) => storyFromRow(row as never)).filter(isPublicCase) };
    },
    async getCase(id) {
      const listed = await this.listCases();
      if (!listed.ok) return listed;
      const story = listed.value.find((item) => item.id === id);
      return story ? { ok: true, value: story } : { ok: false, error: "not_found" };
    },
    async listActions() {
      const result = await call("actions", {}, null, null);
      if (!result.ok) return result;
      const rows = Array.isArray(result.value.actions) ? (result.value.actions as SeoAction[]) : null;
      if (!rows) return { ok: false, error: "STORAGE_UNAVAILABLE" };
      return { ok: true, value: rows };
    },
    async createCase(input: CaseInput, idempotencyKey) {
      const result = await call(
        "create",
        {
          make: input.make,
          model: input.model,
          generation: input.generation ?? "",
          year: input.year ?? "",
          engine: input.engine ?? "",
          problemPl: input.problemPl,
          diagnosisPl: input.diagnosisPl,
          workPl: input.workPl,
          notesPl: input.notesPl ?? "",
          serviceId: input.serviceId,
        },
        null,
        idempotencyKey
      );
      if (!result.ok) return result;
      return { ok: true, value: storyFromRow(result.value.story as never), replayed: result.replayed };
    },
    async updateCase(id, version, input) {
      const result = await call("update", { id, ...input }, version, null);
      if (!result.ok) return result;
      return { ok: true, value: storyFromRow(result.value.story as never) };
    },
    async transitionCase(id, version, to: WorkCaseStatus) {
      const current = await this.getCase(id);
      if (!current.ok) return current;
      const { canTransition, publishBlockers } = await import("@/lib/seo-growth/work-cases");
      if (!canTransition(current.value.status, to)) return { ok: false, error: "forbidden_transition" };
      if (to === "published") {
        const blockers = publishBlockers(current.value);
        if (blockers.length) return { ok: false, error: blockers.join(",") };
      }
      const result = await call("transition", { id, status: to }, version, null);
      if (!result.ok) return result;
      return { ok: true, value: storyFromRow(result.value.story as never) };
    },
    async attachPhoto(caseId, version, image: SafeImage, idempotencyKey) {
      const reserved = await call("attach_photo", { id: caseId, byteSize: image.bytes.byteLength }, version, idempotencyKey);
      if (!reserved.ok) return reserved;
      const path = typeof reserved.value.storagePath === "string" ? reserved.value.storagePath : "";
      const photoId = typeof reserved.value.photoId === "string" ? reserved.value.photoId : "";
      if (!isPrivateCasePhotoPath(path) || path.split("/")[0] !== caseId) return { ok: false, error: "invalid" };
      if (reserved.value.byteSize !== image.bytes.byteLength) return { ok: false, error: "invalid" };
      if (reserved.value.stored !== true) {
        const uploaded = await upload(path, image.bytes);
        if (!uploaded.ok) return uploaded;
        const confirmed = await call("confirm_photo", { id: caseId, photoId }, null, idempotencyKey);
        if (!confirmed.ok) return confirmed;
        return {
          ok: true,
          value: { photoId, story: storyFromRow(confirmed.value.story as never) },
          replayed: reserved.replayed,
        };
      }
      return {
        ok: true,
        value: { photoId, story: storyFromRow(reserved.value.story as never) },
        replayed: true,
      };
    },
    async reviewPhoto(caseId, photoId, version) {
      const result = await call("review_photo", { id: caseId, photoId }, version, null);
      if (!result.ok) return result;
      return { ok: true, value: storyFromRow(result.value.story as never) };
    },
    async publicPhoto(caseId, photoId) {
      const result = await call("public_photo", { caseId, photoId }, null, null);
      if (!result.ok) return result;
      const path = typeof result.value.storagePath === "string" ? result.value.storagePath : "";
      if (path.split("/")[0] !== caseId || path.split("/")[1] !== `${photoId}.jpg`) return { ok: false, error: "not_found" };
      const bytes = await download(path);
      if (!bytes.ok) return bytes;
      return { ok: true, value: { mime: "image/jpeg", bytes: bytes.value } };
    },
    async record(action, note, caseId) {
      const result = await call("record", { action, note, caseId }, null, null);
      if (!result.ok) return result;
      return { ok: true, value: { at: new Date().toISOString(), actor: "admin", action, caseId, note } };
    },
    failNext() {},
  };
}
