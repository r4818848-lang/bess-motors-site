import type { ImportPartDraft, ImportServiceDraft, ImportWorkOrderDraft } from "@/lib/motowarsztat-import-parser";

export type ImportDraftIssueSeverity = "error" | "warning" | "info";

export type ImportDraftIssue = {
  code: string;
  severity: ImportDraftIssueSeverity;
  row?: number;
  kind?: "service" | "part" | "client" | "vehicle";
};

const INFO_ONLY_CODES = new Set([
  "pdf_recommended",
  "purchase_via_screenshot",
  "no_lines_detected",
]);

const WARNING_CODES = new Set([
  "no_client_name",
  "no_vehicle_detected",
  "no_client_detected",
  "purchase_equals_sell",
  "purchase_above_sell",
]);

export function validateImportDraft(
  draft: ImportWorkOrderDraft,
  options?: { fromImage?: boolean }
): ImportDraftIssue[] {
  const issues: ImportDraftIssue[] = [];

  if (options?.fromImage) {
    issues.push({ code: "pdf_recommended", severity: "info" });
  }

  if (!draft.phone?.trim()) {
    issues.push({ code: "phone_required", severity: "warning", kind: "client" });
  }
  if (!draft.clientName?.trim()) {
    issues.push({ code: "no_client_name", severity: "warning", kind: "client" });
  }
  if (!draft.vin?.trim() && !draft.plate?.trim()) {
    issues.push({ code: "no_vehicle_detected", severity: "warning", kind: "vehicle" });
  }

  draft.services.forEach((s, i) => {
    for (const sub of serviceRowIssues(s)) {
      issues.push({ ...sub, row: i, kind: "service" });
    }
  });

  draft.parts.forEach((p, i) => {
    for (const sub of partRowIssues(p)) {
      issues.push({ ...sub, row: i, kind: "part" });
    }
  });

  if (draft.parts.length > 0 && draft.parts.every((p) => p.purchasePrice <= 0)) {
    issues.push({ code: "purchase_via_screenshot", severity: "info" });
  }

  for (const w of draft.warnings) {
    if (INFO_ONLY_CODES.has(w)) continue;
    if (issues.some((x) => x.code === w)) continue;
    issues.push({
      code: w,
      severity: WARNING_CODES.has(w) ? "warning" : "info",
    });
  }

  return issues;
}

function serviceRowIssues(s: ImportServiceDraft): Omit<ImportDraftIssue, "row" | "kind">[] {
  const out: Omit<ImportDraftIssue, "row" | "kind">[] = [];
  if (!s.name.trim()) out.push({ code: "empty_service_name", severity: "error" });
  if (s.price <= 0) out.push({ code: "zero_sell_price", severity: "error" });
  if (/rabatu|razem|łącznie|lacznie/i.test(s.name)) {
    out.push({ code: "junk_service_line", severity: "error" });
  }
  return out;
}

function partRowIssues(p: ImportPartDraft): Omit<ImportDraftIssue, "row" | "kind">[] {
  const out: Omit<ImportDraftIssue, "row" | "kind">[] = [];
  if (!p.name.trim()) out.push({ code: "empty_part_name", severity: "error" });
  if (p.sellPrice <= 0) out.push({ code: "zero_sell_price", severity: "error" });
  if (
    p.purchasePrice > 0 &&
    p.sellPrice > 0 &&
    Math.abs(p.purchasePrice - p.sellPrice) < 0.02
  ) {
    out.push({ code: "purchase_equals_sell", severity: "warning" });
  }
  if (p.purchasePrice > p.sellPrice && p.sellPrice > 0) {
    out.push({ code: "purchase_above_sell", severity: "warning" });
  }
  return out;
}

export function importDraftHasBlockingIssues(issues: ImportDraftIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}

export function importDraftErrors(issues: ImportDraftIssue[]): ImportDraftIssue[] {
  return issues.filter((i) => i.severity === "error");
}

export function importDraftInfos(issues: ImportDraftIssue[]): ImportDraftIssue[] {
  return issues.filter((i) => i.severity === "info");
}

export function normalizeImportDraftPrices(
  draft: ImportWorkOrderDraft
): ImportWorkOrderDraft {
  return {
    ...draft,
    parts: draft.parts.map((p) => {
      if (
        p.purchasePrice > 0 &&
        p.sellPrice > 0 &&
        Math.abs(p.purchasePrice - p.sellPrice) < 0.02
      ) {
        return { ...p, purchasePrice: 0 };
      }
      if (p.purchasePrice > p.sellPrice && p.sellPrice > 0) {
        return { ...p, purchasePrice: 0 };
      }
      return p;
    }),
  };
}

export function issueAffectsRow(
  issues: ImportDraftIssue[],
  kind: "service" | "part",
  index: number
): boolean {
  return issues.some(
    (i) => i.kind === kind && i.row === index && i.severity === "error"
  );
}
