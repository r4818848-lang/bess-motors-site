import type { Database } from "@/lib/store";

/** In-memory snapshot — avoids JSON.parse(localStorage) on every loadDb() during React renders */
let cached: Database | null = null;

export function getCachedDb(): Database | null {
  return cached;
}

export function setCachedDb(db: Database): void {
  cached = db;
}

export function clearDbCache(): void {
  cached = null;
}
