import type { Operation } from "@/lib/smart-scheduler/catalog";
import type { PartsStatus } from "@/lib/smart-scheduler/schedule";
import { resourceReady, type ResourceSetting } from "@/lib/smart-scheduler/settings";

const EXCLUDED = [
  /грм|rozrz[aą]d|timing belt/i,
  /сцеплен|sprz[eę]g/i,
  /\bdsg\b/i,
  /сложн\w*.*двигат|remont silnika|engine overhaul/i,
  /непредсказ|złożonej usterki|zlozonej usterki/i,
];

export function excludedFromAuto(operation: Pick<Operation, "operationNameRu" | "operationNamePl" | "bookingMode">): boolean {
  const text = `${operation.operationNameRu} ${operation.operationNamePl}`;
  return EXCLUDED.some((pattern) => pattern.test(text));
}

export function canAutoBook(input: {
  operation: Operation;
  parts?: PartsStatus;
  resources: ResourceSetting[];
  resourceIds: string[];
}): { auto: boolean; reason: string } {
  if (input.operation.bookingMode === "MANUAL" || input.operation.baseLaborHours == null) {
    return { auto: false, reason: "manual" };
  }
  if (excludedFromAuto(input.operation)) return { auto: false, reason: "excluded_work" };
  if (input.parts !== "available") return { auto: false, reason: "parts" };
  if (input.resourceIds.some((id) => !resourceReady(input.resources, id))) return { auto: false, reason: "equipment" };
  if (input.operation.bookingMode === "APPROVAL") return { auto: false, reason: "approval" };
  return { auto: true, reason: "ok" };
}
