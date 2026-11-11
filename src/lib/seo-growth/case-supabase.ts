import { getSupabaseConfig } from "@/lib/server/supabase-config";
import type { WorkCase, WorkCaseStatus } from "@/lib/seo-growth/work-cases";
import type { CaseInput, CaseRepository, SeoAction, StoreFailure, StoreSuccess } from "@/lib/seo-growth/case-memory";
import type { SafeImage } from "@/lib/seo-growth/image-safety";

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

function storyFromRow(row: { id: string; version: number; status: WorkCase["status"]; body: Omit<WorkCase, "id" | "version" | "status"> }): WorkCase {
  return { ...row.body, id: row.id, version: row.version, status: row.status };
}

export function createSupabaseCaseRepository(options?: { fetchImpl?: FetchLike; config?: { url: string; key: string } | null }): CaseRepository {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const config = options?.config === undefined ? getSupabaseConfig() : options.config;

  async function call(op: string, payload: unknown, expectedVersion: number | null, idempotencyKey: string | null): Promise<StoreSuccess<Record<string, unknown>> | StoreFailure> {
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
      });
    } catch {
      return { ok: false, error: "STORAGE_UNAVAILABLE" };
    }
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
    if (body.ok !== true) return { ok: false, error: typeof body.error === "string" ? body.error : "STORAGE_UNAVAILABLE" };
    return { ok: true, value: body, replayed: body.replayed === true };
  }

  const unavailable = async (): Promise<StoreFailure> => ({ ok: false, error: "STORAGE_UNAVAILABLE" });

  return {
    kind: "supabase",
    snapshot: () => ({ cases: [], photos: [], actions: [], idempotency: [] }),
    async listCases() {
      const result = await call("list", {}, null, null);
      if (!result.ok) return result;
      const rows = Array.isArray(result.value.cases) ? result.value.cases : [];
      return { ok: true, value: rows.map((row) => storyFromRow(row as never)) };
    },
    async listPublished() {
      const listed = await this.listCases();
      if (!listed.ok) return listed;
      const { isPublicCase } = await import("@/lib/seo-growth/work-cases");
      return { ok: true, value: listed.value.filter(isPublicCase) };
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
      const rows = Array.isArray(result.value.actions) ? (result.value.actions as SeoAction[]) : [];
      return { ok: true, value: rows };
    },
    async createCase(input: CaseInput, idempotencyKey) {
      const now = new Date().toISOString();
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
          createdAt: now,
          updatedAt: now,
        },
        null,
        idempotencyKey
      );
      if (!result.ok) return result;
      return { ok: true, value: storyFromRow(result.value.story as never), replayed: result.replayed };
    },
    async updateCase(id, version, input) {
      const current = await this.getCase(id);
      if (!current.ok) return current;
      const at = new Date().toISOString();
      const next = {
        ...current.value,
        ...input,
        id: current.value.id,
        version: current.value.version,
        status: current.value.status,
        updatedAt: at,
        history: [...current.value.history, { at, action: "edit" as const, from: current.value.status, to: current.value.status }],
      };
      const { id: _id, version: _version, status, ...body } = next;
      const result = await call("update", { id, status, body }, version, null);
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
      const at = new Date().toISOString();
      const body = {
        ...current.value,
        publishedAt: to === "published" ? at : current.value.publishedAt,
        updatedAt: at,
        history: [...current.value.history, { at, action: "transition" as const, from: current.value.status, to }],
      };
      const { id: _id, version: _version, status: _status, ...rest } = body;
      const result = await call("transition", { id, status: to, body: rest }, version, null);
      if (!result.ok) return result;
      return { ok: true, value: storyFromRow(result.value.story as never) };
    },
    async attachPhoto(caseId, version, image: SafeImage, idempotencyKey) {
      const result = await call(
        "attach_photo",
        { id: caseId, bytes: Buffer.from(image.bytes).toString("base64") },
        version,
        idempotencyKey
      );
      if (!result.ok) return result;
      return {
        ok: true,
        value: { photoId: String(result.value.photoId), story: storyFromRow(result.value.story as never) },
        replayed: result.replayed,
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
      return { ok: true, value: { mime: String(result.value.mime), bytes: Buffer.from(String(result.value.bytes), "base64") } };
    },
    async record(action, note, caseId) {
      const result = await call("record", { action, note, caseId }, null, null);
      if (!result.ok) return result;
      return { ok: true, value: { at: new Date().toISOString(), actor: "admin", action, caseId, note } };
    },
    failNext() {
      void unavailable;
    },
  };
}
