import { existsSync } from "node:fs";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";
import {
  createMemoryCaseStore,
  unconfiguredCaseStore,
  type CaseInput,
  type CaseRepository,
  type SeoAction,
} from "@/lib/seo-growth/case-memory";
import { createSupabaseCaseRepository } from "@/lib/seo-growth/case-supabase";
import { prepareCaseImage } from "@/lib/seo-growth/image-safety";
import { findPersonalData, caseText, type WorkCase, type WorkCaseStatus } from "@/lib/seo-growth/work-cases";

export type { SeoAction, CaseInput };

let testRepository: CaseRepository | null = null;

/** Tests only. Production and Vercel preview keep the real repository. */
export function installCaseStoreForTests(repository: CaseRepository | null): void {
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") {
    throw new Error("seo_case_test_store_refused");
  }
  testRepository = repository;
}

export function repositoryForEnv(env: Record<string, string | undefined>): CaseRepository {
  if (testRepository && env === process.env) return testRepository;
  if (env.SEO_CASE_STORAGE !== "supabase") return unconfiguredCaseStore();
  if (!isSupabaseConfigured()) return unconfiguredCaseStore();
  return createSupabaseCaseRepository();
}

export function caseRepository(): CaseRepository {
  if (testRepository) return testRepository;
  return repositoryForEnv(process.env);
}

export function caseStorageStatus(env: Record<string, string | undefined> = process.env): "STORAGE_NOT_CONFIGURED" | "READY" {
  if (env.SEO_CASE_STORAGE === "supabase" && isSupabaseConfigured()) return "READY";
  if (testRepository) return "READY";
  return "STORAGE_NOT_CONFIGURED";
}

function personalReason(input: CaseInput): string | null {
  return findPersonalData(
    caseText({
      make: input.make ?? "",
      model: input.model ?? "",
      generation: input.generation ?? "",
      year: input.year ?? "",
      engine: input.engine ?? "",
      problemPl: input.problemPl ?? "",
      diagnosisPl: input.diagnosisPl ?? "",
      workPl: input.workPl ?? "",
      notesPl: input.notesPl ?? "",
    })
  );
}

export async function listCases(): Promise<{ ok: true; cases: WorkCase[] } | { ok: false; error: string }> {
  const result = await caseRepository().listCases();
  return result.ok ? { ok: true, cases: result.value } : result;
}

export async function listPublishedCases(): Promise<{ ok: true; cases: WorkCase[] } | { ok: false; error: string }> {
  const result = await caseRepository().listPublished();
  return result.ok ? { ok: true, cases: result.value } : { ok: false, error: result.error };
}

export async function getCase(id: string): Promise<{ ok: true; story: WorkCase } | { ok: false; error: string }> {
  const result = await caseRepository().getCase(id);
  return result.ok ? { ok: true, story: result.value } : result;
}

export async function listActions(): Promise<{ ok: true; actions: SeoAction[] } | { ok: false; error: string }> {
  const result = await caseRepository().listActions();
  return result.ok ? { ok: true, actions: result.value } : result;
}

export async function createCase(input: CaseInput, idempotencyKey: string | null = null) {
  const personal = personalReason(input);
  if (personal) return { ok: false as const, error: personal };
  const result = await caseRepository().createCase(input, idempotencyKey);
  return result.ok ? { ok: true as const, story: result.value, replayed: result.replayed === true } : { ok: false as const, error: result.error };
}

export async function updateCase(id: string, version: number, input: Partial<CaseInput>) {
  const result = await caseRepository().updateCase(id, version, input);
  return result.ok ? { ok: true as const, story: result.value } : { ok: false as const, error: result.error };
}

export async function transitionCase(id: string, version: number, to: WorkCaseStatus) {
  const result = await caseRepository().transitionCase(id, version, to);
  return result.ok ? { ok: true as const, story: result.value } : { ok: false as const, error: result.error };
}

export async function attachPhoto(caseId: string, version: number, bytes: Uint8Array, idempotencyKey: string | null = null) {
  const image = await prepareCaseImage(bytes);
  if (!image.ok) return { ok: false as const, error: image.reason };
  const result = await caseRepository().attachPhoto(caseId, version, image.image, idempotencyKey);
  return result.ok ? { ok: true as const, photoId: result.value.photoId, story: result.value.story, replayed: result.replayed === true } : { ok: false as const, error: result.error };
}

export async function reviewPhoto(caseId: string, photoId: string, version: number) {
  const result = await caseRepository().reviewPhoto(caseId, photoId, version);
  return result.ok ? { ok: true as const, story: result.value } : { ok: false as const, error: result.error };
}

export async function publicPhoto(caseId: string, photoId: string) {
  return caseRepository().publicPhoto(caseId, photoId);
}

export async function recordOwnerDecision(action: string, note: string, caseId: string | null = null) {
  const result = await caseRepository().record(action, note, caseId);
  return result.ok ? { ok: true as const, entry: result.value } : { ok: false as const, error: result.error };
}

export function localCaseFileExists(): boolean {
  return existsSync("data/seo-private/store.json");
}

export { createMemoryCaseStore };
