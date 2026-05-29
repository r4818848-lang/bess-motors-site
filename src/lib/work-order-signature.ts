import type { WorkOrder, SignatureMode } from "./store";

export type { SignatureMode };

export function resolveSignatureMode(
  order: Pick<WorkOrder, "signatureMode">
): SignatureMode {
  return order.signatureMode === "physical" ? "physical" : "electronic";
}

export function isElectronicSignature(
  order: Pick<WorkOrder, "signatureMode">
): boolean {
  return resolveSignatureMode(order) === "electronic";
}
